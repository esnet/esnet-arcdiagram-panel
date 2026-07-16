import { defineConfig } from 'eslint/config';
import baseConfig from './.config/eslint.config.mjs';

export default defineConfig([
  {
    ignores: [
      '**/logs',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.pnpm-debug.log*',
      '**/node_modules/',
      '.yarn/cache',
      '.yarn/unplugged',
      '.yarn/build-state.yml',
      '.yarn/install-state.gz',
      '**/.pnp.*',
      '**/pids',
      '**/*.pid',
      '**/*.seed',
      '**/*.pid.lock',
      '**/lib-cov',
      '**/coverage',
      '**/dist/',
      '**/artifacts/',
      '**/work/',
      '**/ci/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'playwright/.cache/',
      'playwright/.auth/',
      '**/.idea',
      '**/.eslintcache',
    ],
  },
  ...baseConfig,
  {
    // [refactor] The unit + e2e tests live in the top-level "test files" folder (a non-src
    // location), so the scaffold's `src/**`-scoped TypeScript config block doesn't register
    // them for linting. Add them here — but without the type-aware `project` parserOptions,
    // since they are intentionally outside tsconfig's `include`.
    files: ['test files/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]);
