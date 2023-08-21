/*
A collection of utility functions
*/

// find string by id
export function idToName(id: number, dic: any[]): string {
    return dic.find( (obj: any) => obj.id === id).name
}

// get array of targets for node
export function getNodeTargets({ id, links }: { id: number; links: any[]; }): number[] {
    return (
        links
        .filter( (obj: any) => obj.source === id)
        .map( (obj: any ) => obj.target)
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
    return mappedValue;
}

export function mapToLinRange(value: number, rangeMin: number, rangeMax: number,  minLinkSum: number, maxLinkSum: number) {
    const inputRange = maxLinkSum - minLinkSum;
    const outputRange = rangeMax - rangeMin;

    const scaledValue = (value - minLinkSum) / inputRange;
    const mappedValue = scaledValue * outputRange + rangeMin;
    return mappedValue;
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

export function calcStrokeWidth(arcFromSource: boolean, scale: string, arcThickness: number, e: any, linkScaleFrom: number, linkScaleTo: number, minLink: number, maxLink: number) {
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

export function replaceEllipsis(label: Element, isHighlighted: Boolean){

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

export function evaluateQuery(query: string, nodeList: any[], labels: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, links: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, nodes: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, arcOpacity: number) {
    let matches = nodeList.map(({ name, id }) => ({ name, id }));
    matches = matches.filter((e: any) => String(e.name).toLowerCase().includes(query.toLowerCase()))
    const numericalMatches = new Set(matches.map((e: any) => e.id));
    
    if (query) {
        // highlight labels
        labels
            .style("opacity", (label: any) => {
                return numericalMatches.has(label.id) ?  1 : .1
            })
        // highlight links
        links
            .style("opacity", (link: any) => {
                return (numericalMatches.has(link.source) || numericalMatches.has(link.target)) ?  arcOpacity : .1
            })
        // highlight nodes
        nodes
            .style("opacity", (node: any) => {
                return numericalMatches.has(node.id) ?  1 : .1
            })
    } 
}

export function getQueryMatches(query: string, nodeList: any[]) {
    let matches = nodeList.map(({ name, id }) => ({ name, id }));
    matches = matches.filter((e: any) => String(e.name).toLowerCase().includes(query.toLowerCase()))
    const numericalMatches = new Set(matches.map((e: any) => e.id));
    return numericalMatches;
}

export function handleZoom(canvas: HTMLElement, zoomState: number) {
    canvas.style.transform = `scale(${zoomState/10})`
}

export function addNodeSum(links: any[], uniqueNodes: any[]) {
    // Initialize object to store aggregated sums
    const nodeSums: {[key: number]: number} = {};

    // Loop through links array and populate nodeSums object
    links.forEach((link: { source: any; target: any; arcWeightValue: any; }) => {
        const {source, target, arcWeightValue} = link;
        if (nodeSums[source]) {
            nodeSums[source] += arcWeightValue;
        } else {
            nodeSums[source] = arcWeightValue;
        }
        
        if (nodeSums[target]) {
            nodeSums[target] += arcWeightValue;
        } else {
            nodeSums[target] = arcWeightValue;
        }
    });

    uniqueNodes.map(function(element, index) {
        element.sum = nodeSums[index]
    });
}

export function calcNodeRadius(uniqueNodes: any[], links: any[], options: any) {

    const nodeScaleFrom = options.nodeRange?.split(",").map(Number)[0]
    const nodeScaleTo = options.nodeRange?.split(",").map(Number)[1]

    const minNode = Number(Math.min(...uniqueNodes.map(( e: any ) => e.sum)))
    const maxNode = Number(Math.max(...uniqueNodes.map(( e: any ) => e.sum)))

    uniqueNodes.forEach((e: { id: any, radius: any; sum: any; }) => {
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

export function calcDiagramHeight(nodes: any[], links: any[], panelWidth: number, fontSize: number) {
    let maxArcHeight = 0
    if(links.length !== 0) {
        let maxNodesCrossed = 0;
        let maxArc = null;

        for (const link of links) {
            const nodesCrossed = Math.abs(link.target - link.source);
            if (nodesCrossed > maxNodesCrossed) {
                maxNodesCrossed = nodesCrossed;
                maxArc = link;
            }
        }
    
        const maxArcDistance = maxArc.target - maxArc.source
        const step = (panelWidth-50 - 50) / (nodes.length - 1);
        maxArcHeight = (maxArcDistance * step) / 2
    }

    const longestName = nodes.reduce((acc, curr) => {
        if (curr.name.length > acc.name.length) {
            return curr;
        } else {
            return acc;
        }
    }).name;
    
    // * 3.77 maps string to pixels, * 1.6 maps to highlighted tag
    // add mapping to font size configured in the options
    const longestNameSize = longestName.length * 3.77 * 1.6 * (fontSize/10)
    // 31.99px is the height of the panel title
    const graphHeight = maxArcHeight + longestNameSize + 31.99

    return graphHeight
}

export function clusterNodes(uniqueNodes: any[], links: any[], options: any, theme: any, allData: any) {
      
    const srcCluster = allData.find((obj: { name: any; }) => obj.name === options.srcCluster)?.values.buffer
    const dstCluster = allData.find((obj: { name: any; }) => obj.name === options.dstCluster)?.values.buffer

    // add cluster to nodes
    for(let i = 0; i < links.length; i++) {
        Object.assign(links[i], {[options.srcCluster]: []})
        links[i][options.srcCluster].push(srcCluster[i])
        Object.assign(links[i], {[options.dstCluster]: []})
        links[i][options.dstCluster].push(dstCluster[i])

        uniqueNodes[links[i].source].cluster = links[i][options.srcCluster][0]
        uniqueNodes[links[i].target].cluster = links[i][options.dstCluster][0]
    }

    // order 
    uniqueNodes.sort((a, b) => {
        if (a.cluster < b.cluster) {
        return -1; // a should come before b
        }
        if (a.cluster > b.cluster) {
        return 1; // a should come after b
        }
        return 0; // the order of a and b remains unchanged
    });

    for(let i = 0; i < uniqueNodes.length; i++) {
        uniqueNodes[i].id = i; 
    }

    // create groups for clusters
    let clusters: any[] = []
    
    // create unique groups according to the setting specified in options
    clusters = [...new Set(uniqueNodes.map( ( item: any ) => item.cluster))].map( ( cluster: any ) => ({
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

    links.forEach(link => {
      link.source = uniqueNodes.find( node => node.name === link.srcName).id
      
      link.target = uniqueNodes.find(node => node.name === link.dstName).id

    });
}

export function calcBottomOffset(labels: NodeListOf<Element>) {
    // after the labels are rendered, we can find out the amount of margin we need to apply
    // from the bottom and left so that the diagram is readable. The amount is being calculated from
    // the boundingbox of the largest highlighted label
    let labelHeights = Array.from(labels, (label) => label.getBoundingClientRect().height);
    // Map to highlighted labels (size increases by 60%)
    let offsetBottom = Math.max(...labelHeights)
    offsetBottom*=1.6
    return offsetBottom
}

export function getFieldDisplayNames(allData: any[], sourceString?: string, targetString?: string) {
    let displayNames = []
    allData.forEach( field => {
        const displayName = (field.state.displayName !== undefined) ? field.state.displayName : field.name
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