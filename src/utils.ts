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
            e.strokeWidth = mapToLogRange(e.sum, linkScaleFrom, linkScaleTo, minLink, maxLink)          
        } else {
            // call function to map to lin range instead
            e.strokeWidth = mapToLinRange(e.sum, linkScaleFrom, linkScaleTo, minLink, maxLink)
        }
    } else {
        e.strokeWidth = arcThickness
    }
}

export function replaceEllipsis(label: SVGTextElement, isHighlighted: Boolean){

    const labelBoundingBox = label.getBoundingClientRect().width * (isHighlighted ? 1.6 : 1);
    const mapRatio = (isHighlighted ? 0.2 : 0.3);
    
    const labelOffsetX = Number(label.getAttribute("transform")?.split(",")[0].substring(10))

    // check if label is out of bounds
    if(labelBoundingBox > labelOffsetX) {

        const overlap = labelBoundingBox - labelOffsetX

        label.innerHTML = "..." + label.innerHTML.substring(overlap*mapRatio, label.innerHTML.length)
    }
}

export function resetLabel(label: SVGTextElement) {
    label.innerHTML = label.getAttribute("name")!;
}

export function evaluateQuery(query: string, nodeList: any[], labels: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, links: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, nodes: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, arcOpacity: number) {
    let matches = nodeList.map(({ name, id }) => ({ name, id }));
    matches = matches.filter((e: any) => e.name.toLowerCase().includes(query.toLowerCase()))
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
    matches = matches.filter((e: any) => e.name.toLowerCase().includes(query.toLowerCase()))
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
    links.forEach((link: { source: any; target: any; sum: any; }) => {
        const {source, target, sum} = link;
        if (nodeSums[source]) {
            nodeSums[source] += sum;
        } else {
            nodeSums[source] = sum;
        }
        
        if (nodeSums[target]) {
            nodeSums[target] += sum;
        } else {
            nodeSums[target] = sum;
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

export function calcDiagramHeight(nodes: any[], links: any[], panelWidth: number) {
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
    const maxArcHeight = (maxArcDistance * step) / 2

    const longestName = nodes.reduce((acc, curr) => {
        if (curr.name.length > acc.name.length) {
          return curr;
        } else {
          return acc;
        }
      }).name;
    
    // * 3.77 maps string to pixels, * 1.6 maps to highlighted tag
    const longestNameSize = longestName.length * 3.77 * 1.6
    // 31.99px is the height of the panel title
    const graphHeight =  maxArcHeight + longestNameSize + 31.99

    return graphHeight
}

