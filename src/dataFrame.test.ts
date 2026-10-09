import { preparePanelData } from './dataFrame';
import { parseData } from './dataParser';
import { calcBottomOffset, isTimeSeries } from './utils';

const options = {
  src: 'source', dest: 'destination', arcWeightSource: 'traffic_mbps',
  nodeColor: 'blue', nodeRadius: 5, arcThickness: 1, arcFromSource: false,
  radiusFromSource: false, arcRange: '1,15', scale: 'lin', linkColorConfig: 'default',
};
const display = (value: any) => ({ text: String(value), color: 'blue' });

function input(legacy: boolean) {
  const values = (items: any[]) => legacy
    ? { length: items.length, toArray: () => items, get: (index: number) => items[index] }
    : items;
  return { series: [{ length: 2, fields: [
    { name: 'source', type: 'string', values: values(['a', 'b']), config: {}, display },
    { name: 'destination', type: 'string', values: values(['b', 'c']), config: {}, display },
    { name: 'Value', type: 'number', values: values([10, 20]), config: { displayName: 'traffic_mbps' }, display },
  ] }] };
}

describe('Grafana version compatibility', () => {
  it.each([false, true])('parses weights from %s legacy vector fields without mutating input', legacy => {
    const original = input(legacy);
    const prepared = preparePanelData(original, options);
    expect(prepared.options.arcWeightSource).toBe('Value');
    expect(original.series[0].fields[0]).not.toHaveProperty('state');
    const parsed = parseData(prepared.data, prepared.options, {
      visualization: { getColorByName: (name: string) => name },
    });
    expect(parsed.uniqueNodes.map(node => node.name)).toEqual(['a', 'b', 'c']);
    expect(parsed.links.map(link => link.arcWeightValue)).toEqual([10, 20]);
    expect(parsed.uniqueNodes.map(node => node.sum)).toEqual([10, 30, 20]);
  });

  it('handles get-only vectors', () => {
    const original = input(true);
    const field: any = original.series[0].fields[0];
    delete field.values.toArray;
    expect(preparePanelData(original, options).data.series[0].fields[0].values).toEqual(['a', 'b']);
  });

  it('prefers raw field names over a colliding display alias', () => {
    const original = input(false);
    original.series[0].fields[0].config = { displayName: 'Value' };
    expect(preparePanelData(original, { ...options, arcWeightSource: 'Value' }).options.arcWeightSource).toBe('Value');
  });

  it('does not crash while query data is empty or request metadata is absent', () => {
    const prepared = preparePanelData({ series: [] }, options);
    expect(prepared.data.series).toEqual([]);
    expect(isTimeSeries(prepared.data)).toBe(false);
    expect(isTimeSeries(input(false))).toBe(false);
  });

  it('produces finite layout coordinates when no labels match', () => {
    const offset = calcBottomOffset([] as any);
    expect(offset).toBe(0);
    expect(Number.isFinite(400 - offset)).toBe(true);
  });

  it('measures finite labels and ignores invalid measurements', () => {
    const labels = [10, 20, Infinity].map(height => ({ getBoundingClientRect: () => ({ height }) }));
    expect(calcBottomOffset(labels as any)).toBe(32);
  });
});
