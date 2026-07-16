import { createTheme } from '@grafana/data';
import { parsePathData } from 'pathDataParser';
import { SimpleOptions } from 'types';

const theme = createTheme();

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

function options(overrides: Partial<SimpleOptions> = {}): SimpleOptions {
  return {
    hopMode: true,
    delimiter: 'space',
    isCluster: false,
    srcCluster: '',
    dstCluster: '',
    pathField: 'route',
    src: '',
    dest: '',
    arcFromSource: false,
    radiusFromSource: false,
    arcThickness: 1,
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

describe('parsePathData', () => {
  it('splits path strings into unique nodes', () => {
    const data = buildData([
      field('route', ['A B C', 'A B D']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parsePathData(data, options(), theme);
    expect(result.uniqueNodes.map((n) => n.name)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('creates a link for each consecutive hop in every path', () => {
    const data = buildData([
      field('route', ['A B C', 'A B D']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parsePathData(data, options(), theme);
    // A->B and B->C from path 0; A->B and B->D from path 1
    expect(result.links).toHaveLength(4);
    // every link carries the weight of its own path
    const pathWeights = result.links.map((l) => ({ pathIndex: l.pathIndex, weight: l.arcWeightValue }));
    expect(pathWeights).toEqual(
      expect.arrayContaining([
        { pathIndex: 0, weight: 10 },
        { pathIndex: 1, weight: 20 },
      ])
    );
  });

  it('honors a non-space delimiter (regression for the hard-coded space split)', () => {
    const data = buildData([
      field('route', ['A,B,C', 'A,B,D']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parsePathData(data, options({ delimiter: ',' }), theme);
    // nodes split on commas, and links are still formed (previously hop-splitting used a
    // hard-coded space, so a comma delimiter produced no links)
    expect(result.uniqueNodes.map((n) => n.name)).toEqual(['A', 'B', 'C', 'D']);
    expect(result.links.length).toBe(4);
  });

  it('reads the user-selected pathField even when it is not the first column', () => {
    // weight is first, the path column ("route") is second — the parser must follow
    // options.pathField instead of blindly using allData[0].
    const data = buildData([
      field('weight', [10, 20], 'number'),
      field('route', ['A B C', 'A B D']),
    ]);

    const result = parsePathData(data, options({ pathField: 'route' }), theme);
    expect(result.uniqueNodes.map((n) => n.name)).toEqual(['A', 'B', 'C', 'D']);
    expect(result.links).toHaveLength(4);
  });

  it('parses the wrong column if pathField is ignored (guards the allData[0] regression)', () => {
    // If the parser fell back to allData[0] (the numeric weight column) instead of the
    // configured "route" field, the nodes would be the stringified weights, not A/B/C/D.
    const data = buildData([
      field('weight', [10, 20], 'number'),
      field('route', ['A B C', 'A B D']),
    ]);

    const result = parsePathData(data, options({ pathField: 'route' }), theme);
    expect(result.uniqueNodes.map((n) => n.name)).not.toEqual(['10', '20']);
  });

  it('falls back to the first field when pathField is empty (default behavior preserved)', () => {
    const data = buildData([
      field('route', ['A B C', 'A B D']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parsePathData(data, options({ pathField: '' }), theme);
    expect(result.uniqueNodes.map((n) => n.name)).toEqual(['A', 'B', 'C', 'D']);
    expect(result.links).toHaveLength(4);
  });

  it('flags the repeated A->B hop as an overlap', () => {
    const data = buildData([
      field('route', ['A B C', 'A B D']),
      field('weight', [10, 20], 'number'),
    ]);

    const result = parsePathData(data, options(), theme);
    const overlaps = result.links.filter((l) => l.isOverlap);
    expect(overlaps.length).toBeGreaterThan(0);
  });
});
