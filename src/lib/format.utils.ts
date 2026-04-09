import pc from 'picocolors';
import type { LintResults, LintError } from 'markdownlint';

/**
 * Format lint results for stderr: location on its own line (cyan), then rule + description
 * (red + plain), then a blank line before the next violation.
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

      lines.push(pc.yellow(location));
      lines.push(`${pc.red(ruleNames)} ${error.ruleDescription}${detail}${context}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
