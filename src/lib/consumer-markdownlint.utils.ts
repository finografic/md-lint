import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import ignore from 'ignore';
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser';
import { readConfig } from 'markdownlint/sync';
import type { FileCategory } from './classify.utils.js';
import type { ParseError } from 'jsonc-parser';
import type { Configuration, ConfigurationParser } from 'markdownlint';

import { MARKDOWNLINT_ALIAS_TO_KEBAB } from '../config/markdownlint-rule-aliases.js';

const RESERVED_CONFIG_KEYS = new Set(['$schema', 'extends', 'default']);

/** Top-level keys in `.markdownlint.jsonc` that hold per-category rule overlays. */
export const SCOPED_CATEGORY_KEYS = ['standard', 'agent', 'vault'] as const satisfies readonly FileCategory[];

export type ScopedCategoryKey = (typeof SCOPED_CATEGORY_KEYS)[number];

const scopedCategoryKeySet = new Set<string>(SCOPED_CATEGORY_KEYS);

const aliasToKebabRuleName = new Map<string, string>(Object.entries(MARKDOWNLINT_ALIAS_TO_KEBAB));

/**
 * Collapse `MD013` / `line-length` (and other aliases) onto one kebab-case key so merges with finografic
 * presets do not leave duplicate entries where the last Object.entries pass wins unpredictably.
 */
export function normalizeMarkdownlintConfigKeys(config: Configuration): Configuration {
  const aliasMap = aliasToKebabRuleName;
  const out: Configuration = {};

  for (const [key, value] of Object.entries(config)) {
    if (RESERVED_CONFIG_KEYS.has(key)) {
      (out as Record<string, unknown>)[key] = value;
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }

    const canonical = aliasMap.get(key.toUpperCase()) ?? key;
    const existing = (out as Record<string, unknown>)[canonical];

    if (isRuleOptionsObject(existing) && isRuleOptionsObject(value)) {
      (out as Record<string, unknown>)[canonical] = {
        ...(existing as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else {
      (out as Record<string, unknown>)[canonical] = value;
    }
  }

  return out;
}

/**
 * Walk upward from `cwd` and return the first `.markdownlint.jsonc` or `.markdownlint.json` and the first
 * `.markdownlintignore` (consumer convention, same as markdownlint-cli).
 */
export function findConsumerMarkdownlintPaths(cwd: string): {
  configPath: string | null;
  ignorePath: string | null;
} {
  let dir = resolve(cwd);
  let configPath: string | null = null;
  let ignorePath: string | null = null;

  for (;;) {
    if (!configPath) {
      const jsonc = join(dir, '.markdownlint.jsonc');
      const json = join(dir, '.markdownlint.json');
      if (existsSync(jsonc)) {
        configPath = jsonc;
      } else if (existsSync(json)) {
        configPath = json;
      }
    }
    if (!ignorePath) {
      const ign = join(dir, '.markdownlintignore');
      if (existsSync(ign)) {
        ignorePath = ign;
      }
    }
    if (configPath && ignorePath) {
      break;
    }
    // Do not walk above the Git work tree (avoids picking up ~/.markdownlint.jsonc, sibling repos, etc.)
    if (existsSync(join(dir, '.git'))) {
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return { configPath, ignorePath };
}

/**
 * Return `.vscode/settings.json` at the git work-tree root for `cwd`, if any.
 *
 * Only the repo-root settings file is used (not nested `.vscode` folders), matching how `.markdownlint.jsonc`
 * discovery stops at `.git`.
 */
export function findVscodeSettingsPath(cwd: string): string | null {
  let dir = resolve(cwd);

  for (;;) {
    if (existsSync(join(dir, '.git'))) {
      const settingsPath = join(dir, '.vscode', 'settings.json');
      return existsSync(settingsPath) ? settingsPath : null;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

function parseJsoncObject(text: string, label: string): Record<string, unknown> {
  const errors: ParseError[] = [];
  const data = parseJsonc(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  if (errors.length > 0) {
    const e = errors[0];
    throw new Error(`JSONC: ${printParseErrorCode(e.error)} at offset ${e.offset} in ${label}`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }
  return data as Record<string, unknown>;
}

/**
 * Load `markdownlint.config` from `.vscode/settings.json` when present (VS Code / Cursor workspace settings).
 */
export function loadVscodeMarkdownlintConfig(settingsPath: string): Configuration | null {
  const data = parseJsoncObject(readFileSync(settingsPath, 'utf8'), settingsPath);
  const block = data['markdownlint.config'];
  if (block === null || block === undefined) {
    return null;
  }
  if (typeof block !== 'object' || Array.isArray(block)) {
    throw new Error(`Invalid markdownlint.config in ${settingsPath}: expected an object`);
  }
  return normalizeMarkdownlintConfigKeys(block as Configuration);
}

/**
 * Merge optional VS Code settings and `.markdownlint.json(c)` overrides (file wins over VS Code).
 */
export function resolveConsumerMarkdownlintOverlay(options: {
  vscodeConfig: Configuration | null;
  fileConfig: Configuration | null;
}): Configuration | null {
  const { vscodeConfig, fileConfig } = options;
  if (vscodeConfig === null && fileConfig === null) {
    return null;
  }
  if (vscodeConfig === null) {
    return fileConfig;
  }
  if (fileConfig === null) {
    return vscodeConfig;
  }
  return mergeMarkdownlintConfig(vscodeConfig, fileConfig);
}

export interface ScopedConsumerConfig {
  /** Rule overrides applied to every category (before category-specific overlays). */
  global: Configuration | null;
  standard: Configuration | null;
  agent: Configuration | null;
  vault: Configuration | null;
}

function isScopedCategoryKey(key: string): key is ScopedCategoryKey {
  return scopedCategoryKeySet.has(key);
}

/**
 * Split a consumer config into global rule overrides and optional `standard` / `agent` / `vault` scopes.
 *
 * Top-level rule keys (e.g. `MD025`) apply to all categories. Scoped objects merge on top for that bucket
 * only.
 */
export function parseScopedConsumerConfig(raw: Configuration): ScopedConsumerConfig {
  const global: Configuration = {};
  const scoped: Record<ScopedCategoryKey, Configuration> = {
    standard: {},
    agent: {},
    vault: {},
  };

  for (const [key, value] of Object.entries(raw)) {
    if (RESERVED_CONFIG_KEYS.has(key)) {
      continue;
    }
    if (isScopedCategoryKey(key)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        scoped[key] = normalizeMarkdownlintConfigKeys(value as Configuration);
      }
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    (global as Record<string, unknown>)[key] = value;
  }

  const normalizedGlobal = normalizeMarkdownlintConfigKeys(global);
  const hasGlobal = Object.keys(normalizedGlobal).some((k) => !RESERVED_CONFIG_KEYS.has(k));

  return {
    global: hasGlobal ? normalizedGlobal : null,
    standard: Object.keys(scoped.standard).length > 0 ? scoped.standard : null,
    agent: Object.keys(scoped.agent).length > 0 ? scoped.agent : null,
    vault: Object.keys(scoped.vault).length > 0 ? scoped.vault : null,
  };
}

/**
 * Merge finografic preset + global consumer overlay + optional category overlay.
 */
export function buildEffectiveCategoryConfig(
  preset: Configuration,
  globalOverlay: Configuration | null,
  categoryOverlay: Configuration | null,
): Configuration {
  let config = preset;
  if (globalOverlay !== null) {
    config = mergeMarkdownlintConfig(config, globalOverlay);
  }
  if (categoryOverlay !== null) {
    config = mergeMarkdownlintConfig(config, categoryOverlay);
  }
  return config;
}

/**
 * Resolve global overlay from file + VS Code, then return scoped category overlays from the file only.
 */
export function resolveScopedConsumerConfig(options: {
  vscodeConfig: Configuration | null;
  fileConfig: Configuration | null;
}): ScopedConsumerConfig {
  if (options.fileConfig === null) {
    return {
      global: options.vscodeConfig,
      standard: null,
      agent: null,
      vault: null,
    };
  }

  const parsed = parseScopedConsumerConfig(options.fileConfig);
  return {
    global: resolveConsumerMarkdownlintOverlay({
      vscodeConfig: options.vscodeConfig,
      fileConfig: parsed.global,
    }),
    standard: parsed.standard,
    agent: parsed.agent,
    vault: parsed.vault,
  };
}

/**
 * Parse `.markdownlintignore` body: `#` comments, blank lines stripped; trim each pattern.
 */
export function parseMarkdownlintIgnoreFile(content: string): string[] {
  const lines: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    lines.push(trimmed);
  }
  return lines;
}

function jsoncConfigurationParser(text: string): Configuration {
  const errors: ParseError[] = [];
  const data = parseJsonc(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  if (errors.length > 0) {
    const e = errors[0];
    throw new Error(`JSONC: ${printParseErrorCode(e.error)} at offset ${e.offset} in .markdownlint.jsonc`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }
  return data as Configuration;
}

const jsoncParsers: ConfigurationParser[] = [jsoncConfigurationParser];

/**
 * Load consumer config from disk. Resolves `extends` relative to the config file (markdownlint).
 */
export function loadConsumerMarkdownlintConfig(configPath: string): Configuration {
  const parsers = configPath.endsWith('.jsonc') ? jsoncParsers : undefined;
  const config = readConfig(configPath, parsers);
  const copy = { ...config } as Record<string, unknown>;
  delete copy['$schema'];
  return normalizeMarkdownlintConfigKeys(copy as Configuration);
}

function isRuleOptionsObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merge per rule: consumer keys override finografic presets. Non-object values replace.
 */
export function mergeMarkdownlintConfig(base: Configuration, overlay: Configuration): Configuration {
  const out: Configuration = { ...normalizeMarkdownlintConfigKeys(base) };
  const normalizedOverlay = normalizeMarkdownlintConfigKeys(overlay);
  for (const [key, value] of Object.entries(normalizedOverlay)) {
    if (RESERVED_CONFIG_KEYS.has(key)) {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    const existing = out[key as keyof Configuration];
    if (isRuleOptionsObject(existing) && isRuleOptionsObject(value)) {
      (out as Record<string, unknown>)[key] = {
        ...(existing as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function readMarkdownlintIgnorePatterns(ignorePath: string): string[] {
  return parseMarkdownlintIgnoreFile(readFileSync(ignorePath, 'utf8'));
}

/**
 * Gitignore-style filter for paths relative to `cwd`.
 *
 * **Why:** `globby` does not apply `ignore` to **absolute** positive patterns (e.g. paths passed by
 * lint-staged). This enforces the same built-in + `.markdownlintignore` rules for every path.
 */
export function filterPathsByIgnorePatterns(
  paths: string[],
  cwd: string,
  patterns: readonly string[],
): string[] {
  if (patterns.length === 0 || paths.length === 0) {
    return paths;
  }

  const ig = ignore().add([...patterns]);

  return paths.filter((p) => {
    const abs = isAbsolute(p) ? p : resolve(cwd, p);
    const rel = relative(cwd, abs).replace(/\\/g, '/');
    return !ig.ignores(rel);
  });
}
