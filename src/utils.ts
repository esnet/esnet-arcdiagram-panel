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

export function evaluateQuery(query: string, nodeList: any[], labels: HTMLCollectionOf<SVGTextElement>) {
    for(let i = 0; i < labels.length; i++) {
        if(query) {
            let matches = nodeList.map( ({ name, id }) => ({ name, id }));
            matches = matches.filter((e: any) => e.name.toLowerCase().includes(query.toLowerCase()))
            let numericalMatches = matches.map( (e: any) => e.id)
            
            if(numericalMatches.includes(Number(labels[i].id))) {
                labels[i].style.opacity = "1"
            } else {
                labels[i].style.opacity = "0.2"
            }
            
        } else {
            labels[i].style.opacity = "1"
        }
    }
}

export function handleZoom(isActive: boolean, canvas: HTMLElement, zoomFactor: number) {
    if(isActive) {
        canvas.style.transformOrigin = "left"
        console.log(zoomFactor)
        canvas.style.transform = `scale(${zoomFactor})`
    } else {
        canvas.style.transformOrigin = "unset"
        canvas.style.transform = "unset"
    }
}
