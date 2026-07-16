// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  // The unit tests live in the top-level "test files" folder (alongside the Playwright e2e
  // specs) instead of next to the source. Point Jest at that folder and match only Jest's
  // `*.test.*` files, so Playwright's `*.spec.ts` e2e tests in the same folder are ignored.
  // Module resolution still works because the scaffold sets `modulePaths: ['<rootDir>/src']`,
  // so the bare `import … from 'utils'` specifiers resolve against src.
  roots: ['<rootDir>/src', '<rootDir>/test files'],
  testMatch: ['<rootDir>/test files/**/*.{test,jest}.{js,jsx,ts,tsx}'],
  // d3 (and its sub-packages) ship as ES modules, so they must be transformed too —
  // otherwise importing the panel (which pulls in d3) throws "Cannot use import statement
  // outside a module". Extend the scaffolded allowlist rather than editing it.
  transformIgnorePatterns: [
    nodeModulesToTransform([
      ...grafanaESModules,
      'd3',
      'd3-[a-z-]+',
      'internmap',
      'delaunator',
      'robust-predicates',
    ]),
  ],
};
