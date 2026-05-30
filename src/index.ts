export { lintAll, type LintAllOptions, type LintAllResult } from './lib/lint.utils.js';
export {
  filterPathsByIgnorePatterns,
  findConsumerMarkdownlintPaths,
  findVscodeSettingsPath,
  loadConsumerMarkdownlintConfig,
  loadVscodeMarkdownlintConfig,
  mergeMarkdownlintConfig,
  normalizeMarkdownlintConfigKeys,
  parseMarkdownlintIgnoreFile,
  readMarkdownlintIgnorePatterns,
  buildEffectiveCategoryConfig,
  parseScopedConsumerConfig,
  resolveScopedConsumerConfig,
  resolveConsumerMarkdownlintOverlay,
} from './lib/consumer-markdownlint.utils.js';
export {
  classifyFile,
  classifyFiles,
  toProjectRelativePath,
  type FileCategory,
} from './lib/classify.utils.js';
export { standardConfig } from './config/standard.config.js';
export { agentConfig } from './config/agent.config.js';
export { AGENT_DOC_PATHS, AGENT_DOC_MARKDOWN_PATHS } from './config/agent.patterns.js';
export { ignorePatterns } from './config/standard.patterns.js';
export { VAULT_DOC_PATHS, VAULT_DOC_MARKDOWN_PATHS } from './config/vault.patterns.js';
