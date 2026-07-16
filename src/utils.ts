/*
A collection of utility functions
*/

import { Field, FieldType, GrafanaTheme2, PanelData } from '@grafana/data';
import { FieldDisplayName, Link, Node, SimpleOptions } from 'types';

// find string by id
export function idToName(id: number, dic: Node[]): string {
    // [refactor] Bug fix: guard the lookup so an unmatched id returns "" instead of throwing.
    // [refactor] Typing: `Node.name` is `string | number`; the cast keeps the historical
    // `string` contract without a runtime change (callers only render the value).
    return (dic.find((obj) => obj.id === id)?.name ?? "") as string
}

// get array of targets for node
export function getNodeTargets({ id, links }: { id: number; links: Link[]; }): number[] {
    return (
        links
        .filter((obj) => obj.source === id)
        // [refactor] Typing: a real link always has a numeric target here.
        .map((obj) => obj.target!)
    )
}

// map number to log
export function mapToLogRange(value: number, rangeMin: number, rangeMax: number,  minLinkSum: number, maxLinkSum: number) {
    const logMinValue = Math.log10(minLinkSum);
    const logMaxValue = Math.log10(maxLinkSum);
    const logRange = logMaxValue - logMinValue;
    const factor = (rangeMax-1) / logRange;

    const logValue = Math.log10(value);
    const mappedValue = ((logValue - logMinValue) * factor) + rangeMin;
    // [refactor] Bug fix: when all sums are equal (logRange === 0) or a sum is <= 0
    // (log10 -> -Infinity/NaN), the result is non-finite; fall back to the range minimum so the
    // element still renders instead of disappearing.
    return Number.isFinite(mappedValue) ? mappedValue : rangeMin;
}

export function mapToLinRange(value: number, rangeMin: number, rangeMax: number,  minLinkSum: number, maxLinkSum: number) {
    const inputRange = maxLinkSum - minLinkSum;
    const outputRange = rangeMax - rangeMin;

    const scaledValue = (value - minLinkSum) / inputRange;
    const mappedValue = scaledValue * outputRange + rangeMin;
    // [refactor] Bug fix: when all values are equal (inputRange === 0) the division yields
    // NaN/Infinity; fall back to the range minimum so elements still render.
    return Number.isFinite(mappedValue) ? mappedValue : rangeMin;
}

// get an array of evenly spaced colors
export function getEvenlySpacedColors(amount: number, darkMode: boolean): string[] {

    // add darkmode colors

    const colors = [];
    const lightColors = ['#FFD700', '#00BFFF', '#FF8C00', '#FF1493', '#7FFF00', '#9400D3', '#00FFFF', '#FF69B4', '#32CD32', '#FFDAB9']
    const darkColors =  ['#7CFC00', '#1E90FF', '#FFA500', '#FFC0CB', '#8B008B', '#32CD32', '#FF00FF', '#FF6347', '#FFFF00', '#FF1493']

      for (let i = 0; i < amount; i++) {
        const colorIndex = i % darkColors.length;
        colors.push(darkMode ? darkColors[colorIndex] : lightColors[colorIndex]);
      }

    return colors;

}

// get array of n equally spaced values in specific range
export function linSpace(start: number, stop: number, n: number): number[] {
    const step = (stop - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
}

export function calcStrokeWidth(arcFromSource: boolean, scale: string, arcThickness: number, e: Link, linkScaleFrom: number, linkScaleTo: number, minLink: number, maxLink: number) {
    if(arcFromSource) {
        // check if we apply logarithmic or linear scaling
        if(scale === "log") {
            e.strokeWidth = mapToLogRange(e.arcWeightValue, linkScaleFrom, linkScaleTo, minLink, maxLink)
        } else {
            // call function to map to lin range instead
            e.strokeWidth = mapToLinRange(e.arcWeightValue, linkScaleFrom, linkScaleTo, minLink, maxLink)
        }
    } else {
        e.strokeWidth = arcThickness
    }
}

// [refactor] Stylistic: param type `Boolean` (object wrapper) -> `boolean` (primitive).
export function replaceEllipsis(label: Element, isHighlighted: boolean){

    const labelBoundingBox = label.getBoundingClientRect().width * (isHighlighted ? 1.6 : 1);
    const mapRatio = (isHighlighted ? 0.2 : 0.3);

    const labelOffsetX = Number(label.getAttribute("transform")?.split(",")[0].substring(10))

    // check if label is out of bounds
    if(labelBoundingBox > labelOffsetX) {

        const overlap = labelBoundingBox - labelOffsetX

        label.innerHTML = "..." + label.innerHTML.substring(overlap*mapRatio, label.innerHTML.length)
    }
}

export function resetLabel(label: Element) {
    label.innerHTML = label.getAttribute("name")!;
}

// [refactor] Typing: the D3 selections carry their bound `Node`/`Link` datum (declared with
// explicit generics in Arc.tsx), so the callback params below are typed without casts.
export function evaluateQuery(query: string, nodeList: Node[], labels: d3.Selection<d3.BaseType, Node, HTMLElement, unknown>, links: d3.Selection<d3.BaseType, Link, HTMLElement, unknown>, nodes: d3.Selection<d3.BaseType, Node, HTMLElement, unknown>, arcOpacity: number) {
    let matches = nodeList.map(({ name, id }) => ({ name, id }));
    matches = matches.filter((e) => String(e.name).toLowerCase().includes(query.toLowerCase()))
    const numericalMatches = new Set(matches.map((e) => e.id));

    if (query) {
        // highlight labels
        labels
            .style("opacity", (label) => {
                return numericalMatches.has(label.id) ?  1 : .1
            })
        // highlight links
        links
            .style("opacity", (link) => {
                return (numericalMatches.has(link.source!) || numericalMatches.has(link.target!)) ?  arcOpacity : .1
            })
        // highlight nodes
        nodes
            .style("opacity", (node) => {
                return numericalMatches.has(node.id) ?  1 : .1
            })
    }
}

export function getQueryMatches(query: string, nodeList: Node[]) {
    let matches = nodeList.map(({ name, id }) => ({ name, id }));
    matches = matches.filter((e) => String(e.name).toLowerCase().includes(query.toLowerCase()))
    const numericalMatches = new Set(matches.map((e) => e.id));
    return numericalMatches;
}

export function handleZoom(canvas: HTMLElement, zoomState: number) {
    canvas.style.transform = `scale(${zoomState/10})`
}

export function addNodeSum(links: Link[], uniqueNodes: Node[]) {
    // Initialize object to store aggregated sums
    const nodeSums: {[key: number]: number} = {};

    // Loop through links array and populate nodeSums object
    // [refactor] Cleanup: accumulate with `?? 0` instead of the `if (nodeSums[x])` truthiness
    // check. (The old check overwrote when the running sum was exactly 0, but `0 + x === x`, so
    // the result was the same — this is just clearer and avoids surprises with NaN.)
    links.forEach((link) => {
        const {source, target, arcWeightValue} = link;
        nodeSums[source!] = (nodeSums[source!] ?? 0) + arcWeightValue;
        nodeSums[target!] = (nodeSums[target!] ?? 0) + arcWeightValue;
    });

    uniqueNodes.map(function(element, index) {
        element.sum = nodeSums[index]
    });
}

export function calcNodeRadius(uniqueNodes: Node[], links: Link[], options: SimpleOptions) {

    const nodeScaleFrom = options.nodeRange?.split(",").map(Number)[0]
    const nodeScaleTo = options.nodeRange?.split(",").map(Number)[1]

    const minNode = Number(Math.min(...uniqueNodes.map((e) => e.sum)))
    const maxNode = Number(Math.max(...uniqueNodes.map((e) => e.sum)))

    uniqueNodes.forEach((e) => {
        // check if arc thickness is set to source
        if(options.radiusFromSource) {
            // check if we apply logarithmic or linear scaling
            if(options.scale === "log") {
                e.radius = mapToLogRange(e.sum, nodeScaleFrom, nodeScaleTo, minNode, maxNode)
            } else {
                e.radius = mapToLinRange(e.sum, nodeScaleFrom, nodeScaleTo, minNode, maxNode)
            }
        } else {
          e.radius = options.nodeRadius
        }
    })
}

export function clusterNodes(uniqueNodes: Node[], links: Link[], options: SimpleOptions, theme: GrafanaTheme2, allData: Field[]) {

    // [refactor] Grafana 10+ : Field.values is a plain array (the old ArrayVector `.buffer`
    // was removed). This `.values.buffer` -> `.values` change is the fix that unbroke node
    // clustering on current Grafana.
    const srcCluster = allData.find((obj) => obj.name === options.srcCluster)?.values
    const dstCluster = allData.find((obj) => obj.name === options.dstCluster)?.values

    // add cluster to nodes
    for(let i = 0; i < links.length; i++) {
        Object.assign(links[i], {[options.srcCluster]: []})
        links[i][options.srcCluster].push(srcCluster![i])
        Object.assign(links[i], {[options.dstCluster]: []})
        links[i][options.dstCluster].push(dstCluster![i])

        uniqueNodes[links[i].source!].cluster = links[i][options.srcCluster][0]
        uniqueNodes[links[i].target!].cluster = links[i][options.dstCluster][0]
    }

    // order
    uniqueNodes.sort((a, b) => {
        if (a.cluster! < b.cluster!) {
        return -1; // a should come before b
        }
        if (a.cluster! > b.cluster!) {
        return 1; // a should come after b
        }
        return 0; // the order of a and b remains unchanged
    });

    for(let i = 0; i < uniqueNodes.length; i++) {
        uniqueNodes[i].id = i;
    }

    // create groups for clusters
    let clusters: Array<{ name: string | undefined; color: string }> = []

    // create unique groups according to the setting specified in options
    clusters = [...new Set(uniqueNodes.map((item) => item.cluster))].map((cluster) => ({
      name: cluster,
      color: ""
    }))

    const spacedColors = getEvenlySpacedColors(clusters.length, theme.isDark)

    clusters.forEach( (e, i) => {
      e.color = spacedColors[i]
    })

    uniqueNodes.forEach((e) => {
      e.color = clusters.find( cluster => cluster.name === e.cluster as keyof typeof e)!.color
    })

    // reassign links source and target values because node order was changed
    // [refactor] Bug fix: guard the lookups so an unmatched srcName/dstName keeps the existing
    // source/target instead of throwing on `undefined.id`.
    links.forEach(link => {
      link.source = uniqueNodes.find( node => node.name === link.srcName)?.id ?? link.source

      link.target = uniqueNodes.find(node => node.name === link.dstName)?.id ?? link.target

    });
}

export function calcBottomOffset(labels: NodeListOf<Element>, minOffset = 0) {
    // after the labels are rendered, we can find out the amount of margin we need to apply
    // from the bottom and left so that the diagram is readable. The amount is being calculated from
    // the boundingbox of the largest highlighted label
    let labelHeights = Array.from(labels, (label) => label.getBoundingClientRect().height);
    // [refactor] Guard against an empty label set: `Math.max()` of [] is -Infinity, which
    // propagated through `height - offsetBottom` to cy/d = Infinity and pushed the whole diagram
    // off-screen (the symptom of the Grafana-13 selector break). Fall back to `minOffset`.
    if (labelHeights.length === 0) {
        return minOffset;
    }
    // Map to highlighted labels (size increases by 60%)
    let offsetBottom = Math.max(...labelHeights)
    offsetBottom*=1.6
    // [refactor] Floor the offset at `minOffset` (passed as a multiple of the font size). The
    // node labels are rotated -45°, and getBoundingClientRect under-reports their extent right
    // after append, so the measured offset alone left small font sizes clipped at the panel's
    // bottom edge. The font-proportional floor guarantees enough room while the measurement
    // still wins for long labels that need more.
    return Math.max(offsetBottom, minOffset)
}

// [refactor] Typed the return as FieldDisplayName[] (was implicit any[]). Note: the now-unused
// `calcDiagramHeight` helper that previously lived in this file was removed during the refactor.
export function getFieldDisplayNames(allData: Field[], sourceString?: string, targetString?: string): FieldDisplayName[] {
    const displayNames: FieldDisplayName[] = []
    allData.forEach( field => {
        // [refactor] Bug fix: optional-chain `field.state` (a field may not have a populated
        // state) and fall back to the field name. Use `??` so a nullish displayName falls back:
        // Grafana's applyFieldOverrides sets `state.displayName` to `null` (not `undefined`) when
        // there is no display-name override, which previously slipped through and rendered the
        // tooltip label as an empty `null` (e.g. the "weight" label went missing on link hover).
        const displayName = (field.state?.displayName ?? field.name) as string
        // check if the displayname is defined
        if(field.name !== sourceString && field.name !== targetString) {
            displayNames.push({
                field: field.name,
                displayName: displayName
            })
        }
    })
    return displayNames
}

export function isTimeSeries(data: PanelData): boolean {
    // check if datasource is timeseries
    const dataSources = data.request?.targets
    if(dataSources !== undefined) {
        for(let i = 0; i < dataSources.length; i++) {
            // [refactor] Typing: `type` is a datasource-specific query field not on the base
            // `DataQuery`, so read it through a narrow cast.
            if ((dataSources[i] as { type?: string }).type === "date_histogram") {
                return true;
            }
        }
    }
    // [refactor] Bug fix: a query is a time series if *any* field is of type "time". The old
    // loop had an `else { return false }` that returned on the first field, missing time fields
    // in later positions. Also hardened `data.request.targets` -> `data.request?.targets` above.
    const fields = data.series[0].fields
    for(let i = 0; i < fields.length; i++) {
        if (fields[i].type === FieldType.time) {
            return true;
        }
    }
    return false;
}
