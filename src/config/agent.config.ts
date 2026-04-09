import type { Configuration } from 'markdownlint';

/**
 * Agent markdown rules — relaxed for AI instruction docs.
 *
 * Agent docs (CLAUDE.md, .github/skills/*.md, etc.) are consumed by
 * LLMs, not rendered for humans. Their structure is intentionally
 * flexible: no H1 requirement, inline HTML allowed, bare URLs fine,
 * duplicate headings common across sections, etc.
 *
 * We still enforce basic hygiene that prevents parse failures.
 */
export const agentConfig: Configuration = {
  'default': true,

  // ── Keep enabled (structural hygiene) ───────────────
  'heading-style': { style: 'atx' }, // MD003 — consistency still matters
  'heading-increment': true, // MD001 — don't skip levels
  'no-trailing-spaces': true, // MD009
  'blanks-around-fences': true, // MD031 — prevents parse failures
  'code-fence-style': { style: 'backtick' }, // MD048
  'code-block-style': { style: 'fenced' }, // MD046
  'no-empty-links': true, // MD042
  'no-space-in-emphasis': true, // MD037
  'no-space-in-code': true, // MD038

  // ── Disabled (too restrictive for agent docs) ───────
  'first-line-heading': false, // MD041 — agents often start with context blocks
  'line-length': false, // MD013 — agent docs are long-form
  'no-inline-html': false, // MD033 — agent docs embed HTML snippets
  'no-duplicate-heading': false, // MD024 — repeated sections common
  'no-bare-urls': false, // MD034 — reference URLs are fine bare
  'no-emphasis-as-heading': false, // MD036 — bold-as-heading is common pattern
  'blanks-around-headings': false, // MD022 — tighter layout in instruction docs
  'blanks-around-lists': false, // MD032 — same reason
  'no-multiple-blanks': false, // MD012 — visual separation in long docs
  'fenced-code-language': false, // MD040 — pseudo-code blocks without language
  'ol-prefix': false, // MD029 — numbering style varies
  'link-image-style': false, // MD054 — mixed link styles
};
