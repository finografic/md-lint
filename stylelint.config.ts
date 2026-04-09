import type { Config } from 'stylelint';

export default {
  plugins: ['@stylistic/stylelint-plugin'],
  rules: {
    '@stylistic/indentation': 2,
    '@stylistic/no-extra-semicolons': true,
    '@stylistic/max-empty-lines': 1,
  },
} satisfies Config;
