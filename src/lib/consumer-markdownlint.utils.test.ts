import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  filterPathsByIgnorePatterns,
  findConsumerMarkdownlintPaths,
  loadConsumerMarkdownlintConfig,
  mergeMarkdownlintConfig,
  parseMarkdownlintIgnoreFile,
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
    expect(m.MD040).toBe(false);
    expect(m.MD025).toEqual({ level: 1, front_matter_title: '^x', enabled: false });
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
    expect(cfg.MD040).toBe(false);
  });
});
