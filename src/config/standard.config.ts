import type { Configuration } from 'markdownlint';

/**
 * Standard markdown rules — READMEs, docs, guides.
 *
 * These enforce consistent structure and prevent common mistakes
 * that affect readability and cross-parser compatibility.
 */
export const standardConfig: Configuration = {
  'default': true,

  // ── Headings ────────────────────────────────────────
  'heading-style': { style: 'atx' }, // MD003 — # style only
  'heading-increment': true, // MD001 — no skipping levels
  'first-line-heading': { level: 1 }, // MD041 — must start with H1
  'no-duplicate-heading': { siblings_only: true }, // MD024 — allow same text under different parents
  'no-trailing-punctuation': false, // MD026 - no trailing punctuation in heading

  // ── Whitespace ──────────────────────────────────────
  'no-trailing-spaces': true, // MD009
  'no-multiple-blanks': { maximum: 1 }, // MD012
  'blanks-around-headings': true, // MD022
  'blanks-around-fences': true, // MD031
  'blanks-around-lists': true, // MD032

  // ── Line length ─────────────────────────────────────
  'line-length': false, // MD013 — disabled; oxfmt handles wrapping

  // ── Lists ───────────────────────────────────────────
  'list-marker-space': true, // MD030
  'ul-style': { style: 'dash' }, // MD004 — consistent dash markers
  'ol-prefix': { style: 'ordered' }, // MD029 — 1. 2. 3. not 1. 1. 1.
  'list-indent': true, // MD007

  // ── Code ────────────────────────────────────────────
  'code-fence-style': { style: 'backtick' }, // MD048
  'fenced-code-language': false, // MD040 — require language identifier
  'code-block-style': { style: 'fenced' }, // MD046 — fenced only, no indented

  // ── Links / Images ──────────────────────────────────
  'no-empty-links': true, // MD042
  'link-image-style': { autolink: false }, // MD054 — disallow <url> autolinks

  // ── HTML ────────────────────────────────────────────
  'no-inline-html': { allowed_elements: ['br', 'sub', 'sup', 'details', 'summary'] }, // MD033

  // ── Misc ────────────────────────────────────────────
  'no-bare-urls': true, // MD034
  'no-emphasis-as-heading': true, // MD036
  'no-space-in-emphasis': true, // MD037
  'no-space-in-code': true, // MD038
};
