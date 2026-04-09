import picomatch from 'picomatch';

import { AGENT_DOC_MARKDOWN_PATHS } from '../config/agent-docs.patterns.js';

export type FileCategory = 'standard' | 'agent';

/**
 * Build a matcher from the agent doc glob patterns.
 * picomatch compiles globs once; the returned function is O(1) per file.
 */
const isAgentDoc = picomatch(AGENT_DOC_MARKDOWN_PATHS as unknown as string[]);

/**
 * Classify a file path as standard or agent markdown.
 *
 * @param relativePath - Path relative to project root (e.g. '.github/skills/foo/SKILL.md')
 * @returns 'agent' if it matches any AGENT_DOC_MARKDOWN_PATHS glob, else 'standard'
 */
export function classifyFile(relativePath: string): FileCategory {
  return isAgentDoc(relativePath) ? 'agent' : 'standard';
}

/**
 * Partition an array of file paths into standard and agent buckets.
 */
export function classifyFiles(relativePaths: string[]): {
  standard: string[];
  agent: string[];
} {
  const standard: string[] = [];
  const agent: string[] = [];

  for (const p of relativePaths) {
    if (isAgentDoc(p)) {
      agent.push(p);
    } else {
      standard.push(p);
    }
  }

  return { standard, agent };
}
