import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { SimplePanel } from './SimplePanel';

jest.mock('@grafana/ui', () => ({
  useTheme2: () => ({
    isDark: true,
    colors: { text: { primary: 'white' } },
    visualization: { getColorByName: (name: string) => name },
  }),
}));
jest.mock('./components/Arc', () => ({
  __esModule: true,
  default: () => <svg data-testid="arc" />,
}));
jest.mock('./components/SearchField', () => ({ __esModule: true, default: () => null }));

const options = {
  src: 'source', dest: 'destination', arcWeightSource: 'Value',
  nodeColor: 'blue', nodeRadius: 5, arcThickness: 1,
  arcFromSource: false, radiusFromSource: false, linkColorConfig: 'default',
};
const display = (value: any) => ({ text: String(value), color: 'blue' });
const data = { series: [{ length: 1, fields: [
  { name: 'source', type: 'string', values: ['a'], config: {}, display },
  { name: 'destination', type: 'string', values: ['b'], config: {}, display },
  { name: 'Value', type: 'number', values: [10], config: {}, display },
] }] };

function panel(queryData: any, panelOptions = options) {
  return <SimplePanel {...({ data: queryData, options: panelOptions, id: 7, width: 600, height: 400 } as any)} />;
}

it('owns its DOM scope without a Grafana panel wrapper', () => {
  render(panel(data));
  expect(screen.getByTestId('arc').closest('[data-arcdiagram-panel="7"]')).not.toBeNull();
});

it('handles empty loading data and a subsequent query result', () => {
  const { rerender } = render(panel({ series: [] }));
  expect(screen.getByText('No data')).toBeInTheDocument();
  rerender(panel(data));
  expect(screen.getByTestId('arc')).toBeInTheDocument();
});

it('explains an unavailable selected field instead of throwing', () => {
  render(panel(data, { ...options, arcWeightSource: 'removed' }));
  expect(screen.getByText('Selected field is unavailable: removed')).toBeInTheDocument();
  expect(screen.queryByTestId('arc')).not.toBeInTheDocument();
});
