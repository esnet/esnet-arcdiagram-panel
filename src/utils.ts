/*
A collection of utility functions
*/

import { lab } from "d3";

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

// get an array of evenly spaced colors
export function getEvenlySpacedColors(amount: number): string[] {

    const colors = [];
    const LightColorPallet = [
        "#FF4136",
        "#FF851B",
        "#FFDC00",
        "#2ECC40",
        "#0074D9",
        "#01FF70",
        "#FF4136",
        "#7FDBFF",
        "#FF4136",
        "#F012BE",
        "#FF851B",
        "#3D9970",
        "#B10DC9",
        "#01FF70",
        "#001f3f",
        "#FF851B",
        "#7FDBFF",
        "#3D9970",
        "#FF4136",
        "#111111"
      ];

    for (let i = 0; i < amount; i++) {
        colors.push(LightColorPallet[i]);
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
        if(scale == "log") {
          e.strokeWidth = mapToLogRange(e.sum, linkScaleFrom, linkScaleTo, minLink, maxLink)          
        } else {
          e.strokeWidth = e.sum/10000000000000
        }
    } else {
        e.strokeWidth = arcThickness
    }
}

export function replaceEllipsis(label: SVGTextElement, isHighlighted: Boolean){

    const labelBoundingBox = label.getBoundingClientRect().width * (isHighlighted ? 1.6 : 1);

    const labelOffsetX = Number(label.getAttribute("transform")?.split(",")[0].substring(10))

    // check if label is out of bounds
    if(labelBoundingBox > labelOffsetX) {

        const overlap = labelBoundingBox - labelOffsetX

        label.innerHTML = "..." + label.innerHTML.substring(overlap*0.3, label.innerHTML.length)
    }

}

export function resetLabel(label: SVGTextElement) {
    label.innerHTML = label.getAttribute("name")!;    
}