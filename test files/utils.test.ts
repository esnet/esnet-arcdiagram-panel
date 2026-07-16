import {
  linSpace,
  mapToLinRange,
  mapToLogRange,
  getEvenlySpacedColors,
  idToName,
  getNodeTargets,
  addNodeSum,
  calcNodeRadius,
  calcStrokeWidth,
  isTimeSeries,
} from 'utils';

describe('linSpace', () => {
  it('returns n evenly spaced values between start and stop', () => {
    expect(linSpace(0, 10, 3)).toEqual([0, 5, 10]);
    expect(linSpace(0, 100, 5)).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('mapToLinRange', () => {
  it('linearly maps a value from the input range to the output range', () => {
    // value 5 in [0,10] -> middle of output [1,10] = 5.5
    expect(mapToLinRange(5, 1, 10, 0, 10)).toBeCloseTo(5.5);
    expect(mapToLinRange(0, 1, 10, 0, 10)).toBeCloseTo(1);
    expect(mapToLinRange(10, 1, 10, 0, 10)).toBeCloseTo(10);
  });
});

describe('mapToLogRange', () => {
  it('maps the minimum input to the minimum of the output range', () => {
    expect(mapToLogRange(1, 1, 10, 1, 100)).toBeCloseTo(1);
  });
  it('maps the maximum input to the maximum of the output range', () => {
    expect(mapToLogRange(100, 1, 10, 1, 100)).toBeCloseTo(10);
  });
  it('falls back to the range minimum when min === max (no log range)', () => {
    expect(mapToLogRange(5, 1, 10, 5, 5)).toBe(1);
  });
  it('falls back to the range minimum for a non-positive value (log undefined)', () => {
    expect(mapToLogRange(0, 1, 10, 1, 100)).toBe(1);
  });
});

describe('scaling guards (regression)', () => {
  it('mapToLinRange returns the range minimum when all values are equal (no NaN)', () => {
    const result = mapToLinRange(5, 1, 15, 5, 5);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(1);
  });
});

describe('getEvenlySpacedColors', () => {
  it('returns the requested number of colors and cycles after 10', () => {
    expect(getEvenlySpacedColors(2, true)).toEqual(['#7CFC00', '#1E90FF']);
    expect(getEvenlySpacedColors(2, false)).toEqual(['#FFD700', '#00BFFF']);
    expect(getEvenlySpacedColors(11, true)).toHaveLength(11);
    // 11th color wraps back to the first
    expect(getEvenlySpacedColors(11, true)[10]).toBe('#7CFC00');
  });
});

describe('idToName', () => {
  it('looks up a node name by id', () => {
    const nodes = [
      { id: 0, name: 'A' },
      { id: 1, name: 'B' },
    ];
    expect(idToName(1, nodes as any)).toBe('B');
  });
  it('returns an empty string instead of throwing for an unmatched id (regression)', () => {
    expect(() => idToName(99, [{ id: 0, name: 'A' }] as any)).not.toThrow();
    expect(idToName(99, [{ id: 0, name: 'A' }] as any)).toBe('');
  });
});

describe('getNodeTargets', () => {
  it('returns the targets of all links originating from the given node', () => {
    const links = [
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 1, target: 2 },
    ];
    expect(getNodeTargets({ id: 0, links: links as any })).toEqual([1, 2]);
    expect(getNodeTargets({ id: 1, links: links as any })).toEqual([2]);
    expect(getNodeTargets({ id: 2, links: links as any })).toEqual([]);
  });
});

describe('addNodeSum', () => {
  it('accumulates each link arcWeightValue onto its source and target node sums', () => {
    const nodes = [
      { id: 0, sum: 0 },
      { id: 1, sum: 0 },
      { id: 2, sum: 0 },
    ];
    const links = [
      { source: 0, target: 1, arcWeightValue: 10 },
      { source: 1, target: 2, arcWeightValue: 20 },
    ];
    addNodeSum(links as any, nodes as any);
    expect(nodes[0].sum).toBe(10);
    expect(nodes[1].sum).toBe(30); // 10 (as target) + 20 (as source)
    expect(nodes[2].sum).toBe(20);
  });
});

describe('calcStrokeWidth', () => {
  it('uses the fixed arc thickness when arcFromSource is off', () => {
    const link: any = { arcWeightValue: 5, strokeWidth: 0 };
    calcStrokeWidth(false, 'lin', 3, link, 1, 10, 0, 10);
    expect(link.strokeWidth).toBe(3);
  });
  it('scales by the weight when arcFromSource is on', () => {
    const link: any = { arcWeightValue: 10, strokeWidth: 0 };
    calcStrokeWidth(true, 'lin', 3, link, 1, 10, 0, 10);
    expect(link.strokeWidth).toBeCloseTo(10);
  });
});

describe('calcNodeRadius', () => {
  it('assigns the fixed node radius when radiusFromSource is off', () => {
    const nodes = [
      { id: 0, radius: 0, sum: 5 },
      { id: 1, radius: 0, sum: 10 },
    ];
    calcNodeRadius(nodes as any, [] as any, { radiusFromSource: false, nodeRadius: 7 } as any);
    expect(nodes[0].radius).toBe(7);
    expect(nodes[1].radius).toBe(7);
  });
});

describe('isTimeSeries', () => {
  it('returns false for plain categorical data', () => {
    const data = { series: [{ fields: [{ type: 'string' }, { type: 'number' }] }] };
    expect(isTimeSeries(data as any)).toBe(false);
  });

  it('returns true when a time field is NOT the first field (regression test)', () => {
    // Before the fix, the loop returned on the first non-time field and missed this.
    const data = {
      series: [{ fields: [{ type: 'string' }, { type: 'string' }, { type: 'time' }] }],
    };
    expect(isTimeSeries(data as any)).toBe(true);
  });

  it('returns true for a date_histogram query target', () => {
    const data = {
      request: { targets: [{ type: 'date_histogram' }] },
      series: [{ fields: [{ type: 'string' }] }],
    };
    expect(isTimeSeries(data as any)).toBe(true);
  });

  it('does not throw when request is undefined', () => {
    const data = { series: [{ fields: [{ type: 'string' }] }] };
    expect(() => isTimeSeries(data as any)).not.toThrow();
  });
});
