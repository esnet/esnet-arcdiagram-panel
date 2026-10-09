# Changelog

## Unreleased

- Backport Grafana 13 source/destination rendering fixes while preserving
  Grafana 9 field-vector support.
- Scope diagram and tooltip updates to their panel, guard empty label geometry,
  resolve display aliases, and handle missing data and fields.
- Correct React styles and tooltip element nesting; add regression tests.
- Validated on Grafana 9.5.21 and 13.2.3: 14 unit tests, TypeScript checking,
  production build, and 17 browser checks on each Grafana version passed.
- This is a separate legacy-line backport. Upstream already has a modernized
  release on branch `1.2.0`, tagged `v1.2.1`, requiring Grafana >=12.

## 1.0.0 (Unreleased)

Initial release.
