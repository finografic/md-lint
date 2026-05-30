# @finografic/md-lint

> Scoped markdown linter for standard docs, agent instruction files, and vault YAML front matter.

## How it works

Every `.md` file is automatically classified into one of three presets:

| Preset       | Files                                        | Rules                                            |
| ------------ | -------------------------------------------- | ------------------------------------------------ |
| **standard** | All other markdown                           | Strict — structure, headings, code blocks, links |
| **agent**    | `AGENTS.md`, `.github/instructions/**`, etc. | Relaxed — hygiene only, no layout constraints    |
| **vault**    | `vault/**/*.md`                              | Standard base + optional scoped overrides        |

Agent docs are consumed by LLMs rather than rendered for humans.
Rules like H1 requirement, line length, and inline HTML are disabled for them.

Vault nodes use YAML `title:` front matter. Use scoped config (below) for `front_matter_title` on MD001/MD041
without affecting other categories.

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
md-lint --only vault           # lint only vault docs
md-lint --version
```

## Consumer config

### Recommended setup

Create a `.markdownlint.jsonc` at your project root so editors and the markdownlint CLI use the same rules as `md-lint`:

```jsonc
{
  "extends": "node_modules/@finografic/md-lint/.markdownlint.jsonc"
}
```

### Config discovery

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

### Scoped overrides (`@finografic/overrides`)

Top-level rule keys apply to **every** category. To target a specific category (`standard`, `agent`, or `vault`),
nest overrides under `@finografic/overrides` — interpreted by the `md-lint` runtime and stripped before
rules are passed to markdownlint:

```jsonc
{
  "MD025": false,
  "@finografic/overrides": {
    "standard": {
      "MD001": false,
      "MD041": false
    },
    "agent": {
      "MD041": false
    },
    "vault": {
      "MD001": { "front_matter_title": "^\\s*title\\s*[:=]" },
      "MD041": { "front_matter_title": "^\\s*title\\s*[:=]" }
    }
  }
}
```

This avoids re-enabling MD041 on agent files when you only want `front_matter_title` for vault nodes.

## API

```typescript
import { lintAll } from "@finografic/md-lint";

const { results, counts } = await lintAll({
  cwd: process.cwd(), // default
  fix: false, // auto-fix
  only: "standard", // 'standard' | 'agent' | 'vault' | undefined
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
