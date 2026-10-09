import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Arc from './Arc';

jest.mock('@grafana/runtime', () => ({
  locationService: { getSearchObject: () => ({}) },
}));

let consoleError: jest.SpyInstance;
beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  const errors = consoleError.mock.calls;
  consoleError.mockRestore();
  expect(errors).toEqual([]);
});

const options = {
  marginLeft: 50, marginRight: 50, arcHeight: 0.4, arcOpacity: 1,
  fontSize: 12, tooltipFontSize: 12, toolTipSource: 'From:', toolTipTarget: 'To:',
};

function diagram(id: number) {
  const parsedData = {
    uniqueNodes: [
      { id: 0, name: 'a', radius: 5, sum: 10, color: 'blue' },
      { id: 1, name: 'b', radius: 5, sum: 10, color: 'blue' },
    ],
    links: [{ source: 0, target: 1, arcWeightValue: 10, strokeWidth: 2, color: 'blue', trafficDisplay: ['10 Mbps'] }],
    fields: [{ field: 'traffic', displayName: 'Traffic' }],
  };
  return <div data-arcdiagram-panel={id}>
    <Arc panelId={id} parsedData={parsedData} graphOptions={options}
      width={600} height={400} query="" zoomState={10} isDarkMode={true} />
  </div>;
}

it('lays out finite geometry and labels without Grafana DOM attributes', () => {
  const { container } = render(diagram(7));
  const nodes = container.querySelectorAll('circle');
  expect(nodes).toHaveLength(2);
  expect(container.querySelectorAll('text')).toHaveLength(2);
  for (const node of Array.from(nodes)) {
    expect(Number.isFinite(Number(node.getAttribute('cy')))).toBe(true);
  }
  expect(container.querySelector('path')?.getAttribute('d')).not.toMatch(/Infinity|NaN/);
});

it('scopes updates and tooltips to the hovered panel after React commits', () => {
  const otherPanel = diagram(8);
  const { container, rerender } = render(<>{diagram(7)}{otherPanel}</>);
  const otherNode = container.querySelector('[data-arcdiagram-panel="8"] circle');
  const hovered = container.querySelector('[data-arcdiagram-panel="7"] circle')!;
  fireEvent.mouseOver(hovered, { clientX: 50, clientY: 50 });
  expect(container.querySelector('[data-arcdiagram-panel="7"] #tooltip')).toHaveTextContent('a');
  expect(container.querySelector('[data-arcdiagram-panel="8"] #tooltip')).toBeNull();
  fireEvent.mouseOut(hovered);
  rerender(<>{diagram(7)}{otherPanel}</>);
  // Updating one panel must not remove another panel's DOM elements.
  expect(otherNode?.isConnected).toBe(true);
});

it('renders a link metric tooltip without invalid paragraph nesting', () => {
  const { container } = render(diagram(7));
  fireEvent.mouseOver(container.querySelector('path')!, { clientX: 50, clientY: 50 });
  expect(container.querySelector('#tooltip')).toHaveTextContent('Traffic:10 Mbps');
});
