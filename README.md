# @finografic/md-lint

> Markdown linter with scoped rule sets for standard and AI agent docs

## Installation

```bash
pnpm add @finografic/md-lint
```

## Usage

```bash
npx md-lint
npx md-lint --fix "docs/**/*.md"
```

Finografic **standard** vs **agent** presets apply first. The consumer repo can optionally add:

| File                  | Purpose                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `.markdownlint.jsonc` | Rule overrides (JSON with comments); merged on top of the matching preset |
| `.markdownlint.json`  | Same, plain JSON                                                          |
| `.markdownlintignore` | Extra ignore globs (one per line, `#` comments)                           |

Files are searched **upward** from the current working directory until the nearest **`.git`** directory (repository root), so parent folders and your home directory are not consulted.

**lint-staged:** Hooks often pass **absolute** file paths to `md-lint`. Ignore rules still apply (same as gitignore semantics); upgrade to the latest `@finografic/md-lint` if ignores seemed ignored before.

```typescript
import { lintAll } from '@finografic/md-lint';

await lintAll({ cwd: process.cwd(), fix: false });
```

## Development

```bash
# Install dependencies (automatically sets up git hooks)
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test:run

# Lint
pnpm lint
```

**Note:** Git hooks are automatically configured on `pnpm install`. See [docs/DEVELOPER_WORKFLOW.md](./docs/DEVELOPER_WORKFLOW.md) for the complete workflow.

## License

MIT © [Justin](https://github.com/finografic)
