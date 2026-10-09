import { getFieldDisplayName } from '@grafana/data';

/** Normalize Grafana 9 vectors and modern array fields without changing query data. */
export function preparePanelData(data: any, options: any) {
  const series = (data?.series ?? []).map((frame: any) => ({
    ...frame,
    fields: (frame.fields ?? []).map((field: any) => ({
      ...field,
      state: { ...field.state },
      values: Array.isArray(field.values)
        ? field.values
        : typeof field.values?.toArray === 'function'
        ? field.values.toArray()
        : typeof field.values?.get === 'function'
        ? Array.from({ length: field.values.length }, (_, index) => field.values.get(index))
        : [],
    })),
  }));
  const frame = series[0];
  const resolvedOptions = { ...options };
  if (frame) {
    // Dropdowns can store a display name while parsers look up the raw name.
    // Prefer an exact raw name, then resolve a configured/displayed alias.
    for (const key of ['src', 'dest', 'arcWeightSource', 'srcCluster', 'dstCluster', 'colorConfigField', 'pathField']) {
      const selected = options[key];
      if (typeof selected !== 'string' || !selected) {
        continue;
      }
      const field = frame.fields.find((item: any) => item.name === selected)
        ?? frame.fields.find((item: any) => getFieldDisplayName(item, frame, series) === selected);
      if (field) {
        resolvedOptions[key] = field.name;
      }
    }
  }
  return { data: { ...data, series }, options: resolvedOptions };
}
