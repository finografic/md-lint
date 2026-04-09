import pc from 'picocolors';
import type { LintResults, LintError } from 'markdownlint';

/**
 * Format lint results to a string matching markdownlint-cli2 output style.
 *
 * Example:
 *   README.md:3 MD022/blanks-around-headings Headings should be surrounded by blank lines [...]
 *   docs/guide.md:15:81 MD013/line-length Line length [Expected: 80; Actual: 120]
 */
export function formatResults(results: LintResults): string {
  const lines: string[] = [];

  // Sort by file path for deterministic output
  const sortedPaths = Object.keys(results).sort();

  for (const filePath of sortedPaths) {
    const errors = results[filePath] as LintError[];
    if (!errors || errors.length === 0) continue;

    for (const error of errors) {
      const location = error.errorRange
        ? `${filePath}:${error.lineNumber}:${error.errorRange[0]}`
        : `${filePath}:${error.lineNumber}`;

      const ruleNames = error.ruleNames.join('/');
      const detail = error.errorDetail ? ` [${error.errorDetail}]` : '';
      const context = error.errorContext ? ` [Context: "${error.errorContext}"]` : '';

      lines.push(`${pc.cyan(location)} ${pc.red(ruleNames)} ${error.ruleDescription}${detail}${context}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a summary line.
 */
export function formatSummary(counts: {
  filesTotal: number;
  filesStandard: number;
  filesAgent: number;
  errorsTotal: number;
}): string {
  const parts = [
    `Linted ${pc.bold(String(counts.filesTotal))} file(s)`,
    `(${counts.filesStandard} standard, ${counts.filesAgent} agent)`,
  ];

  if (counts.errorsTotal > 0) {
    parts.push(`— ${pc.red(pc.bold(String(counts.errorsTotal)))} error(s)`);
  } else {
    parts.push(`— ${pc.green('no errors')}`);
  }

  return parts.join(' ');
}
