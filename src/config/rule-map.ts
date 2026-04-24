import type { Configuration } from 'markdownlint';

/** Maps each markdownlint MD-code to its canonical kebab-case rule name. */
export interface MDCodeToRule {
  MD001: 'heading-increment';
  MD003: 'heading-style';
  MD004: 'ul-style';
  MD007: 'list-indent';
  MD009: 'no-trailing-spaces';
  MD012: 'no-multiple-blanks';
  MD013: 'line-length';
  MD022: 'blanks-around-headings';
  MD024: 'no-duplicate-heading';
  MD026: 'no-trailing-punctuation';
  MD029: 'ol-prefix';
  MD030: 'list-marker-space';
  MD031: 'blanks-around-fences';
  MD032: 'blanks-around-lists';
  MD033: 'no-inline-html';
  MD034: 'no-bare-urls';
  MD036: 'no-emphasis-as-heading';
  MD037: 'no-space-in-emphasis';
  MD038: 'no-space-in-code';
  MD040: 'fenced-code-language';
  MD041: 'first-line-heading';
  MD042: 'no-empty-links';
  MD046: 'code-block-style';
  MD048: 'code-fence-style';
  MD054: 'link-image-style';
}

type RuleValue = boolean | Record<string, unknown>;

/** A typed [MDcode, { ruleName: ruleConfig }] entry — code must match rule name. */
export type RuleEntry<K extends keyof MDCodeToRule> = [K, Record<MDCodeToRule[K], RuleValue>];

/** Union of all valid rule entries. Pairing the wrong MD-code with the wrong rule name is a type error. */
export type AnyRuleEntry = { [K in keyof MDCodeToRule]: RuleEntry<K> }[keyof MDCodeToRule];

/** Identity function — exists solely for typed entry-list literals. */
export function defineRules(entries: AnyRuleEntry[]): AnyRuleEntry[] {
  return entries;
}

/** Flatten rule entries into a markdownlint Configuration (with `default: true`). */
export function mapToConfig(entries: AnyRuleEntry[]): Configuration {
  return Object.assign({ default: true }, ...entries.map(([, rule]) => rule)) as Configuration;
}
