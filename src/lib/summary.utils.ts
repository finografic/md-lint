import pc from 'picocolors';

/**
 * Counts passed to {@link formatSummary}. Mirrors `LintAllResult['counts']`.
 */
export type SummaryCounts = {
  filesStandard: number;
  filesAgent: number;
  filesTotal: number;
  errorsStandard: number;
  errorsAgent: number;
  errorsTotal: number;
  fixesApplied: number;
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Right-align a number for column alignment. */
function padNum(n: number, width: number): string {
  return String(n).padStart(width);
}

function styleErrorCount(n: number, errColW: number): string {
  const num = padNum(n, errColW);
  const word = pluralize(n, 'error', 'errors');
  const phrase = `${num} ${word}`;
  return n > 0 ? pc.red(phrase) : phrase;
}

/**
 * Multi-line summary block: linted file count, per-scope bullets with aligned columns,
 * then a recap line (errors vs fixes). Tweak layout here without touching the CLI.
 *
 * Ends with two newlines so the next process (e.g. husky) is visually separated from the summary.
 */
export function formatSummary(counts: SummaryCounts): string {
  const lines: string[] = [];

  lines.push(pc.bold(`Linted ${counts.filesTotal} ${pluralize(counts.filesTotal, 'file', 'files')}`));
  lines.push('');

  const fileColW = Math.max(String(counts.filesStandard).length, String(counts.filesAgent).length, 1);
  const errColW = Math.max(String(counts.errorsStandard).length, String(counts.errorsAgent).length, 1);

  const standardLabel = `${pluralize(counts.filesStandard, 'standard md file', 'standard md files')}`;
  const agentLabel = `${pluralize(counts.filesAgent, 'agent md file', 'agent md files')}`;
  const labelW = Math.max(standardLabel.length, agentLabel.length);

  const stdLine = `- ${padNum(counts.filesStandard, fileColW)} ${standardLabel.padEnd(labelW)}:  ${styleErrorCount(counts.errorsStandard, errColW)}`;
  lines.push(stdLine);

  const agentLine = `- ${padNum(counts.filesAgent, fileColW)} ${agentLabel.padEnd(labelW)}:  ${styleErrorCount(counts.errorsAgent, errColW)}`;
  lines.push(agentLine);
  lines.push('');

  if (counts.fixesApplied > 0) {
    const fixWord = pluralize(counts.fixesApplied, 'fix', 'fixes');
    const errRecap = `${counts.errorsTotal} ${pluralize(counts.errorsTotal, 'error', 'errors')}`;
    const fixRecap = `${counts.fixesApplied} ${fixWord}`;
    const errStyled = counts.errorsTotal > 0 ? pc.red(errRecap) : errRecap;
    lines.push(`${errStyled} / ${pc.green(fixRecap)}`);
  } else if (counts.errorsTotal > 0) {
    lines.push(pc.red(`${counts.errorsTotal} ${pluralize(counts.errorsTotal, 'error', 'errors')}`));
  } else {
    lines.push(pc.green('No errors'));
  }

  return `${lines.join('\n')}\n\n`;
}
