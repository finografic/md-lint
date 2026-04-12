import { describe, expect, it } from 'vitest';
import type { LintError, LintResults } from 'markdownlint';

import { formatResults } from './format.utils.js';

describe('formatResults', () => {
  it('puts location on its own line and separates violations with a blank line', () => {
    const errors = [
      {
        lineNumber: 2,
        ruleNames: ['MD001', 'heading-increment'],
        ruleDescription: 'Heading levels should only increment by one level at a time',
        ruleInformation: 'https://example.com',
        errorRange: null,
        fixInfo: null,
      },
    ] as LintError[];
    const out = formatResults({ 'docs/a.md': errors } as LintResults);

    expect(out).toBe(
      [
        'docs/a.md',
        'MD001: heading-increment',
        'Heading levels should only increment by one level at a time',
        'line:2',
        '',
      ].join('\n'),
    );
  });
});
