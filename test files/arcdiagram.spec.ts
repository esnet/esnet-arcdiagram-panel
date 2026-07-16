// End-to-end tests for the ESnet Arc Diagram panel.
//
// These use @grafana/plugin-e2e (Playwright + Grafana page models). They require a running
// Grafana with this plugin installed:
//
//   npm run server      # starts Grafana in Docker with ./dist mounted (uses docker-compose.yaml)
//   npm run build       # (in another shell, or first) so ./dist exists
//   npm run e2e         # runs Playwright against http://localhost:3000
//
// Import `test`/`expect` from @grafana/plugin-e2e (NOT @playwright/test) so the Grafana
// fixtures and page models are available and version differences are handled for us.
import { test, expect } from '@grafana/plugin-e2e';

const ARC_DIAGRAM = 'Arc Diagram';

// Any of the panel's deterministic guard messages (from SimplePanel.tsx). Whatever the default
// data source returns, the panel renders one of these rather than crashing.
const GUARD_MESSAGE =
  /No data|Time series not supported|Requires at least a source and target field|Choose fields for clustering|Node clustering requires/;

test.describe('Arc Diagram panel', () => {
  test('loads as a visualization and renders without runtime errors', async ({ panelEditPage }) => {
    // Switch the freshly-created panel to our visualization. This exercises plugin registration
    // (module.ts) and that the panel component mounts in real Grafana.
    await panelEditPage.setVisualization(ARC_DIAGRAM);

    // The panel container is rendered...
    await expect(panelEditPage.panel.locator).toBeVisible();

    // ...with no Grafana panel error overlay (i.e. the React tree did not throw). This is the
    // core smoke assertion: pre-refactor, node clustering threw on Grafana 13 due to the removed
    // Field.values.buffer internal.
    await expect(panelEditPage.panel.getErrorIcon()).toBeHidden();

    // ...and it shows one of its own deterministic messages for the default (non source/target)
    // query, proving the component's own render path ran (not a generic Grafana fallback).
    await expect(panelEditPage.panel.locator).toContainText(GUARD_MESSAGE);
  });

  test('exposes its custom options from the option builder', async ({ panelEditPage }) => {
    await panelEditPage.setVisualization(ARC_DIAGRAM);

    // Options registered by module.ts must be present in the editor. Assert representative
    // controls from the Appearance category, end-to-end through the real options builder UI.
    const appearance = panelEditPage.getCustomOptions('Appearance');
    await expect(appearance.getSliderInput('Tooltip font size')).toBeVisible();
    await expect(appearance.getSliderInput('Node radius')).toBeVisible();

    // Toggling the Mode category's "Visualize AS path" switch (hop mode) must not crash the
    // panel — it re-parses through pathDataParser instead of dataParser.
    const mode = panelEditPage.getCustomOptions('Mode');
    await mode.getSwitch('Visualize AS path').check({ force: true });
    await expect(panelEditPage.panel.getErrorIcon()).toBeHidden();
  });

  // Regression guard for the Grafana-13 selector break: the plugin scoped its D3 selections
  // with `[data-panelid]`, an attribute Grafana 13 removed. That made label measurement return
  // -Infinity, which propagated to `<circle cy="Infinity">` / `<path d="M x Infinity ...">` and
  // pushed the whole diagram off-screen. This test renders the panel with real source/target/
  // weight data (provisioned dashboard) and asserts every drawn coordinate is a finite number.
  //
  // Needs the provisioned ArcTestData datasource + dashboard, so run it against the Docker test
  // Grafana (`npm run server`), which mounts ../provisioning.
  test('renders nodes and arcs with finite coordinates (Infinity regression guard)', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'arc-diagram.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });
    const panel = dashboardPage.getPanelByTitle('Arc Diagram (e2e)');

    // The diagram draws one <circle name="..."> per unique node (A, B, C, D here). If the
    // selector regression returns, these are never measured and the panel renders nothing.
    const nodeCircles = panel.locator.locator('circle[name]');
    await expect(nodeCircles.first()).toBeVisible();
    expect(await nodeCircles.count()).toBeGreaterThan(0);

    // Every node's vertical position must be a finite number (the bug produced cy="Infinity").
    const cyValues = await nodeCircles.evaluateAll((els) => els.map((e) => e.getAttribute('cy')));
    for (const cy of cyValues) {
      expect(cy, 'circle cy should be a finite number, not Infinity/NaN').toMatch(/^-?\d+(\.\d+)?$/);
    }

    // Likewise the arc paths (drawn with a `source` attribute) must have finite path data.
    const arcPaths = panel.locator.locator('path[source]');
    expect(await arcPaths.count()).toBeGreaterThan(0);
    const dValues = await arcPaths.evaluateAll((els) => els.map((e) => e.getAttribute('d')));
    for (const d of dValues) {
      expect(d).not.toContain('Infinity');
      expect(d).not.toContain('NaN');
    }
  });
});
