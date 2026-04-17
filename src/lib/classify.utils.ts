import { isAbsolute, relative, resolve } from 'node:path';
import picomatch from 'picomatch';

import { AGENT_DOC_MARKDOWN_PATHS } from '../config/agent.patterns.js';

export type FileCategory = 'standard' | 'agent';

/**
 * Build a matcher from the agent doc glob patterns.
 * picomatch compiles globs once; the returned function is O(1) per file.
 */
const isAgentDoc = picomatch(AGENT_DOC_MARKDOWN_PATHS as unknown as string[], {
  dot: true,
});

/**
 * Normalize to a POSIX path relative to `cwd` so picomatch (relative globs) matches
 * whether the caller passed a repo-relative or absolute path (e.g. lint-staged).
 */
export function toProjectRelativePath(filePath: string, cwd: string): string {
  const cwdResolved = resolve(cwd);
  const abs = isAbsolute(filePath) ? filePath : resolve(cwdResolved, filePath);
  return relative(cwdResolved, abs).replace(/\\/g, '/');
}

/**
 * Classify a file path as standard or agent markdown.
 *
 * @param filePath - Path relative to `cwd`, or absolute under `cwd` (lint-staged often passes absolute)
 * @param cwd - Project root (default: `process.cwd()`)
 * @returns 'agent' if it matches any AGENT_DOC_MARKDOWN_PATHS glob, else 'standard'
 */
export function classifyFile(filePath: string, cwd: string = process.cwd()): FileCategory {
  const forMatch = toProjectRelativePath(filePath, cwd);
  return isAgentDoc(forMatch) ? 'agent' : 'standard';
}

/**
 * Partition an array of file paths into standard and agent buckets.
 *
 * @param paths - Relative or absolute paths under `cwd`
 */
export function classifyFiles(
  paths: string[],
  cwd: string = process.cwd(),
): {
  standard: string[];
  agent: string[];
} {
  const standard: string[] = [];
  const agent: string[] = [];

  for (const p of paths) {
    if (classifyFile(p, cwd) === 'agent') {
      agent.push(p);
    } else {
      standard.push(p);
    }
  }

  return { standard, agent };
}
