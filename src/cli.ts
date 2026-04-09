#!/usr/bin/env node

import process from 'node:process';
import pc from 'picocolors';

import type { FileCategory } from './lib/classify.utils.js';
import { formatResults, formatSummary } from './lib/format.utils.js';
import { lintAll } from './lib/lint.utils.js';
import pkg from '../package.json' with { type: 'json' };

const HELP = `
${pc.bold('md-lint')} — Structural markdown linter with scoped rule sets

${pc.dim('Usage:')}
  md-lint [options] [globs...]

${pc.dim('Options:')}
  --fix              Auto-fix supported issues
  --only <scope>     Only lint 'standard' or 'agent' files
  --help, -h         Show this help message
  --version, -v      Show version

${pc.dim('Examples:')}
  md-lint                          Lint all .md files
  md-lint "docs/**/*.md"           Lint specific paths
  md-lint --fix                    Auto-fix issues
  md-lint --only agent             Only lint agent docs
`.trim();

function parseArgs(argv: string[]): {
  globs: string[];
  fix: boolean;
  only?: FileCategory;
  help: boolean;
  version: boolean;
} {
  const globs: string[] = [];
  let fix = false;
  let only: FileCategory | undefined;
  let help = false;
  let version = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--fix':
        fix = true;
        break;
      case '--only': {
        const value = argv[++i];
        if (value !== 'standard' && value !== 'agent') {
          console.error(`${pc.red('Error:')} --only must be 'standard' or 'agent', got '${value}'`);
          process.exit(2);
        }
        only = value;
        break;
      }
      case '--help':
      case '-h':
        help = true;
        break;
      case '--version':
      case '-v':
        version = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`${pc.red('Error:')} Unknown option '${arg}'`);
          process.exit(2);
        }
        globs.push(arg);
    }
  }

  return { globs, fix, only, help, version };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.version) {
    console.log(`md-lint v${pkg.version}`);
    process.exit(0);
  }

  const result = await lintAll({
    globs: args.globs.length > 0 ? args.globs : undefined,
    fix: args.fix,
    only: args.only,
  });

  // Output errors to stderr
  const formatted = formatResults(result.results);
  if (formatted) {
    console.error(formatted);
  }

  // Summary to stderr
  console.error(formatSummary(result.counts));

  // Exit code
  process.exit(result.counts.errorsTotal > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`${pc.red('Fatal:')} ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});
