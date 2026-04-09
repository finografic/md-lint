import { stripVTControlCharacters } from 'node:util';
import { describe, expect, it } from 'vitest';

import { formatSummary } from './summary.utils.js';

function plain(text: string): string {
  return stripVTControlCharacters(text);
}

describe('formatSummary', () => {
  it('uses singular “file” for one file and plural intelligent recap', () => {
    const out = plain(
      formatSummary({
        filesStandard: 1,
        filesAgent: 0,
        filesTotal: 1,
        errorsStandard: 27,
        errorsAgent: 0,
        errorsTotal: 27,
        fixesApplied: 0,
      }),
    );

    expect(out).toContain('Linted 1 file');
    expect(out).toContain('- 1 standard md file');
    expect(out).toContain('- 0 agent md files');
    expect(out).toContain('27 errors');
    expect(out.endsWith('\n\n')).toBe(true);
  });

  it('shows errors / fixes recap when fixes were applied', () => {
    const out = plain(
      formatSummary({
        filesStandard: 1,
        filesAgent: 0,
        filesTotal: 1,
        errorsStandard: 5,
        errorsAgent: 0,
        errorsTotal: 5,
        fixesApplied: 3,
      }),
    );

    expect(out).toContain('5 errors / 3 fixes');
  });

  it('uses singular “fix” for one applied fix', () => {
    const out = plain(
      formatSummary({
        filesStandard: 1,
        filesAgent: 0,
        filesTotal: 1,
        errorsStandard: 1,
        errorsAgent: 0,
        errorsTotal: 1,
        fixesApplied: 1,
      }),
    );

    expect(out).toContain('1 error / 1 fix');
  });

  it('prints No errors when clean', () => {
    const out = plain(
      formatSummary({
        filesStandard: 1,
        filesAgent: 0,
        filesTotal: 1,
        errorsStandard: 0,
        errorsAgent: 0,
        errorsTotal: 0,
        fixesApplied: 0,
      }),
    );

    expect(out).toContain('No errors');
  });
});
