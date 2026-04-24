# @finografic/md-lint — Handoff

> **How to maintain this file**
> Update after sessions that change architecture, add/remove features, resolve open questions, or shift priorities — not every session.
> — Update only the sections that changed. Keep the total under 150 lines.
> — Write in present tense. No code snippets — describe what exists, not how it works.
> — `.claude/memory.md` = session work log. `.agents/handoff.md` = project state snapshot. Never duplicate between the two.

## Project

`@finografic/md-lint` — Thin CLI wrapper over the `markdownlint` programmatic API.
Lints markdown files against two rule sets (standard + agent) classified by glob pattern,
in a single invocation. Phase: fully implemented, tests passing.

## Architecture

Two lint passes per run — standard rules for human-facing docs, relaxed rules for
AI/LLM instruction files. Classification is glob-based (picomatch against
AGENT_DOC_MARKDOWN_PATHS), not directory-based.

```
src/
├── cli.ts                     # Entry — parse args, run, format, exit
├── config/
│   ├── agent-docs.patterns.ts # AGENT_DOC_PATHS, AGENT_DOC_MARKDOWN_PATHS
│   ├── standard.config.ts     # Strict rules for READMEs/docs
│   ├── agent.config.ts        # Relaxed rules for AI instruction files
│   └── ignore.config.ts       # Shared ignore patterns
├── lib/
│   ├── classify.utils.ts      # file path → 'standard' | 'agent'
│   ├── lint.utils.ts          # glob → classify → dual lint → merge
│   └── format.utils.ts        # markdownlint-cli2-style output formatting
├── index.ts                   # Programmatic API exports
└── types.ts                   # Re-exported public types
```

## Stack

- TypeScript 5.9 (strict, ESM)
- markdownlint 0.40 (programmatic API — NOT markdownlint-cli2)
- globby 16, picomatch 4, picocolors 1.1
- tsdown (build → dist/cli.mjs + dist/index.mjs)
- vitest 4 (27 tests, all passing)

## CLI Commands

```
md-lint [options] [globs...]
  --fix              Auto-fix supported issues
  --only <scope>     Only lint 'standard' or 'agent' files
  --help, -h
  --version, -v
```

Exit codes: 0 = clean, 1 = lint errors, 2 = usage/fatal error.

## Schema / Types

| Type             | Description                                |
| ---------------- | ------------------------------------------ |
| `FileCategory`   | `'standard' \| 'agent'`                    |
| `LintAllOptions` | globs, fix, only, cwd                      |
| `LintAllResult`  | results (keyed by path) + counts breakdown |

## Decisions

1. `link-image-style` uses `{ autolink: false }` not `{ style: 'full' }` — markdownlint 0.40
   dropped the `style` property; options are now per-type booleans. (2026-04-09)

2. Test fixtures use per-fixture-dir `cwd` — classification requires root-relative paths
   (`CLAUDE.md` not `fixtures/agent/CLAUDE.md`), so each fixture subdir mimics a project
   root. (2026-04-09)

3. Stylelint removed — this package has no CSS. (2026-04-09)

4. VSCode markdown preview CSS moved into `styles/` — ships as static assets in the
   published package. VS Code `markdown.styles` rejects remote URLs (Gist approach
   does not work); consumers reference `./node_modules/@finografic/md-lint/styles/` instead.
   (2026-04-09)

## VSCode Markdown CSS — `styles/` Directory

The two `.vscode/markdown-*.css` files are now published inside this package under
`styles/`. Exported via `"./styles/*": "./styles/*"` and included in `files`.

**Consumer `.vscode/settings.json`:**

```json
"markdown.styles": [
  "./node_modules/@finografic/md-lint/styles/markdown-github-light.css",
  "./node_modules/@finografic/md-lint/styles/markdown-custom-dark.css"
]
```

**Action required in genx:** See `.claude/assets/TODO_MD_CSS.md` — stop scaffolding
`.vscode/markdown-*.css`, install md-lint, inject the node_modules paths, remove stylelint.

## Open Questions

- Should `AGENT_DOC_PATHS` be externalized to `@finografic/core`? (planned, not started)

## Status

Implementation complete. 27 tests passing. CLI + styles/ working end-to-end.
Next: update genx (see TODO_MD_CSS.md).
