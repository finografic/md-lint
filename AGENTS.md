# AGENTS.md — AI Assistant Guide

## Roadmap and Planning Docs

**`docs/todo/ROADMAP.md` is the primary high-level plan for this project.**
**`docs/todo/NEXT_STEPS.md` is the near-term working list** — small tasks, fixes, and manual testing checklists too small for ROADMAP.

- Before proposing or generating new features, check the roadmap for existing items.
- When conceiving a new feature or initiative, add it to the appropriate priority tier.
- Detailed planning docs live alongside in `docs/todo/` as `TODO_*.md` (active) or `DONE_*.md` (complete).
- **TODO/DONE doc conventions:** `.github/instructions/documentation/todo-done-docs.instructions.md`
  — rules for naming, status headers, checkboxes, and graduating `TODO_` → `DONE_`.

---

## Rules — Project-Specific

Project-specific rules live in `.github/instructions/project/**/*.instructions.md`.

- Do not reference `@workspace/*` — all imports and deps must use published package names.

## Rules — Global

Rules are canonical in `.github/instructions/` — see `README.md` there for folder structure.
Shared across Claude Code, Cursor, and GitHub Copilot.

**General**

- General baseline: `.github/instructions/general.instructions.md`

**Code**

- TypeScript patterns: `.github/instructions/code/typescript-patterns.instructions.md`
- Modern TS patterns: `.github/instructions/code/modern-typescript-patterns.instructions.md`
- ESLint & style: `.github/instructions/code/linting-code-style.instructions.md`
- Provider/context patterns: `.github/instructions/code/provider-context-patterns.instructions.md`
- Picocolors CLI styling: `.github/instructions/code/picocolors-cli-styling.instructions.md`

**Naming**

- File naming: `.github/instructions/naming/file-naming.instructions.md`
- Variable naming: `.github/instructions/naming/variable-naming.instructions.md`

**Documentation**

- Documentation: `.github/instructions/documentation/documentation.instructions.md`
- README standards: `.github/instructions/documentation/readme-standards.instructions.md`
- Agent-facing markdown: `.github/instructions/documentation/agent-facing-markdown.instructions.md`
- Feature design specs: `.github/instructions/documentation/feature-design-specs.instructions.md`
- TODO/DONE docs: `.github/instructions/documentation/todo-done-docs.instructions.md`

**Git**

- Git policy: `.github/instructions/git/git-policy.instructions.md`

---

## Rules — Markdown Tables

- Padded pipes: one space on each side of every `|`, including the separator row.
- Align column widths so all cells in the same column are equal width.

---

## Git Policy

- IMPORTANT: NEVER include `Co-Authored-By` lines in commit messages. Non-negotiable.
- `.github/instructions/git/git-policy.instructions.md` (see Commits and Releases sections)

---

## Claude Code — Session Memory and Handoff

> This section applies to Claude Code only. Other agents can ignore it.

- **Session log:** `.claude/memory.md` (gitignored) — maintenance rules are in that file.
- **Project state snapshot:** `.agents/handoff.md` (git-tracked) — maintenance rules are in that file.

---

## Learned Workspace Facts

- Markdown in this repo is **formatted with oxfmt** (`oxfmt.config.ts`, editor `format`); **`@finografic/md-lint` only runs markdownlint** and does not rewrite Markdown.
- In **markdownlint**, `errorRange` is either `null` or `[startColumn, length]` on **the same line** as `lineNumber` (1-based column and span length in characters)—not an extra line count.
- **Consumer `.markdownlint.jsonc`** / **`.markdownlint.json`** (walk up from `cwd`) are **merged** on top of standard/agent presets; **`.markdownlintignore`** adds glob ignore patterns.
- To **try a local build from another repo**, depend on this package with a **`file:`** path (or **`pnpm link`**) and rebuild here after changes.

---
