// find string by id
export function idToName(id: number, dic: any[]): string {
    return dic.find( (obj: any) => obj.id === id).name
}

// get array of targets for node
export function getNodeTargets(id: number, links: any[]): number[] {
    return (
        links
        .filter( (obj: any) => obj.source === id)
        .map( (obj: any ) => obj.target)
    )
}

// map number to log
export function mapToLogRange(number: number, min: number, max: number, scaleFrom: number, scaleTo: number): number {
    // Define the minimum and maximum values of the input range
  
    // Calculate the logarithmic scale factor
    const logScaleFactor = Math.log(max) - Math.log(min);
  
    // Map the input number to the range 1 to 10 using logarithmic scaling
    const scaledValue = (Math.log(number) - Math.log(min)) / logScaleFactor * (scaleTo-scaleFrom) + 1
    // Round the result to two decimal places
    return Math.round(scaledValue * 100) / 100;
  }