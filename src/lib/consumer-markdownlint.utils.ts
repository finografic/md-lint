import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import ignore from 'ignore';
import { parse as parseJsonc, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { readConfig } from 'markdownlint/sync';
import type { Configuration, ConfigurationParser } from 'markdownlint';

/**
 * Walk upward from `cwd` and return the first `.markdownlint.jsonc` or `.markdownlint.json`
 * and the first `.markdownlintignore` (consumer convention, same as markdownlint-cli).
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
  return copy as Configuration;
}

function isRuleOptionsObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merge per rule: consumer keys override finografic presets. Non-object values replace.
 */
export function mergeMarkdownlintConfig(base: Configuration, overlay: Configuration): Configuration {
  const out: Configuration = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (key === '$schema' || key === 'extends') {
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
