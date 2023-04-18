
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
export function mapToLogRange({ number, min, max, scaleFrom, scaleTo }: { number: number; min: number; max: number; scaleFrom: number; scaleTo: number; }): number {
    // Define the minimum and maximum values of the input range
  
    // Calculate the logarithmic scale factor
    const logScaleFactor = Math.log(max) - Math.log(min);
  
    // Map the input number to the range given by parameters using logarithmic scaling
    const scaledValue = (Math.log(number) - Math.log(min)) / logScaleFactor * (scaleTo-scaleFrom) + 1
    // Round the result to two decimal places
    return Math.round(scaledValue * 100) / 100;
}

// get an array of evenly spaced colors
export function getEvenlySpacedColors(amount: number, saturation: number, lightness: number): string[] {

    const colors = [];

    for (let i = 0; i < amount; i++) {
        const hue = (i * 36) % 360;
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        colors.push(color);
    }

    return colors;

}

// get array of n equally spaced values in specific range
export function linSpace(start: number, stop: number, n: number): number[] {
    const step = (stop - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
  }
