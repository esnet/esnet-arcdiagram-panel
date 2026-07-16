# Changelog

## 1.2.0

Modernization refactor for the latest Grafana (output preserved).

- Upgraded to the Grafana 13 SDK (`@grafana/*` `^13`), React 18, and TypeScript 5; migrated
  the build tooling to the current `@grafana/create-plugin` scaffold (webpack 5, flat ESLint
  config, Playwright e2e). Minimum Grafana is now `>=12.0.0`.
- Fixed node clustering on Grafana 10+ (`Field.values` is now a plain array; the removed
  `ArrayVector.buffer` access was the cause).
- Introduced a typed data model (`Node`/`Link`/`ParsedData`/`SimpleOptions`); removed the
  module-level tooltip singleton and the global `localStorage` first-render flag.
- Bug fixes: the weighted range slider now restores its saved value; `isTimeSeries` checks all
  fields; tooltips honor the configured font size; a "No data" guard replaces an empty-result
  crash.
- Added unit tests for the data parsers and utilities; CI now runs typecheck, lint, and tests.

## 1.0.0 (Unreleased)

Initial release.
