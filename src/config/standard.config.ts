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
  ['MD001', { 'heading-increment': true }],                         // no skipping levels
  ['MD003', { 'heading-style': { style: 'atx' } }],                 // # style only
  ['MD024', { 'no-duplicate-heading': { siblings_only: true } }],   // allow same text under different parents
  ['MD026', { 'no-trailing-punctuation': false }],                  // disable trailing punctuation
  ['MD036', { 'no-emphasis-as-heading': false }],                   // bold-as-heading is common pattern
  ['MD041', { 'first-line-heading': { level: 1 } }],                // must start with H1

  // ── Whitespace ──────────────────────────────────────
  ['MD009', { 'no-trailing-spaces': true }],                         // disallow trailing spaces
  ['MD012', { 'no-multiple-blanks': { maximum: 1 } }],               // limit consecutive blank lines
  ['MD022', { 'blanks-around-headings': true }],                     // add spaces around headings
  ['MD031', { 'blanks-around-fences': true }],                       // add spaces around code blocks
  ['MD032', { 'blanks-around-lists': true }],                        // add spaces around lists

  // ── Line length ─────────────────────────────────────
  ['MD013', { 'line-length': false }],                              // disabled; oxfmt handles wrapping

  // ── Lists ───────────────────────────────────────────
  ['MD004', { 'ul-style': { style: 'dash' } }],                     // consistent dash markers
  ['MD007', { 'list-indent': true }],                               // indent list items
  ['MD029', { 'ol-prefix': false }],                                // disable numbering style
  ['MD030', { 'list-marker-space': true }],                         // add space after list markers

  // ── Code ────────────────────────────────────────────
  ['MD040', { 'fenced-code-language': false }],                     // disable language specification
  ['MD046', { 'code-block-style': { style: 'fenced' } }],           // fenced only, no indented
  ['MD048', { 'code-fence-style': { style: 'backtick' } }],         // use backticks for code blocks

  // ── Links / Images ──────────────────────────────────
  ['MD042', { 'no-empty-links': true }],                            // disallow empty links
  ['MD054', { 'link-image-style': { autolink: false } }],           // disallow <url> autolinks

  // ── HTML ────────────────────────────────────────────
  ['MD033', { 'no-inline-html': {
    allowed_elements: ['br', 'sub', 'sup', 'details', 'summary']    // allow specific HTML elements
  } }],

  // ── Misc ────────────────────────────────────────────
  ['MD034', { 'no-bare-urls': true }],                              // disallow bare URLs
  ['MD036', { 'no-emphasis-as-heading': true }],                    // disallow emphasis as heading
  ['MD037', { 'no-space-in-emphasis': true }],                      // disallow space in emphasis
  ['MD038', { 'no-space-in-code': true }],                          // disallow space in code
]);

export const standardConfig: Configuration = mapToConfig(rules);
