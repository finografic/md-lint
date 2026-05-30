# @finografic/md-lint

> Structural markdown linter with two scoped rule sets — one for human-facing docs, one for AI agent instruction files.

## How it works

Every `.md` file is automatically classified into one of two presets:

| Preset       | Files                                        | Rules                                            |
| ------------ | -------------------------------------------- | ------------------------------------------------ |
| **standard** | All other markdown                           | Strict — structure, headings, code blocks, links |
| **agent**    | `AGENTS.md`, `.github/instructions/**`, etc. | Relaxed — hygiene only, no layout constraints    |

Agent docs are consumed by LLMs rather than rendered for humans.
Rules like H1 requirement, line length, and inline HTML are disabled for them.

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

Config is discovered by walking **upward from `cwd`** until the nearest `.git` root.
Parent directories above the repo are never consulted.

| File                    | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `.markdownlint.jsonc`   | Rule overrides (JSON with comments); **wins** over VS Code |
| `.markdownlint.json`    | Same — plain JSON                                          |
| `.vscode/settings.json` | Optional `markdownlint.config`; merged before the file     |
| `.markdownlintignore`   | Extra ignore globs (one per line, `#` comments supported)  |

`MD013` / `line-length` (and other aliases) normalize to one kebab-case key before merging with finografic presets.
That keeps `.markdownlint.jsonc` and VS Code settings aligned with the markdownlint CLI.

## API

```typescript
import { lintAll } from "@finografic/md-lint";

const { results, counts } = await lintAll({
  cwd: process.cwd(), // default
  fix: false, // auto-fix
  only: "standard", // 'standard' | 'agent' | undefined
  globs: ["**/*.md"], // default
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

MIT © [Justin Rankin](https://github.com/finografic)
