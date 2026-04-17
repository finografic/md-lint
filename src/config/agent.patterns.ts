/**
 * Known agent/AI instruction document paths across the ecosystem.
 *
 * Sources:
 *   - GitHub Copilot: .github/copilot-instructions.md, .github/instructions/
 *   - Cursor: .cursorrules, .cursor/rules/
 *   - Windsurf: .windsurfrules, .windsurf/rules/
 *   - Claude Code: CLAUDE.md convention
 *   - Cline: .clinerules, .cline/rules/
 *   - Gemini/multi-agent: GEMINI.md, AGENTS.md, COPILOT.md, CONVENTIONS.md
 */
export const AGENT_DOC_PATHS = [
  // ── GitHub Copilot ──────────────────────────────────
  '.github/copilot-instructions.md',
  '.github/instructions/**/*.md',
  '.github/prompts/**/*.md',
  '.github/skills/**/*.md',

  // ── Cursor ──────────────────────────────────────────
  '.cursorrules',
  '.cursor/rules/**/*.mdc',

  // ── Windsurf ────────────────────────────────────────
  '.windsurfrules',
  '.windsurf/rules/**/*.md',

  // ── Claude ──────────────────────────────────────────
  'CLAUDE.md',
  'CLAUDE.local.md',

  // ── Cline ───────────────────────────────────────────
  '.clinerules',
  '.cline/rules/**/*.md',

  // ── Multi-agent / cross-tool ────────────────────────
  'AGENTS.md',
  'GEMINI.md',
  'COPILOT.md',
  'CONVENTIONS.md',
] as const;

/**
 * Markdown-only subset for lint classification.
 * Filters out non-markdown entries (.mdc, extensionless).
 */
export const AGENT_DOC_MARKDOWN_PATHS = AGENT_DOC_PATHS.filter(
  (p): p is Extract<(typeof AGENT_DOC_PATHS)[number], `${string}.md`> => p.endsWith('.md'),
);
