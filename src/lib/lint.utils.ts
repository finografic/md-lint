import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { globby } from 'globby';
import { applyFixes } from 'markdownlint';
import { lint } from 'markdownlint/promise';
import type { FileCategory } from './classify.utils.js';
import type { Configuration, LintError, LintResults } from 'markdownlint';

import { agentConfig } from '../config/agent.config.js';
import { standardConfig } from '../config/standard.config.js';
import { ignorePatterns } from '../config/standard.patterns.js';
import { classifyFiles } from './classify.utils.js';
import {
  filterPathsByIgnorePatterns,
  findConsumerMarkdownlintPaths,
  findVscodeSettingsPath,
  buildEffectiveCategoryConfig,
  loadConsumerMarkdownlintConfig,
  loadVscodeMarkdownlintConfig,
  resolveScopedConsumerConfig,
  readMarkdownlintIgnorePatterns,
} from './consumer-markdownlint.utils.js';

export interface LintAllOptions {
  /**
   * Glob patterns for files to lint (passed to globby). When omitted, all `.md` and `.mdx` files under `cwd`
   * are used.
   */
  globs?: string[];
  /** Apply auto-fixes. */
  fix?: boolean;
  /** Only lint one category. */
  only?: FileCategory;
  /** Working directory (defaults to process.cwd()). */
  cwd?: string;
  /**
   * When false, do not load `markdownlint.config` from `.vscode/settings.json` at the git root. Default true.
   */
  vscodeSettings?: boolean;
}

export interface LintAllResult {
  /** Combined lint results keyed by file path. */
  results: LintResults;
  /** Summary counts. */
  counts: {
    filesStandard: number;
    filesAgent: number;
    filesVault: number;
    filesTotal: number;
    errorsStandard: number;
    errorsAgent: number;
    errorsVault: number;
    errorsTotal: number;
    /** Files written by `--fix` when content changed (markdownlint applyFixes). */
    fixesApplied: number;
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
): Promise<{ results: LintResults; errorCount: number; fixesApplied: number }> {
  if (files.length === 0) {
    return { results: {}, errorCount: 0, fixesApplied: 0 };
  }

  // markdownlint expects absolute paths or paths relative to CWD
  const absolutePaths = files.map((f) => resolve(cwd, f));

  const results = await lint({
    files: absolutePaths,
    config,
  });

  let fixesApplied = 0;
  if (fix) {
    for (const filePath of absolutePaths) {
      const fileResults = results[filePath];
      if (fileResults && fileResults.length > 0) {
        const content = readFileSync(filePath, 'utf8');
        const fixed = applyFixes(content, fileResults);
        if (fixed !== content) {
          writeFileSync(filePath, fixed, 'utf8');
          fixesApplied += 1;
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

  return { results: relativeResults, errorCount, fixesApplied };
}

/**
 * Lint all markdown files, classifying each as standard or agent, and applying the appropriate rule set.
 */
export async function lintAll(options: LintAllOptions = {}): Promise<LintAllResult> {
  const {
    globs = ['**/*.md', '**/*.mdx'],
    fix = false,
    only,
    cwd = process.cwd(),
    vscodeSettings = true,
  } = options;

  const { configPath, ignorePath } = findConsumerMarkdownlintPaths(cwd);
  const consumerIgnore = ignorePath ? readMarkdownlintIgnorePatterns(ignorePath) : [];

  let fileConfig: Configuration | null = null;
  if (configPath) {
    try {
      fileConfig = loadConsumerMarkdownlintConfig(configPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load ${configPath}: ${msg}`);
    }
  }

  let vscodeConfig: Configuration | null = null;
  const vscodeSettingsPath = vscodeSettings ? findVscodeSettingsPath(cwd) : null;
  if (vscodeSettingsPath) {
    try {
      vscodeConfig = loadVscodeMarkdownlintConfig(vscodeSettingsPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load ${vscodeSettingsPath}: ${msg}`);
    }
  }

  const consumerConfig = resolveScopedConsumerConfig({ vscodeConfig, fileConfig });

  const effectiveStandard = buildEffectiveCategoryConfig(
    standardConfig,
    consumerConfig.global,
    consumerConfig.standard,
  );
  const effectiveAgent = buildEffectiveCategoryConfig(
    agentConfig,
    consumerConfig.global,
    consumerConfig.agent,
  );
  const effectiveVault = buildEffectiveCategoryConfig(
    standardConfig,
    consumerConfig.global,
    consumerConfig.vault,
  );

  // 1. Glob all markdown files
  const mergedIgnore = [...ignorePatterns, ...consumerIgnore];
  const allFilesRaw = await globby(globs, {
    cwd,
    ignore: mergedIgnore,
    dot: true, // Include dotfiles like .github/
    gitignore: true,
  });
  const allFiles = filterPathsByIgnorePatterns(allFilesRaw, cwd, mergedIgnore);

  // 2. Classify
  const { standard, agent, vault } = classifyFiles(allFiles, cwd);

  // 3. Lint each category (skip if --only filters it out)
  const standardResult =
    only === 'agent' || only === 'vault'
      ? { results: {}, errorCount: 0, fixesApplied: 0 }
      : await lintFiles(standard, effectiveStandard, cwd, fix);

  const agentResult =
    only === 'standard' || only === 'vault'
      ? { results: {}, errorCount: 0, fixesApplied: 0 }
      : await lintFiles(agent, effectiveAgent, cwd, fix);

  const vaultResult =
    only === 'standard' || only === 'agent'
      ? { results: {}, errorCount: 0, fixesApplied: 0 }
      : await lintFiles(vault, effectiveVault, cwd, fix);

  // 4. Merge results
  const mergedResults: LintResults = {
    ...standardResult.results,
    ...agentResult.results,
    ...vaultResult.results,
  };

  const filesStandard = only === 'agent' || only === 'vault' ? 0 : standard.length;
  const filesAgent = only === 'standard' || only === 'vault' ? 0 : agent.length;
  const filesVault = only === 'standard' || only === 'agent' ? 0 : vault.length;

  return {
    results: mergedResults,
    counts: {
      filesStandard,
      filesAgent,
      filesVault,
      filesTotal: filesStandard + filesAgent + filesVault,
      errorsStandard: standardResult.errorCount,
      errorsAgent: agentResult.errorCount,
      errorsVault: vaultResult.errorCount,
      errorsTotal: standardResult.errorCount + agentResult.errorCount + vaultResult.errorCount,
      fixesApplied: standardResult.fixesApplied + agentResult.fixesApplied + vaultResult.fixesApplied,
    },
  };
}
