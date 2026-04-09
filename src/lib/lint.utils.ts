import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { globby } from 'globby';
import { applyFixes } from 'markdownlint';
import { lint } from 'markdownlint/promise';
import type { Configuration, LintResults, LintError } from 'markdownlint';

import { agentConfig } from '../config/agent.config.js';
import { ignorePatterns } from '../config/ignore.config.js';
import { standardConfig } from '../config/standard.config.js';
import { classifyFiles, type FileCategory } from './classify.utils.js';

export interface LintAllOptions {
  /** Glob patterns for files to lint. Defaults to ['**\/*.md', '**\/*.mdx']. */
  globs?: string[];
  /** Apply auto-fixes. */
  fix?: boolean;
  /** Only lint one category. */
  only?: FileCategory;
  /** Working directory (defaults to process.cwd()). */
  cwd?: string;
}

export interface LintAllResult {
  /** Combined lint results keyed by file path. */
  results: LintResults;
  /** Summary counts. */
  counts: {
    filesStandard: number;
    filesAgent: number;
    filesTotal: number;
    errorsStandard: number;
    errorsAgent: number;
    errorsTotal: number;
  };
}

/**
 * Run a single markdownlint pass against a set of files.
 */
async function lintFiles(
  files: string[],
  config: Configuration,
  cwd: string,
  fix: boolean,
): Promise<{ results: LintResults; errorCount: number }> {
  if (files.length === 0) {
    return { results: {}, errorCount: 0 };
  }

  // markdownlint expects absolute paths or paths relative to CWD
  const absolutePaths = files.map((f) => resolve(cwd, f));

  const results = await lint({
    files: absolutePaths,
    config,
  });

  if (fix) {
    for (const filePath of absolutePaths) {
      const fileResults = results[filePath];
      if (fileResults && fileResults.length > 0) {
        const content = readFileSync(filePath, 'utf8');
        const fixed = applyFixes(content, fileResults);
        if (fixed !== content) {
          writeFileSync(filePath, fixed, 'utf8');
        }
      }
    }
  }

  // Count total errors
  let errorCount = 0;
  for (const fileErrors of Object.values(results)) {
    errorCount += (fileErrors as LintError[]).length;
  }

  // Re-key results to relative paths for cleaner output
  const relativeResults: LintResults = {};
  for (const [absPath, errors] of Object.entries(results)) {
    const relPath = relative(cwd, absPath);
    relativeResults[relPath] = errors as LintError[];
  }

  return { results: relativeResults, errorCount };
}

/**
 * Lint all markdown files, classifying each as standard or agent,
 * and applying the appropriate rule set.
 */
export async function lintAll(options: LintAllOptions = {}): Promise<LintAllResult> {
  const { globs = ['**/*.md', '**/*.mdx'], fix = false, only, cwd = process.cwd() } = options;

  // 1. Glob all markdown files
  const allFiles = await globby(globs, {
    cwd,
    ignore: [...ignorePatterns],
    dot: true, // Include dotfiles like .github/
    gitignore: true,
  });

  // 2. Classify
  const { standard, agent } = classifyFiles(allFiles);

  // 3. Lint each category (skip if --only filters it out)
  const standardResult =
    only === 'agent' ? { results: {}, errorCount: 0 } : await lintFiles(standard, standardConfig, cwd, fix);

  const agentResult =
    only === 'standard' ? { results: {}, errorCount: 0 } : await lintFiles(agent, agentConfig, cwd, fix);

  // 4. Merge results
  const mergedResults: LintResults = {
    ...standardResult.results,
    ...agentResult.results,
  };

  return {
    results: mergedResults,
    counts: {
      filesStandard: only === 'agent' ? 0 : standard.length,
      filesAgent: only === 'standard' ? 0 : agent.length,
      filesTotal: (only === 'agent' ? 0 : standard.length) + (only === 'standard' ? 0 : agent.length),
      errorsStandard: standardResult.errorCount,
      errorsAgent: agentResult.errorCount,
      errorsTotal: standardResult.errorCount + agentResult.errorCount,
    },
  };
}
