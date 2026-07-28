import { createTheme } from '@grafana/data';
import { parseData } from 'dataParser';
import { SimpleOptions } from 'types';

const theme = createTheme();

/**
 * Build a minimal Grafana-like field with the bits the parser touches.
 *
 * `range` matters: the link-bundling code branches on `state.range !== undefined` to decide
 * whether a field is numeric (values are summed) or categorical (values are collected), so a
 * ranged field is required to reach the numeric merge path. `suffix` mimics a configured unit.
 */
function field(
  name: string,
  values: any[],
  type = 'string',
  color = '#abcabc',
  range: any = undefined,
  suffix: string | undefined = undefined
) {
  return {
    name,
    type,
    values,
    state: { displayName: name, range },
    display: (v: any) => ({ text: String(v), suffix, color }),
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

  // Regression: the guard was `linkColorConfig === 'field' && groups`, and an empty array is
  // truthy. Picking Link color -> "By field" reveals the Field select only afterwards, so
  // `colorConfigField` is briefly unset, `groups` stays empty, and `groups.find(...)!.color` threw
  // — collapsing the panel to "Error parsing data — check the panel configuration and query".
  it('does not throw when link color is "field" but no field is chosen yet (regression)', () => {
    const data = buildData([
      field('src', ['A', 'B']),
      field('dst', ['B', 'C']),
      field('weight', [10, 20], 'number'),
    ]);

    const parse = () => parseData(data, options({ linkColorConfig: 'field' }), theme);
    expect(parse).not.toThrow();

    // Links keep the color already derived from the weight field's thresholds.
    const result = parse();
    expect(result.links).toHaveLength(2);
    expect(result.links.every((l) => l.color === '#abcabc')).toBe(true);
  });
});

describe('parseData link bundling', () => {
  /** Two A->B rows (which bundle into one arc) plus one B->C row. 4 fields enables bundling. */
  function duplicateLinkData(weightRange: any, weightSuffix?: string) {
    return buildData([
      field('src', ['A', 'A', 'B']),
      field('dst', ['B', 'B', 'C']),
      field('extra', ['x', 'x', 'y']),
      field('weight', [10, 20, 5], 'number', '#abcabc', weightRange, weightSuffix),
    ]);
  }

  it('merges duplicate source/target pairs into a single link', () => {
    const result = parseData(duplicateLinkData({ min: 5, max: 20 }), options(), theme);
    expect(result.links).toHaveLength(2);
    expect(result.links[0]).toMatchObject({ source: 0, target: 1 });
    expect(result.links[1]).toMatchObject({ source: 1, target: 2 });
  });

  // Regression: the numeric merge branch was the only display site that interpolated
  // `display.suffix` without the undefined guard the other three used, so a bundled arc's tooltip
  // read "30 undefined" whenever the field had no unit configured — the default.
  it('does not render "undefined" in a bundled link display value (regression)', () => {
    const result = parseData(duplicateLinkData({ min: 5, max: 20 }), options(), theme);

    // The two A->B weights are summed by the numeric merge path.
    expect(result.links[0].weight).toEqual([30]);
    expect(result.links[0].weightDisplay[0]).not.toContain('undefined');
    expect(result.links[0].weightDisplay).toEqual(['30 ']);

    // The unbundled link goes through a different site that was always correct.
    expect(result.links[1].weightDisplay).toEqual(['5 ']);
  });

  it('still appends a configured unit when bundling', () => {
    const result = parseData(duplicateLinkData({ min: 5, max: 20 }, 'Mbps'), options(), theme);
    expect(result.links[0].weightDisplay).toEqual(['30 Mbps']);
  });

  // Regression: the dedupe check was `!existing[f].includes(cur[f])`, comparing an *array* against
  // the scalar entries of `existing[f]`. Under SameValueZero a fresh array reference never matches,
  // so the guard never fired and repeated values piled up in bundled tooltips.
  it('does not duplicate a repeated categorical value when bundling (regression)', () => {
    // `extra` has no state.range, so it takes the collect-values branch. Both A->B rows are 'x'.
    const result = parseData(duplicateLinkData(undefined), options(), theme);
    expect(result.links[0].extra).toEqual(['x']);
  });

  it('collects distinct categorical values when bundling', () => {
    const data = buildData([
      field('src', ['A', 'A']),
      field('dst', ['B', 'B']),
      field('extra', ['x', 'z']),
      field('weight', [10, 20], 'number'),
    ]);
    const result = parseData(data, options(), theme);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].extra).toEqual(['x', 'z']);
  });
});
