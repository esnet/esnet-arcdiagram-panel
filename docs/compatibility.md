# Grafana compatibility validation

This source-only contribution contains unreleased compatibility fixes. It does
not change version metadata or create a release tag. Generated bundles, lab
scripts, local reports, screenshots and backups are excluded from the change.
Build the source before installing it: the existing tracked `dist/` files are
unchanged from upstream's legacy `main` and do not contain these fixes.

The fork can publish its own 1.3.0 release after merging the staging branch,
updating package version metadata, and rebuilding. Upstream can independently
choose the version number for its release.

This branch backports fixes to upstream's legacy `main` (version 1.0.4).
Upstream separately modernized its `1.2.0` branch, tagged `v1.2.1`; this is not
the first upstream Grafana 13 modernization. The author can choose the version
number when accepting a legacy backport.

The compatibility patch was tested on October 8, 2026 against Grafana OSS
9.5.21 and 13.2.3. The unmodified signed 1.0.4 plugin rendered the baseline on
9.5.21 but produced infinite node and arc coordinates on 13.2.3 with the same
database, dashboards, and byte-identical installed plugin.

The patched plugin passed 17 browser checks on each version, using the saved
dashboard and a synthetic table with 9 nodes and 12 directed source/destination
edges. Checks cover finite SVG geometry, matching topology, numeric positive
weights, node tooltips, search/reset, zoom/reset, automatic refresh, resize/reload,
and dark/light themes. Search and zoom are disabled in the saved dashboard, so
those checks are skipped there and exercised in the weighted fixture. The final
browser runs recorded no console errors, page errors, or failed HTTP responses.
Screenshots were reviewed for diagram layout, node tooltips, themes, and resizing.

The source changes also passed 14 Jest tests across 4 suites, TypeScript checking,
and the production webpack build. The build used Node 18.20.8 and the frozen Yarn
lockfile; the locked eslint-plugin-jsdoc dependency rejects Node 22.

To run the source checks:

```sh
yarn install --frozen-lockfile
yarn jest --ci --runInBand
yarn typecheck
yarn build
```

These results cover the tested source/destination modes. Clustering, traceroute,
every supported datasource, duplicate/zero-value inputs, and the intervening
Grafana versions have not been verified end to end. The test build is unsigned
and was explicitly allowed only in an isolated lab instance.
