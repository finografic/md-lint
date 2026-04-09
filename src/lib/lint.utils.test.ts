import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

import { lintAll } from './lint.utils.js';

const FIXTURES = resolve(import.meta.dirname, '../../fixtures');

describe('lintAll', () => {
  it('returns no errors for good standard markdown', async () => {
    const result = await lintAll({
      cwd: resolve(FIXTURES, 'standard-good'),
    });

    expect(result.counts.errorsTotal).toBe(0);
    expect(result.counts.filesStandard).toBe(1);
    expect(result.counts.filesAgent).toBe(0);
    expect(result.counts.fixesApplied).toBe(0);
  });

  it('returns errors for standard violations (missing H1, missing code fence language)', async () => {
    const result = await lintAll({
      cwd: resolve(FIXTURES, 'standard-bad'),
    });

    expect(result.counts.filesStandard).toBe(1);
    const errors = result.results['README.md'] ?? [];
    const md041Errors = errors.filter((e) => e.ruleNames.includes('MD041'));
    expect(md041Errors.length).toBeGreaterThan(0);
  });

  it('uses relaxed rules for agent files — CLAUDE.md passes with no H1, bare URLs, etc.', async () => {
    const result = await lintAll({
      cwd: resolve(FIXTURES, 'agent-good'),
    });

    expect(result.counts.filesAgent).toBe(1);
    expect(result.counts.filesStandard).toBe(0);

    const errors = result.results['CLAUDE.md'] ?? [];
    const md041Errors = errors.filter((e) => e.ruleNames.includes('MD041'));
    expect(md041Errors).toHaveLength(0);
  });

  it('reports MD001 (heading increment) even for agent files', async () => {
    const result = await lintAll({
      cwd: resolve(FIXTURES, 'agent-bad'),
    });

    expect(result.counts.filesAgent).toBe(1);
    const errors = result.results['.github/instructions/style.md'] ?? [];
    const md001Errors = errors.filter((e) => e.ruleNames.includes('MD001'));
    expect(md001Errors.length).toBeGreaterThan(0);
  });

  it('standard files DO get MD041 error for missing H1', async () => {
    const result = await lintAll({
      cwd: resolve(FIXTURES, 'standard-bad'),
    });

    const errors = result.results['README.md'] ?? [];
    const md041Errors = errors.filter((e) => e.ruleNames.includes('MD041'));
    expect(md041Errors.length).toBeGreaterThan(0);
  });

  it('--only standard skips agent files', async () => {
    const result = await lintAll({
      only: 'standard',
      cwd: resolve(FIXTURES, 'mixed'),
    });

    expect(result.counts.filesAgent).toBe(0);
    expect(result.counts.filesStandard).toBeGreaterThan(0);
  });

  it('--only agent skips standard files', async () => {
    const result = await lintAll({
      only: 'agent',
      cwd: resolve(FIXTURES, 'mixed'),
    });

    expect(result.counts.filesStandard).toBe(0);
    expect(result.counts.filesAgent).toBeGreaterThan(0);
  });

  it('correctly classifies mixed directory — README.md standard, CONVENTIONS.md agent', async () => {
    const result = await lintAll({
      cwd: resolve(FIXTURES, 'mixed'),
    });

    expect(result.counts.filesStandard).toBe(1);
    expect(result.counts.filesAgent).toBe(1);
    expect('README.md' in result.results).toBe(true);
    expect('CONVENTIONS.md' in result.results).toBe(true);
  });

  it('returns zero counts when no files match', async () => {
    const result = await lintAll({
      globs: ['nonexistent/**/*.md'],
      cwd: resolve(FIXTURES, 'standard-good'),
    });

    expect(result.counts.filesTotal).toBe(0);
    expect(result.counts.errorsTotal).toBe(0);
    expect(result.counts.fixesApplied).toBe(0);
  });
});
