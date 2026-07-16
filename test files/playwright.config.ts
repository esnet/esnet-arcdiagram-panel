import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

// @grafana/plugin-e2e ships an auth "setup" project that logs into Grafana once and stores the
// session; our tests depend on it. Resolve its directory from the installed package.
const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  // This config lives inside the "test files" folder alongside the specs. `testDir`/`outputDir`
  // are resolved relative to this config file, so `.` is the "test files" folder itself and
  // `../playwright/...` keeps the run artifacts at the repo root. Jest owns *.test.ts here;
  // Playwright owns *.spec.ts — the testMatch below keeps Playwright off the Jest unit tests.
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: '../playwright/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // 1. Log into Grafana and store the auth state.
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    // 2. Run the plugin tests using the stored auth state.
    {
      name: 'arcdiagram',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
