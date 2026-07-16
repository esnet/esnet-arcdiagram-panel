// [refactor] Added real types throughout this file: the signature is now
// (data: PanelData, options: SimpleOptions, theme: GrafanaTheme2): ParsedData, and the local
// `uniqueNodes`/`links`/`visited`/`overlapGroups` collections are typed (were implicit `any`).
// `allData` is `Field[]`, so the `.find(...)` callbacks infer `Field`; the `!` assertions mark
// the spots the original code already assumed present (a configured field exists / has a display
// processor). Logic unchanged.
import { GrafanaTheme2, PanelData } from '@grafana/data';
import { calcNodeRadius, calcStrokeWidth, getEvenlySpacedColors, getFieldDisplayNames } from "utils";
import { Link, Node, ParsedData, SimpleOptions } from "types";

/**
 * Takes data from Grafana query and returns it in the format needed for this panel
 *
 * @param data the data returned by the query
 * @param options the field options from the editor panel
 * @param theme needed for utility functions for example to map color strings to hex values
 * @return {uniqueNodes} list of unique nodes to be rendered on the x axis
 * @return {links} array of objects with fields source, target, sum, strokewidth where each object represents one link
 * @return {hexColors} colors converted to hex
 */

export function parsePathData(data: PanelData, options: SimpleOptions, theme: GrafanaTheme2): ParsedData {

  const allData = data.series[0].fields;

  // [refactor] Bug fix: honor the user-selected `options.pathField` (configured in the Data ->
  // "Path" select when hopMode is on) instead of always reading `allData[0]`. A configured-but-
  // unmatched field name falls back to the first field, matching the src/dst fallbacks in
  // parseData. This is what makes the "Path" option actually take effect and lets the path column
  // sit anywhere in the query result.
  const pathString = options.pathField ? (allData.find((obj) => obj.name === options.pathField)?.name ?? allData[0].name) : allData[0].name;
  const pathField = allData.find((obj) => obj.name === pathString) ?? allData[0];
  const paths = pathField.values;

  // [refactor] Bug fix: optional-chain the field lookup so a configured-but-unmatched weight
  // field falls back to the last field instead of throwing on `undefined.name`.
  const arcWeightString = options.arcWeightSource ? (allData.find((obj) => obj.name === options.arcWeightSource)?.name ?? allData[allData.length -1].name) : allData[allData.length -1].name
  const arcWeightValues = allData.find((obj) => obj.name === arcWeightString)?.values

  const fields = getFieldDisplayNames(allData)

  const delimiter = options.delimiter === "space" ? " " : options.delimiter

  /********************************** Nodes **********************************/

    // [refactor] Stylistic: `let` -> `const` (never reassigned).
    const uniqueNodes: Node[] = Array.from([...new Set<string>(paths.join(delimiter).split(delimiter))]).map((str, index) => ({
      id: index,
      name: str,
      sum: 1,
      radius: 5,
      color: options.nodeColor
    }));

  /********************************** Links **********************************/

    const pathColors = getEvenlySpacedColors(paths.length, theme.isDark)

    const links: Link[] = [];

    paths.forEach((path: string, pathIndex: number) => {
      // [refactor] Bug fix: split each path on the configured `delimiter` (matching how the
      // unique nodes are built above). It previously hard-coded a space, so any non-space
      // delimiter produced node names that never matched and yielded an empty diagram.
      const pathNodes = String(path).split(delimiter);

      for (let i = 0; i < pathNodes.length; i++) {
        const source = uniqueNodes.find((node) => node.name === pathNodes[i])?.id;

        const target = uniqueNodes.find((node) => node.name === pathNodes[i+1])?.id;
        const isOverlap = links.some((link) => link.source === source && link.target === target);

        if(target !== undefined) {
          const link: Link = {
            id: 0,
            source,
            target,
            pathIndex,
            arcWeightValue: arcWeightValues![pathIndex],
            strokeWidth: 1,
            color: pathColors[pathIndex],
            displayValue: `${allData[allData.length -1].display!(allData[allData.length -1].values[pathIndex]).text}${(allData[allData.length -1].display!(allData[allData.length -1].values[pathIndex]).suffix !== undefined) ? allData[allData.length -1].display!(allData[allData.length -1].values[pathIndex]).suffix : ""}`,
            isOverlap,
            mapRadiusY: 0
          }
          fields.forEach( field => {
            Object.assign(link, {[field.field]: []})
            link[field.field].push(allData.find((obj) => obj.name === field.field)?.values[pathIndex])
            const display = allData.find((obj) => obj.name === field.field)!.display!(allData.find((obj) => obj.name === field.field)?.values[pathIndex])
            const suffix = display.suffix === undefined ? "" : display.suffix
            Object.assign(link, {[`${field.field}Display`]: [`${display.text} ${suffix}`]})
          })
          links.push(link);
        }
      }
    });

    links.forEach((link, index) => {
      link.id = index
    })

    // assign overlap index to render elliptical arc
    const overlapLinks = links.filter(link => link.isOverlap)

    const overlapGroups: Link[][] = [];
    const visited: Link[] = [];

    for (let i = 0; i < overlapLinks.length; i++) {
      const currentLink = overlapLinks[i];
      const overlapGroup = [currentLink];
      // keep track of visited links, go to next iteration if link already part of group
      if(visited.includes(currentLink)) {
        continue
      }
      for (let j = i + 1; j < overlapLinks.length; j++) {
        const compareLink = overlapLinks[j]
        if(currentLink.source === compareLink.source && currentLink.target === compareLink.target) {
          overlapGroup.push(compareLink);
          visited.push(compareLink)
        }
      }
      overlapGroups.push(overlapGroup)
    }

    // iterate over overlapGroups and assign radiusY
    for (let i = 0; i < overlapGroups.length; i++) {
      const currentGroup = overlapGroups[i]
      let mapRadiusY = options.yRad
      for (let j = 0; j < currentGroup.length; j++) {
        const currentLink = currentGroup[j]
        currentLink.mapRadiusY = mapRadiusY
        mapRadiusY += options.yRad-1
      }
    }

  /********************************** Stroke width/ node radius **********************************/

    // set range for mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0]
    const linkScaleTo = options.arcRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map((e) => e.arcWeightValue)))
    const maxLink = Number(Math.max(...links.map((e) => e.arcWeightValue)))

    for (let i = 0; i < links.length; i++) {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, links[i], linkScaleFrom, linkScaleTo, minLink, maxLink)
    }

    calcNodeRadius(uniqueNodes, links, options)
  /**********************************************************************************/
  return {uniqueNodes, links, fields};
}
