# Refactor Notes — esnet-arcdiagram-panel

Modernization refactor of the Arc Diagram Grafana panel. The core modernization is
**output-preserving** (the rendered diagram and controls stay the same; only internal code,
types, and build tooling change). Driving goal — make the plugin build and run on **latest
Grafana (13.x)**, which it previously could not. Every change site is marked in code with a
`// [refactor]` comment.

> **Exception:** the *Grafana 13 rendering fixes* section below intentionally changes on-screen
> output — the original rendering was actually broken on Grafana 13 (diagram drew off-screen),
> so preserving it was neither possible nor desirable.

> Latent bugs surfaced during the work were also fixed (the user opted in). Those behavior
> changes are intentionally **not** detailed here — each is documented inline at its `// [refactor]`
> comment with a regression test where practical. This document focuses on the modernization.

---

## Why

Scaffolded on Grafana-9-era `@grafana/create-plugin`, pinned to React 17 + Grafana 9 SDK. On
Grafana 13 it was partly broken — notably node clustering, because `src/utils.ts` read
`field.values.buffer`, an internal removed in Grafana 10+. Deps also used floating `latest`
versions and carried unused packages.

## Target stack

| Item | Before | After |
|------|--------|-------|
| `@grafana/*` (data/ui/runtime/schema/i18n) | 9.x / floating `latest` | `^13.0.2` (pinned) |
| `grafanaDependency` (plugin.json) | `>=9.4.0` | `>=12.0.0` |
| React / react-dom | 17.0.2 | 18.3.x |
| TypeScript | ^4.4 | 5.9.2 (strict on) |
| `@grafana/eslint-config` | — (legacy `.eslintrc`) | `^10.0.0` (flat, unified stylistic) |
| `.config/` tooling | Grafana-9 snapshot | re-scaffolded (create-plugin 7.8) |
| Package manager | yarn + npm | npm only |
| Node | `.nvmrc` 16 / `>=14` | `.nvmrc` 22 / `>=22` |

---

## Phase 1 — Tooling & dependency modernization

- Migrated `.config/` to the current scaffold via `@grafana/create-plugin migrate` (webpack 5,
  flat ESLint 9, SWC, Playwright e2e, new Docker base).
- Rewrote `package.json` to the modern pinned set; removed junk deps (`nvm`, `reload`, `watch`,
  `jsdoc`, `grafana-plugin-support`, unused `@types/jquery`/`@types/lodash`).
- Standardized on npm (deleted `yarn.lock`, removed the `packageManager` field).
- Root `eslint.config.mjs` (flat config extending `.config/`); removed legacy `.eslintrc`.
- `.nvmrc` → 22, `engines.node` → `>=22`; `plugin.json grafanaDependency` → `>=12.0.0`.
- **TS strict mode ON** (from `@grafana/tsconfig` v2) — surfaced the implicit-`any` errors fixed
  in Phase 3.
- Added a root `webpack.config.ts` that extends the scaffold to copy `src/img → dist/img` (the
  new scaffold otherwise drops the runtime-loaded zoom-button SVGs — caught during verification).

## Phase 2 — Grafana data-access modernization

- **The primary break:** `src/utils.ts` `clusterNodes` `?.values.buffer` → `?.values`. In
  Grafana 10+ `Field.values` *is* a plain array (the old `ArrayVector.buffer` was removed). This
  is the fix that unbroke node clustering on current Grafana.
- Audited all other `field.values` access (index/spread/`join`) — works unchanged on a plain
  array; no further changes needed.
- Confirmed still-valid APIs (`field.display(...)`, `field.state.displayName`, the
  `useFieldConfig` block) are not deprecated on Grafana 13; left field-config untouched.
- Removed the dead `renderCounter` prop (gone from `PanelProps`).

## Phase 3 — Internal modernization (output preserved)

- **Typed data model** (`src/types.ts`): added `Node`, `Link`, `FieldDisplayName`, `ParsedData`;
  rewrote `SimpleOptions` to the exact 30 builder option paths. Typed the parsers
  (`dataParser.ts`, `pathDataParser.ts`) and `utils.ts` end-to-end. Algorithms unchanged.
- **`Arc.tsx`:** replaced the module-level mutable `toolTip` **singleton** (shared across every
  panel instance on a page — a real multi-instance bug) with component `useState`; replaced the
  global `localStorage` first-render flag with a per-instance `useRef`.
- **`styles.ts`:** kebab-case CSS keys → camelCase (verified React emits identical CSS).
- Removed dead code (`calcDiagramHeight`, empty/commented blocks); typed `SimplePanel`,
  `SearchField`, and the D3 component props.

## Tests & CI

- 30 unit tests across `utils`, `dataParser`, `pathDataParser`, `module` (incl. regressions);
  Jest `transformIgnorePatterns` extended for ESM d3.
- CI now runs `typecheck → lint → test:ci → build` (was build-only) on npm + Node 22; dropped
  dead Go-backend steps. Release workflow updated to npm + Node 22.

---

## Post-refactor follow-ups (resolved known issues)

These were originally deferred and have since been completed:

- **ESLint stylistic deprecation** — upgraded `@grafana/eslint-config` 9 → 10 (which uses the
  unified `@stylistic/eslint-plugin` instead of the deprecated `@stylistic/eslint-plugin-ts`) and
  updated the changed flat-config import path in `.config/eslint.config.mjs`. `eslint .` is clean
  with no deprecation notice.
- **Residual `any` eliminated** — the data layer is typed with real Grafana/shared types
  (`Field`, `Node`, `Link`, `PanelData`), and the `Arc.tsx` D3 selection callbacks now infer
  `Node`/`Link` via explicit `d3.selectAll<…>` datum generics. The **only** remaining `any` is
  the deliberate `[key: string]: any` index signature on `Link` in `types.ts`, which models the
  dynamically-named Grafana fields (color-config / per-field display arrays); converting it to
  `unknown` would force casts at every dynamic-field access without adding real safety.
- **Edit-mode first render** — the fragile fixed `setTimeout(…, 100)` re-layout was replaced with
  a **`ResizeObserver`** that fires the *same* re-layout body (including the load-bearing
  `offsetFirstRender = 40` adjustment) on its first post-layout observation, then disconnects;
  the effect cleanup disconnects it on unmount. Output is preserved by construction. ⚠️ *Still
  needs a human visual check in panel-edit mode — automated checks can't cover on-screen layout.*
- **Tooltip → Grafana component** — the hand-rolled `<div id="tooltip">` and its manual
  `getBoundingClientRect` positioning math were replaced with Grafana's
  **`<VizTooltipContainer>`** (rendered in a `<Portal>`), which handles cursor positioning and
  viewport edge-collision. The tooltip content/wiring (`updateTooltip`, `showTooltip` state) is
  unchanged, **except its text color**, which is now taken from the theme (`props.textColor` =
  `theme.colors.text.primary`) — the old hard-coded black was unreadable on the themed (dark)
  tooltip background. Note: `VizTooltipContainer` is marked `@alpha` in `@grafana/ui`.

---

## Grafana 13 rendering fixes (found by testing with real data)

The checks above (registration, unit tests) never rendered the panel with actual node/link data,
so a set of Grafana-9→13 rendering breaks surfaced only during manual testing. These **change the
rendered output on purpose** — the original code was broken on Grafana 13:

- **`data-panelid` selector removed (the big one).** Every D3 selection was scoped with
  `document.querySelectorAll('[data-panelid="<id>"] …')`. Grafana 13 no longer emits that
  attribute, so all re-selections/measurements matched nothing. Label measurement then returned
  `Math.max([]) = -Infinity`, which propagated to `cy="Infinity"` / `d="M x Infinity …"` and drew
  the entire diagram off-screen. **Fixed** by scoping every selection to a wrapper id the plugin
  controls, `#arc-${props.panelId}` (added to the component's root `<div>` in `Arc.tsx`).
- **`calcBottomOffset` hardening** (`utils.ts`): returns a `minOffset` when there are no labels
  (so an empty set can never produce `-Infinity`), and floors the bottom margin at
  `fontSize * 2`. The node labels are rotated -45° and `getBoundingClientRect` under-reports their
  extent right after append, which clipped the letters at small font sizes; the font-proportional
  floor guarantees room.
- **Visible self-loops** (`Arc.tsx`): a link with `source === target` used to compute a
  zero-radius (invisible) arc. The arc-path builder was extracted into a shared `arcPathFor(i, y)`
  helper (used by both the main render and the edit-mode re-layout) that special-cases self-loops
  into a small loop drawn above the node.

## Test layout & end-to-end tests

- **All tests live in a top-level `test files/` folder** (name intentionally contains a space):
  the 4 Jest unit suites plus the Playwright e2e specs. Jest `testMatch`, the root
  `playwright.config.ts` (`testDir`/`testMatch`), and `eslint.config.mjs` were pointed at it; the
  `.test.ts` vs `.spec.ts` split keeps Jest and Playwright from picking up each other's files.
- **`tsconfig.json`** was widened (`rootDir: "."`, includes `test files` + `playwright.config.ts`)
  so the editor and the `typecheck` gate cover them. (`webpack.config.ts` is deliberately excluded
  — it extends the scaffold's `.config/webpack` chain, which uses `.ts` import extensions.)
- **E2E** (`@grafana/plugin-e2e`): `arcdiagram.spec.ts` (loads the viz, checks custom options,
  and an **Infinity regression guard** asserting rendered `cy`/`d` are finite) and
  `arcdiagram-visual.spec.ts` (self-loop + dense scenarios that save screenshots to
  `test files/screenshots/` for human review). Backed by `provisioning/` (an `ArcTestData`
  datasource + `arc-diagram`/`arc-selfloop`/`arc-dense` dashboards). These require the Docker test
  Grafana (`npm run server`, which mounts `../provisioning`); run with `npm run e2e`.

---


## How to build, run, and verify

```
npm install          # Node 20/22 recommended (works on 26 with an engine warning)
npm run build        # production build -> dist/   (npm run dev for watch)
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # eslint flat config
npm run test:ci      # jest unit tests
```

The plugin is symlinked into the local Grafana plugins dir
(`/opt/homebrew/var/lib/grafana/plugins/esnet-arcdiagram-panel -> ./dist`) and allowed as
unsigned in `grafana.ini`. After a build, `brew services restart grafana` and open
http://localhost:3000 (admin / admin). Add an **Arc Diagram** panel backed by node/link-style
data (source/target/weight fields, or path strings for hop mode).

All four gates (typecheck, lint, tests, build) are green, and the plugin registers cleanly on the
local Grafana 13.0.2.

