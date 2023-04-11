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