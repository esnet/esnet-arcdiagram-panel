// Visual e2e scenarios for the ESnet Arc Diagram panel.
//
// These render specific data shapes and SAVE A SCREENSHOT of each so you can visually confirm
// the diagram looks readable/correct. They also assert the basics (renders, no error overlay,
// finite coordinates) so an obviously-broken render still fails the run.
//
// Requires the Docker test Grafana (it mounts ../provisioning, which holds the datasource and
// the dashboards referenced below):
//
//   npm run build
//   npm run server                       # Grafana on :3000 with ./provisioning
//   npm run e2e -- arcdiagram-visual     # (in another shell)
//
// Screenshots are written to:  test files/screenshots/<name>.png
import { test, expect } from '@grafana/plugin-e2e';

const PANEL_TITLE = 'Arc Diagram (e2e)';
const SHOT_DIR = 'test files/screenshots';

// A finite SVG length: an integer or decimal, optionally negative. "Infinity"/"NaN" fail this.
const FINITE = /^-?\d+(\.\d+)?$/;

// Render wider so dense diagrams have room to be readable in the screenshot.
test.use({ viewport: { width: 1600, height: 900 } });

test.describe('Arc Diagram visual scenarios', () => {
  test('self-looping nodes render without breaking (screenshot)', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'arc-selfloop.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });
    const panel = dashboardPage.getPanelByTitle(PANEL_TITLE);

    const nodes = panel.locator.locator('circle[name]');
    await expect(nodes.first()).toBeVisible();
    await expect(panel.getErrorIcon()).toBeHidden();

    // The data has A->A, B->B, C->C self-loops. source===target makes a zero-radius arc; the
    // important thing is it must not produce Infinity/NaN or throw.
    const cyValues = await nodes.evaluateAll((els) => els.map((e) => e.getAttribute('cy')));
    for (const cy of cyValues) {
      expect(cy, 'self-loop node cy should be finite').toMatch(FINITE);
    }
    const dValues = await panel.locator
      .locator('path[source]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('d')));
    for (const d of dValues) {
      expect(d).not.toContain('Infinity');
      expect(d).not.toContain('NaN');
    }

    // Let any layout settle, then capture for human review.
    await panel.locator.locator('path[source]').first().waitFor();
    await page.waitForTimeout(500);
    await panel.locator.screenshot({ path: `${SHOT_DIR}/self-loop.png` });
  });

  test('dense diagram (12 nodes, 30 links) renders readably (screenshot)', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'arc-dense.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });
    const panel = dashboardPage.getPanelByTitle(PANEL_TITLE);

    const nodes = panel.locator.locator('circle[name]');
    await expect(nodes.first()).toBeVisible();
    await expect(panel.getErrorIcon()).toBeHidden();

    // Every node (A..L = 12) and arc must have finite coordinates even when densely packed.
    expect(await nodes.count()).toBeGreaterThanOrEqual(10);
    const cyValues = await nodes.evaluateAll((els) => els.map((e) => e.getAttribute('cy')));
    for (const cy of cyValues) {
      expect(cy, 'dense node cy should be finite').toMatch(FINITE);
    }
    const arcs = panel.locator.locator('path[source]');
    expect(await arcs.count()).toBeGreaterThanOrEqual(20);
    const dValues = await arcs.evaluateAll((els) => els.map((e) => e.getAttribute('d')));
    for (const d of dValues) {
      expect(d).not.toContain('Infinity');
      expect(d).not.toContain('NaN');
    }

    await arcs.first().waitFor();
    await page.waitForTimeout(500);
    await panel.locator.screenshot({ path: `${SHOT_DIR}/dense.png` });
  });
});
