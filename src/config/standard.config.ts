/* oxlint-disable */
/* oxfmt-disable */
import type { Configuration } from 'markdownlint';
import { defineRules, mapToConfig } from './rule-map.js';

/**
 * Standard markdown rules — READMEs, docs, guides.
 *
 * These enforce consistent structure and prevent common mistakes
 * that affect readability and cross-parser compatibility.
 */
const rules = defineRules([
  // ── Headings ────────────────────────────────────────
  ['MD001', { 'heading-increment': true }],                                                      // no skipping levels
  ['MD003', { 'heading-style': { style: 'atx' } }],                                             // # style only
  ['MD024', { 'no-duplicate-heading': { siblings_only: true } }],                               // allow same text under different parents
  ['MD026', { 'no-trailing-punctuation': false }],
  ['MD041', { 'first-line-heading': { level: 1 } }],                                            // must start with H1

  // ── Whitespace ──────────────────────────────────────
  ['MD009', { 'no-trailing-spaces': true }],
  ['MD012', { 'no-multiple-blanks': { maximum: 1 } }],
  ['MD022', { 'blanks-around-headings': true }],
  ['MD031', { 'blanks-around-fences': true }],
  ['MD032', { 'blanks-around-lists': true }],

  // ── Line length ─────────────────────────────────────
  ['MD013', { 'line-length': false }],                                                           // disabled; oxfmt handles wrapping

  // ── Lists ───────────────────────────────────────────
  ['MD004', { 'ul-style': { style: 'dash' } }],                                                 // consistent dash markers
  ['MD007', { 'list-indent': true }],
  ['MD029', { 'ol-prefix': false }],
  ['MD030', { 'list-marker-space': true }],

  // ── Code ────────────────────────────────────────────
  ['MD040', { 'fenced-code-language': false }],
  ['MD046', { 'code-block-style': { style: 'fenced' } }],                                       // fenced only, no indented
  ['MD048', { 'code-fence-style': { style: 'backtick' } }],

  // ── Links / Images ──────────────────────────────────
  ['MD042', { 'no-empty-links': true }],
  ['MD054', { 'link-image-style': { autolink: false } }],                                       // disallow <url> autolinks

  // ── HTML ────────────────────────────────────────────
  ['MD033', { 'no-inline-html': { allowed_elements: ['br', 'sub', 'sup', 'details', 'summary'] } }],

  // ── Misc ────────────────────────────────────────────
  ['MD034', { 'no-bare-urls': true }],
  ['MD036', { 'no-emphasis-as-heading': true }],
  ['MD037', { 'no-space-in-emphasis': true }],
  ['MD038', { 'no-space-in-code': true }],
]);

export const standardConfig: Configuration = mapToConfig(rules);
