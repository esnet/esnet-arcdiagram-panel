import { createTheme } from '@grafana/data';
import { parseData } from 'dataParser';
import { SimpleOptions } from 'types';

const theme = createTheme();

/** Build a minimal Grafana-like field with the bits the parser touches. */
function field(name: string, values: any[], type = 'string', color = '#abcabc') {
  return {
    name,
    type,
    values,
    state: { displayName: name, range: undefined },
    display: (v: any) => ({ text: String(v), suffix: undefined, color }),
  };
}

function buildData(fields: any[]): any {
  return { series: [{ fields }] };
}

/** Defaults that exercise the simple (non-cluster, non-hop) path. */
function options(overrides: Partial<SimpleOptions> = {}): SimpleOptions {
  return {
    hopMode: false,
    delimiter: 'space',
    isCluster: false,
    srcCluster: '',
    dstCluster: '',
    pathField: '',
    src: '',
    dest: '',
    arcFromSource: false,
    radiusFromSource: false,
    arcThickness: 2,
    arcOpacity: 1,
    nodeRadius: 5,
    nodeColor: '#ff0000',
    fontSize: 10,
    tooltipFontSize: 10,
    yRad: 2,
    arcHeight: 1,
    marginLeft: 0,
    marginRight: 0,
    scale: 'lin',
    arcRange: '1,15',
    nodeRange: '1,15',
    arcWeightSource: '',
    linkColorConfig: 'default',
    colorConfigField: '',
    search: false,
    zoom: false,
    toolTipSource: '',
    toolTipTarget: '',
    ...overrides,
  };
}

describe('parseData', () => {
  it('builds unique nodes and links from source/target/weight fields', () => {
    const data = buildData([
      field('src', ['A', 'B']),
      field('dst', ['B', 'C']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parseData(data, options(), theme);

    // A, B, C are the unique nodes
    expect(result.uniqueNodes.map((n) => n.name)).toEqual(['A', 'B', 'C']);
    expect(result.uniqueNodes.map((n) => n.id)).toEqual([0, 1, 2]);

    // two links: A->B and B->C
    expect(result.links).toHaveLength(2);
    expect(result.links[0]).toMatchObject({ source: 0, target: 1, arcWeightValue: 10 });
    expect(result.links[1]).toMatchObject({ source: 1, target: 2, arcWeightValue: 20 });
  });

  it('applies the fixed arc thickness as stroke width when arcFromSource is off', () => {
    const data = buildData([
      field('src', ['A', 'B']),
      field('dst', ['B', 'C']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parseData(data, options({ arcThickness: 4 }), theme);
    expect(result.links.every((l) => l.strokeWidth === 4)).toBe(true);
  });

  it('colors nodes using the configured node color via the theme', () => {
    const data = buildData([
      field('src', ['A']),
      field('dst', ['B']),
      field('weight', [1], 'number'),
    ]);

    const result = parseData(data, options({ nodeColor: '#00ff00' }), theme);
    expect(result.uniqueNodes.every((n) => n.color === '#00ff00')).toBe(true);
  });

  it('accumulates node weight sums across links', () => {
    const data = buildData([
      field('src', ['A', 'B']),
      field('dst', ['B', 'C']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parseData(data, options(), theme);
    const byName = Object.fromEntries(result.uniqueNodes.map((n) => [n.name, n.sum]));
    expect(byName['A']).toBe(10);
    expect(byName['B']).toBe(30);
    expect(byName['C']).toBe(20);
  });
});
