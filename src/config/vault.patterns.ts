/**
 * Vault-style markdown: YAML front matter with `title:` and optional body headings.
 */
export const VAULT_DOC_PATHS = ['vault/**/*.md'] as const;

export const VAULT_DOC_MARKDOWN_PATHS = VAULT_DOC_PATHS.filter(
  (p): p is Extract<(typeof VAULT_DOC_PATHS)[number], `${string}.md`> => p.endsWith('.md'),
);
