import { PanelPlugin } from '@grafana/data';
// [refactor] Relative path updated after this test moved out of src/ into "test files/".
// (The other tests in this folder import the code under test via bare specifiers, which still
// resolve through Jest's `modulePaths: ['<rootDir>/src']` setting.)
import { plugin } from '../src/module';

describe('plugin', () => {
  it('is registered as a PanelPlugin', () => {
    expect(plugin).toBeInstanceOf(PanelPlugin);
  });

  it('wires up the SimplePanel component', () => {
    expect(plugin.panel).toBeDefined();
  });

  it('runs the options builder without throwing', () => {
    // Importing ./module executes setPanelOptions(); a registered supplier confirms the
    // option builder ran successfully.
    expect(typeof (plugin as any).getPanelOptionsSupplier).toBe('function');
  });
});
