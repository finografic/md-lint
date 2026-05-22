/** Paths to always exclude from linting. */
export const ignorePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/bin/**',
  '**/coverage/**',
  'pnpm-lock.yaml',
  'CHANGELOG.md', // Generated, no point linting
  '_templates/**', // Scaffolding templates may have intentional violations
] as const;
