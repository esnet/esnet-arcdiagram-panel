// [refactor] Added real types throughout this file: the signature is now
// (data: PanelData, options: SimpleOptions, theme: GrafanaTheme2): ParsedData, and the local
// `uniqueNodes`/`links`/`groups` collections are typed (were implicit `any`). Logic unchanged.
// `allData` is `Field[]`, so the `.find(...)` callbacks infer `Field`; the `!` assertions mark
// the spots the original code already assumed were present (a configured field exists / has a
// display processor).
import { GrafanaTheme2, PanelData } from '@grafana/data';
import { calcStrokeWidth, getEvenlySpacedColors, addNodeSum, calcNodeRadius, clusterNodes, getFieldDisplayNames, formatDisplayValue } from 'utils';
import { Link, Node, ParsedData, SimpleOptions } from 'types';

/**
 * Takes data from Grafana query and returns it in the format needed for this panel
 *
 * @param data the data returned by the query
 * @param options the field options from the editor panel
 * @param theme needed for utility functions for example to map color strings to hex values
 * @return {uniqueNodes} list of unique nodes to be rendered on the x axis
 * @return {links} array of objects with fields source, target, arcWeightValue, strokewidth where each object represents one link
 * @return {hexColors} colors converted to hex
 */

export function parseData(data: PanelData, options: SimpleOptions, theme: GrafanaTheme2): ParsedData {

  const allData = data.series[0].fields;

  // if src/dst not defined in options, take first/second group by default
  // [refactor] Bug fix: optional-chain the field lookups so a configured-but-unmatched field
  // name falls back to the default field instead of throwing on `undefined.name`.
  const sourceString = options.src ? (allData.find((obj) => obj.name === options.src)?.name ?? allData[0].name) : allData[0].name;
  const targetString = options.dest ? (allData.find((obj) => obj.name === options.dest)?.name ?? allData[1].name) : allData[1].name;
  const sourceValues = allData.find((obj) => obj.name === sourceString)?.values
  const targetValues = allData.find((obj) => obj.name === targetString)?.values
  const arcWeightString = options.arcWeightSource ? (allData.find((obj) => obj.name === options.arcWeightSource)?.name ?? allData[allData.length -1].name) : allData[allData.length -1].name
  const arcWeightValues = allData.find((obj) => obj.name === arcWeightString)?.values

  const fields = getFieldDisplayNames(allData, sourceString, targetString)

  const hexColors = {
    nodeColor: theme.visualization.getColorByName(options.nodeColor),
  }

  /********************************** Nodes **********************************/

    // get source and target arrays and create array of unique nodes from them
    const uniqueNodes: Node[] = Array.from([...new Set([...sourceValues!, ...targetValues!])]).map((str, index) => ({
      id: index,
      name: str,
      sum: 0,
      radius: 0,
      cluster: "",
      color: hexColors.nodeColor
    }));

  /********************************** Links **********************************/

    // [refactor] Stylistic: `let` -> `const` (never reassigned).
    const srcById = sourceValues!.map((name: string | number) => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    const dstById = targetValues!.map((name: string | number) => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    let links: Link[] = srcById.map((element, index) => ({
      srcName: sourceValues![index],
      dstName: targetValues![index],
      source: element,
      target: dstById[index],
      arcWeightValue: arcWeightValues![index],
      strokeWidth: 0,
      color: allData[allData.length -1].display!(allData[allData.length -1].values[index]).color as string,
      // for coloring the links by source, add a field with the name of the selected field
      [options.colorConfigField]: allData.find((obj) => obj.name === options.colorConfigField)?.values[index],
    }));

      links.forEach((link: Link, index: number) => {
        fields.forEach( field => {
          Object.assign(link, {[field.field]: []})
          link[field.field].push(allData.find((obj) => obj.name === field.field)?.values[index])
          const display = allData.find((obj) => obj.name === field.field)!.display!(allData.find((obj) => obj.name === field.field)?.values[index])
          Object.assign(link, {[`${field.field}Display`]: [formatDisplayValue(display)]})
        })
      });

  /********************************** Node clustering **********************************/

    if(options.isCluster) {
      clusterNodes(uniqueNodes, links, options, theme, allData)
    }

  /********************************** Bundle overlapping links **********************************/

    if(allData.length > 3) {
      const uniqueLinks = links.reduce((acc: Link[], cur: Link, index: number) => {
        const existing = acc.find((e: Link) => e.source === cur.source && e.target === cur.target);
        if (existing) {
          fields.forEach(field => {
            // [refactor] Bug fix: optional-chain `.state.range` (a field may lack a state).
            if(allData.find((obj) => obj.name === field.field)?.state?.range !== undefined) {
              let newValue = (existing[field.field][0]) + (cur[field.field][0])
              existing[field.field] = [newValue]
              const display = allData.find((obj) => obj.name === field.field)!.display!(newValue)
              // [refactor] Bug fix: this was the one display site that interpolated
              // `display.suffix` unguarded, so a bundled arc whose field had no unit configured
              // showed a literal "30 undefined" in its tooltip. Now shares the helper.
              existing[`${field.field}Display`] = [formatDisplayValue(display)]
            } else {
              // [refactor] Bug fix: the dedupe check was `!existing[…].includes(cur[…])`, which
              // compared an *array* (`cur[field.field]`) against the scalar entries of
              // `existing[field.field]`. Under SameValueZero a fresh array reference never
              // matches, so the guard never fired and every value was appended — duplicating
              // repeated values in bundled tooltips. Check each entry individually instead.
              cur[field.field].forEach((fieldEntry: unknown) => {
                if (!existing[field.field].includes(fieldEntry)) {
                  existing[field.field].push(fieldEntry);
                }
              });
              existing[`${field.field}Display`] = existing[field.field]
            }
          })
        } else {
          const addLink = {
            srcName: cur.srcName,
            dstName: cur.dstName,
            source: cur.source,
            target: cur.target,
            arcWeightValue: cur.arcWeightValue,
            displayValue: cur.displayValue,
            strokeWidth: 0,
            color: cur.color,
            [options.colorConfigField]: cur[options.colorConfigField]
          }
          fields.forEach(field => {
            Object.assign(addLink, {[field.field]: []})
            addLink[field.field] = cur[field.field]
            const display = allData.find((obj) => obj.name === field.field)!.display!(cur[field.field][0])
            // [refactor] Bug fix: optional-chain `.state.range` (a field may lack a state).
            if(allData.find((obj) => obj.name === field.field)?.state?.range !== undefined) {
              Object.assign(addLink, {[`${field.field}Display`]: [formatDisplayValue(display)]})
            } else {
              Object.assign(addLink, {[`${field.field}Display`]: cur[field.field]})
            }
          })
          acc.push(addLink);
        }
        return acc;
      }, []);
      links = uniqueLinks;
    }
    // accumulate nodesums after potential bundling
    addNodeSum(links, uniqueNodes)
    calcNodeRadius(uniqueNodes, links, options)

  /********************************** Colors **********************************/

    // create groups for the field specified
    let groups: Array<Record<string, string>> = []
    if(options.linkColorConfig !== "default" && options.colorConfigField) {
      // create unique groups according to the setting specified in options
      groups = [...new Set(links.map(item => {
        if (Array.isArray(item[options.colorConfigField])) {
          return item[options.colorConfigField][item[options.colorConfigField].length - 1];
        }
        return item[options.colorConfigField];
      }))].map(group => ({
        [options.colorConfigField]: group,
        color: ""
      }));

      const spacedColors = getEvenlySpacedColors(groups.length, theme.isDark)

      groups.forEach( (e, i) => {
        e.color = spacedColors[i]
      })
    }

  /********************************** Stroke width/ node radius **********************************/

    // set range for mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0],
    linkScaleTo = options.arcRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map((e) => e.arcWeightValue))),
    maxLink = Number(Math.max(...links.map((e) => e.arcWeightValue)))

    links.forEach((e: Link, index: number) => {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, e, linkScaleFrom, linkScaleTo, minLink, maxLink)
      // link color by field
      // [refactor] Bug fix: this guard was `&& groups`, and an empty array is truthy. When the
      // user picks Link color -> "By field" the Field select only appears *afterwards*, so
      // `colorConfigField` is briefly unset; `groups` stays [] (see its guard above), the
      // `.find()` returned undefined and `!.color` threw, collapsing the whole panel to
      // "Error parsing data". Require the field and a populated `groups`, and fall back to the
      // color already derived from thresholds rather than throwing.
      if (options.linkColorConfig === "field" && options.colorConfigField && groups.length) {
        const linkGroup = (!Array.isArray(e[options.colorConfigField])) ? e[options.colorConfigField] : e[options.colorConfigField][e[options.colorConfigField].length - 1]
        e.color = groups.find( group => group[options.colorConfigField] === linkGroup)?.color ?? e.color
      }
    });

  /**********************************************************************************/
  return {uniqueNodes, links, hexColors, fields};
}
