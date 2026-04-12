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
      lines.push(pc.bold(filePath));

      lines.push(
        error.ruleNames.length === 1
          ? pc.red(pc.bold(error.ruleNames[0]))
          : pc.red(`${pc.bold(error.ruleNames[0])}: ${error.ruleNames.slice(1).join(', ')}`),
      );

      lines.push(pc.yellow(error.ruleDescription));

      lines.push(
        error.errorRange
          ? pc.gray(`line:${error.lineNumber}, column:${error.errorRange[0]}`)
          : pc.gray(`line:${error.lineNumber}`),
      );

      if (error.errorDetail) {
        lines.push(pc.gray(error.errorDetail));
      }

      if (error.errorContext) {
        // lines.push(`[Context: "${error.errorContext}"]`);
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}
