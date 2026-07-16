// [refactor] This file was rewritten during the modernization refactor: `SimpleOptions` now
// matches exactly the option paths the builder sets (stale fields removed, `colorConfigField`
// added, `arcWeightSource` corrected to string), and the shared `Node`/`Link`/
// `FieldDisplayName`/`ParsedData` interfaces below are new (the data model was previously `any`).

/**
 * Panel options, defined by the options builder in `module.ts`.
 *
 * This interface lists exactly the option paths the builder sets — no more, no less — so the
 * model stays in sync with the editor UI.
 */
export interface SimpleOptions {
  // Mode
  hopMode: boolean;
  delimiter: string;
  isCluster: boolean;
  srcCluster: string;
  dstCluster: string;
  pathField: string;
  src: string;
  dest: string;

  // Appearance
  arcFromSource: boolean;
  radiusFromSource: boolean;
  arcThickness: number;
  arcOpacity: number;
  nodeRadius: number;
  nodeColor: string;
  fontSize: number;
  tooltipFontSize: number;
  yRad: number;
  arcHeight: number;
  marginLeft: number;
  marginRight: number;
  scale: string;
  arcRange: string;
  nodeRange: string;

  // Data / color
  arcWeightSource: string;
  linkColorConfig: string;
  colorConfigField: string;

  // Controls
  search: boolean;
  zoom: boolean;
  toolTipSource: string;
  toolTipTarget: string;
}

/** A node rendered on the x-axis of the diagram. */
export interface Node {
  id: number;
  name: string | number;
  sum: number;
  radius: number;
  color: string;
  /** Only set when node clustering is enabled. */
  cluster?: string;
}

/**
 * A link (arc) between two nodes.
 *
 * Besides the fixed fields below, links also carry dynamically-named fields keyed by the
 * user-selected Grafana field names (e.g. the color-config field and per-field display
 * arrays). Those are covered by the index signature.
 */
export interface Link {
  id?: number;
  source: number | null | undefined;
  target: number | null | undefined;
  srcName?: string | number;
  dstName?: string | number;
  arcWeightValue: number;
  strokeWidth: number;
  color: string;
  displayValue?: string;
  // [refactor] Renamed from `path` to `pathIndex` so it no longer collides with a dynamic field
  // when the user's path field is literally named "path" (hop/AS-path mode only).
  pathIndex?: number;
  isOverlap?: boolean;
  mapRadiusY?: number;
  sum?: number;
  // Dynamically-named fields keyed by user-selected Grafana field names (e.g. the
  // color-config field and per-field display arrays). These are intentionally loose.
  [key: string]: any;
}

/** Maps a Grafana field name to its display name, used for tooltips. */
export interface FieldDisplayName {
  field: string;
  displayName: string;
}

/** The shape returned by the data parsers and consumed by the Arc component. */
export interface ParsedData {
  uniqueNodes: Node[];
  links: Link[];
  fields: FieldDisplayName[];
  hexColors?: {
    nodeColor: string;
  };
}
