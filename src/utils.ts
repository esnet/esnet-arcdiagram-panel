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

export function mapToLinRange(value: number) {console.log(value)}

// get an array of evenly spaced colors
export function getEvenlySpacedColors(amount: number, darkMode: boolean): string[] {

    // add darkmode colors

    const colors = [];
    const lightColors = [
        "#FFCDD2",
        "#F8BBD0",
        "#E1BEE7",
        "#D1C4E9",
        "#C5CAE9",
        "#BBDEFB",
        "#B3E5FC",
        "#B2EBF2",
        "#B2DFDB",
        "#C8E6C9",
        "#DCEDC8",
        "#F0F4C3",
        "#FFF9C4",
        "#FFE0B2",
        "#FFCCBC"
      ];

      const darkColors = [
        "#EF9A9A",
        "#F48FB1",
        "#CE93D8",
        "#B39DDB",
        "#9FA8DA",
        "#90CAF9",
        "#81D4FA",
        "#80DEEA",
        "#80CBC4",
        "#A5D6A7",
        "#C5E1A5",
        "#E6EE9C",
        "#FFF59D",
        "#FFCC80",
        "#FFAB91"
      ];      
      
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
          e.strokeWidth = e.sum/10000000000000
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
                labels[i].style["font-size"] = 16
                labels[i].style.opacity = "1"
            } else {
                labels[i].style["font-size"] = 10
                labels[i].style.opacity = "0.2"
            }
            
        } else {
            labels[i].style.opacity = "1"
        }
    }
}
