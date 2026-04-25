# @finografic/md-lint

> Structural markdown linter with two scoped rule sets — one for human-facing docs, one for AI agent instruction files.

## How it works

Every `.md` file is automatically classified into one of two presets:

| Preset       | Files                                                                                      | Rules                                            |
| ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **standard** | All other markdown                                                                         | Strict — structure, headings, code blocks, links |
| **agent**    | `CLAUDE.md`, `AGENTS.md`, `.github/instructions/**`, `.cursor/rules/**`, and similar paths | Relaxed — hygiene only, no layout constraints    |

Agent docs are consumed by LLMs rather than rendered for humans, so rules like H1 requirement, line length, and inline HTML are disabled for them.

## Installation

```bash
pnpm add @finografic/md-lint
```

## CLI

```bash
md-lint                        # lint all .md / .mdx files
md-lint "docs/**/*.md"         # lint a specific glob
md-lint --fix                  # auto-fix supported issues
md-lint --only agent           # lint only agent docs
md-lint --only standard        # lint only standard docs
md-lint --version
```

## Consumer config

All config files are discovered by walking **upward from `cwd`** until the nearest `.git` root — parent directories above the repo are never consulted.

| File                  | Purpose                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `.markdownlint.jsonc` | Rule overrides (JSON with comments), merged on top of the matching preset |
| `.markdownlint.json`  | Same — plain JSON                                                         |
| `.markdownlintignore` | Extra ignore globs (one per line, `#` comments supported)                 |

## API

```typescript
import { lintAll } from '@finografic/md-lint';

const { results, counts } = await lintAll({
  cwd: process.cwd(), // default
  fix: false,         // auto-fix
  only: 'standard',  // 'standard' | 'agent' | undefined
  globs: ['**/*.md'], // default
});
```

## lint-staged

```json
{
  "*.md": ["md-lint --fix"]
}
```

Absolute paths passed by lint-staged are handled correctly — ignore rules apply as normal.

## Development

```bash
pnpm install   # install deps and set up git hooks
pnpm build     # compile to dist/
pnpm test:run  # run tests
pnpm lint      # oxlint
pnpm lint:md   # self-lint (requires a build)
pnpm typecheck # tsc --noEmit
```

## License

MIT © [Justin](https://github.com/finografic)
