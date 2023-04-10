// find string by id
export function idToName(id: number, dic: any[]): string {
    return dic.find( (obj: any) => obj.id === id).name
}

