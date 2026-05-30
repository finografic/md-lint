import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { standardConfig } from '../config/standard.config.js';
import {
  filterPathsByIgnorePatterns,
  findConsumerMarkdownlintPaths,
  findVscodeSettingsPath,
  loadConsumerMarkdownlintConfig,
  loadVscodeMarkdownlintConfig,
  mergeMarkdownlintConfig,
  normalizeMarkdownlintConfigKeys,
  parseMarkdownlintIgnoreFile,
  parseScopedConsumerConfig,
  resolveConsumerMarkdownlintOverlay,
} from './consumer-markdownlint.utils.js';

describe('filterPathsByIgnorePatterns', () => {
  it('drops absolute paths under an ignored directory (lint-staged style)', () => {
    const cwd = '/proj';
    const abs = '/proj/vault/transcripts/note.md';
    const out = filterPathsByIgnorePatterns([abs], cwd, ['vault/transcripts/']);
    expect(out).toEqual([]);
  });
});

describe('parseMarkdownlintIgnoreFile', () => {
  it('strips comments, blanks, and trims patterns', () => {
    const raw = `# head
packages/build/*.template

node_modules/
`;
    expect(parseMarkdownlintIgnoreFile(raw)).toEqual(['packages/build/*.template', 'node_modules/']);
  });
});

describe('normalizeMarkdownlintConfigKeys', () => {
  it('maps MD013 onto line-length so a single canonical key remains', () => {
    const normalized = normalizeMarkdownlintConfigKeys({
      'line-length': false,
      'MD013': { line_length: 120 },
    });
    expect(normalized['line-length']).toEqual({ line_length: 120 });
    expect(normalized.MD013).toBeUndefined();
  });
});

describe('mergeMarkdownlintConfig', () => {
  it('overrides boolean rules and deep-merges object rule options', () => {
    const base = {
      default: true,
      MD040: true,
      MD025: { level: 1, front_matter_title: '^x' },
    };
    const overlay = {
      MD040: false,
      MD025: { enabled: false },
    };
    const m = mergeMarkdownlintConfig(base, overlay);
    expect(m['fenced-code-language']).toBe(false);
    expect(m['single-title']).toEqual({ level: 1, front_matter_title: '^x', enabled: false });
  });

  it('lets consumer MD013: false override preset line-length: false', () => {
    const merged = mergeMarkdownlintConfig(standardConfig, { MD013: false });
    expect(merged['line-length']).toBe(false);
    expect(merged.MD013).toBeUndefined();
  });
});

describe('resolveConsumerMarkdownlintOverlay', () => {
  it('prefers .markdownlint.jsonc over VS Code settings', () => {
    const combined = resolveConsumerMarkdownlintOverlay({
      vscodeConfig: { MD013: { line_length: 120 } },
      fileConfig: { MD013: false },
    });
    expect(combined?.['line-length']).toBe(false);
  });
});

describe('loadVscodeMarkdownlintConfig', () => {
  it('reads markdownlint.config from .vscode/settings.json', () => {
    const root = mkdtempSync(join(tmpdir(), 'md-lint-vscode-'));
    mkdirSync(join(root, '.vscode'), { recursive: true });
    writeFileSync(
      join(root, '.vscode', 'settings.json'),
      `{
      "markdownlint.config": {
        "MD036": false
      }
    }\n`,
    );

    const cfg = loadVscodeMarkdownlintConfig(join(root, '.vscode', 'settings.json'));
    expect(cfg?.['no-emphasis-as-heading']).toBe(false);
  });
});

describe('findVscodeSettingsPath', () => {
  it('finds settings.json at the git root from a nested cwd', () => {
    const root = mkdtempSync(join(tmpdir(), 'md-lint-vscode-walk-'));
    mkdirSync(join(root, '.git'), { recursive: true });
    mkdirSync(join(root, '.vscode'), { recursive: true });
    writeFileSync(join(root, '.vscode', 'settings.json'), '{}\n');
    const nested = join(root, 'apps', 'web');
    mkdirSync(nested, { recursive: true });

    expect(findVscodeSettingsPath(nested)).toBe(join(root, '.vscode', 'settings.json'));
  });

  it('ignores nested .vscode folders above cwd but below git root', () => {
    const root = mkdtempSync(join(tmpdir(), 'md-lint-vscode-nested-'));
    mkdirSync(join(root, '.git'), { recursive: true });
    mkdirSync(join(root, '.vscode'), { recursive: true });
    writeFileSync(join(root, '.vscode', 'settings.json'), '{ "markdownlint.config": { "MD036": false } }\n');
    const nested = join(root, 'packages', 'app');
    mkdirSync(join(nested, '.vscode'), { recursive: true });
    writeFileSync(
      join(nested, '.vscode', 'settings.json'),
      '{ "markdownlint.config": { "MD041": false } }\n',
    );
    mkdirSync(nested, { recursive: true });

    expect(findVscodeSettingsPath(nested)).toBe(join(root, '.vscode', 'settings.json'));
  });
});

describe('findConsumerMarkdownlintPaths', () => {
  it('finds config and ignore walking up from a nested cwd', () => {
    const root = mkdtempSync(join(tmpdir(), 'md-lint-consumer-'));
    writeFileSync(join(root, '.markdownlint.jsonc'), '{}\n');
    writeFileSync(join(root, '.markdownlintignore'), 'vendor/**\n');
    const nested = join(root, 'apps', 'web');
    mkdirSync(nested, { recursive: true });

    const { configPath, ignorePath } = findConsumerMarkdownlintPaths(nested);
    expect(configPath).toBe(join(root, '.markdownlint.jsonc'));
    expect(ignorePath).toBe(join(root, '.markdownlintignore'));
  });
});

describe('loadConsumerMarkdownlintConfig', () => {
  it('parses JSONC comments and trailing commas', () => {
    const root = mkdtempSync(join(tmpdir(), 'md-lint-jsonc-'));
    const path = join(root, '.markdownlint.jsonc');
    writeFileSync(
      path,
      `{
      // comment
      "MD040": false,
    }\n`,
    );
    const cfg = loadConsumerMarkdownlintConfig(path);
    expect(cfg['fenced-code-language']).toBe(false);
  });
});

describe('parseScopedConsumerConfig', () => {
  it('splits global rules from @finografic/overrides scopes', () => {
    const parsed = parseScopedConsumerConfig({
      'MD025': false,
      '@finografic/overrides': {
        standard: { MD001: false },
        vault: {
          MD001: { front_matter_title: '^\\s*title\\s*[:=]' },
        },
      },
    } as unknown as Parameters<typeof parseScopedConsumerConfig>[0]);

    expect(parsed.global?.['single-title']).toBe(false);
    expect(parsed.standard?.['heading-increment']).toBe(false);
    expect(parsed.agent).toBeNull();
    expect(parsed.vault?.['heading-increment']).toEqual({
      front_matter_title: '^\\s*title\\s*[:=]',
    });
  });
});
