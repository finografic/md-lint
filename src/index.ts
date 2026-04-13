export { lintAll, type LintAllOptions, type LintAllResult } from './lib/lint.utils.js';
export {
  filterPathsByIgnorePatterns,
  findConsumerMarkdownlintPaths,
  loadConsumerMarkdownlintConfig,
  mergeMarkdownlintConfig,
  parseMarkdownlintIgnoreFile,
  readMarkdownlintIgnorePatterns,
} from './lib/consumer-markdownlint.utils.js';
export { classifyFile, classifyFiles, type FileCategory } from './lib/classify.utils.js';
export { standardConfig } from './config/standard.config.js';
export { agentConfig } from './config/agent.config.js';
export { AGENT_DOC_PATHS, AGENT_DOC_MARKDOWN_PATHS } from './config/agent-docs.patterns.js';
export { ignorePatterns } from './config/ignore.config.js';
