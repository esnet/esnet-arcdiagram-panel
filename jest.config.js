// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  // Arc's D3 entry imports the full family of ESM packages.
  transformIgnorePatterns: [nodeModulesToTransform([
    ...grafanaESModules, 'd3-.*', 'internmap', 'delaunator', 'robust-predicates',
  ])],
};
