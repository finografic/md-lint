import type { Configuration } from 'markdownlint';
import { defineRules, mapToConfig } from './rule-map.js';

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
const rules = defineRules([
  // ── Keep enabled (structural hygiene) ───────────────
  ['MD001', { 'heading-increment': true }],            // don't skip levels
  ['MD003', { 'heading-style': { style: 'atx' } }],   // consistency still matters
  ['MD009', { 'no-trailing-spaces': true }],
  ['MD031', { 'blanks-around-fences': true }],         // prevents parse failures
  ['MD037', { 'no-space-in-emphasis': true }],
  ['MD038', { 'no-space-in-code': true }],
  ['MD042', { 'no-empty-links': true }],
  ['MD046', { 'code-block-style': { style: 'fenced' } }],
  ['MD048', { 'code-fence-style': { style: 'backtick' } }],

  // ── Disabled (too restrictive for agent docs) ───────
  ['MD012', { 'no-multiple-blanks': false }],          // visual separation in long docs
  ['MD013', { 'line-length': false }],                 // agent docs are long-form
  ['MD022', { 'blanks-around-headings': false }],      // tighter layout in instruction docs
  ['MD024', { 'no-duplicate-heading': false }],        // repeated sections common
  ['MD026', { 'no-trailing-punctuation': false }],
  ['MD029', { 'ol-prefix': false }],                   // numbering style varies
  ['MD032', { 'blanks-around-lists': false }],         // same reason as MD022
  ['MD033', { 'no-inline-html': false }],              // agent docs embed HTML snippets
  ['MD034', { 'no-bare-urls': false }],                // reference URLs are fine bare
  ['MD036', { 'no-emphasis-as-heading': false }],      // bold-as-heading is common pattern
  ['MD040', { 'fenced-code-language': false }],        // pseudo-code blocks without language
  ['MD041', { 'first-line-heading': false }],          // agents often start with context blocks
  ['MD054', { 'link-image-style': false }],            // mixed link styles
]);

export const agentConfig: Configuration = mapToConfig(rules);
