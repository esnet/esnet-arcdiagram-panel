import { calcNodeRadius, calcStrokeWidth, getEvenlySpacedColors, getFieldDisplayNames } from "utils";

/**
 * Takes data from Grafana query and returns it in the format needed for this panel
 *
 * @param data the data returned by the query
 * @param options the field options from the editor panel
 * @param theme needed for utility functions for example to map color strings to hex values
 * @return {uniqueNodes} list of unique nodes to be rendered on the x axis
 * @return {links} array of objects with fields source, target, sum, strokewidth where each object represents one link
 * @return {hexColors} colors converted to hex
 */

export function parsePathData(data: { series: any[] }, options: any, theme: any) { // <- should that have proper typing?

  const allData = data.series[0].fields;
  const paths = allData[0].values.buffer;

  const arcWeightString = options.arcWeightSource ? allData.find((obj: { name: any; }) => obj.name === options.arcWeightSource).name : allData[allData.length -1].name
  const arcWeightValues = allData.find((obj: { name: any; }) => obj.name === arcWeightString)?.values
  
  const fields = getFieldDisplayNames(allData)

  const delimiter = options.delimiter === "space" ? " " : options.delimiter

  /********************************** Nodes **********************************/

    let uniqueNodes = Array.from([...new Set(allData[0].values.buffer.join(delimiter).split(delimiter))]).map((str, index) => ({
      id: index,
      name: str,
      sum: 1,
      radius: 5,
      color: options.nodeColor
    }));

  /********************************** Links **********************************/

    const pathColors = getEvenlySpacedColors(paths.length, theme.isDark)

    let links: Array<{ source: number | undefined; target: number | undefined; path: number; arcWeightValue: number; strokeWidth: number; color: string; displayValue: string; isOverlap: boolean; mapRadiusY: number; id: number }> = [];

    paths.forEach((path: string, pathIndex: number) => {
      const pathNodes = String(path).split(' ');

      for (let i = 0; i < pathNodes.length; i++) {
        const source = uniqueNodes.find( (node: any) => node.name === pathNodes[i])?.id;

        const target = uniqueNodes.find( (node: any) => node.name === pathNodes[i+1])?.id;
        const isOverlap = links.some((link: any) => link.source === source && link.target === target);
      
        if(target !== undefined) {
          const link = {
            id: 0, 
            source, 
            target, 
            path: pathIndex,
            arcWeightValue: arcWeightValues.buffer[pathIndex],
            strokeWidth: 1,
            color: pathColors[pathIndex],
            displayValue: `${allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).text}${(allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).suffix !== undefined) ? allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).suffix : ""}`,
            isOverlap,
            mapRadiusY: 0
          }
          fields.forEach( field => {
            Object.assign(link, {[field.field]: []})
            link[field.field].push(allData.find((obj: { name: any; }) => obj.name === field.field)?.values.buffer[pathIndex])
            const display = allData.find((obj: { name: any; }) => obj.name === field.field).display(allData.find((obj: { name: any; }) => obj.name === field.field)?.values.buffer[pathIndex])
            Object.assign(link, {[`${field.field}Display`]: [`${display.text} ${display.suffix}`]})
          })
          links.push(link);
        }
      }
    });
 
    links.forEach( (link: any, index: number) => {
      link.id = index
    })

    // assign overlap index to render elliptical arc
    const overlapLinks = links.filter(link => link.isOverlap)

    const overlapGroups = [];
    const visited = [];

    for (let i = 0; i < overlapLinks.length; i++) {
      const currentLink = overlapLinks[i];
      const overlapGroup = [currentLink];
      // keep track of visited links, go to next iteration if link already part of group
      if(visited.includes(currentLink)) {
        continue
      }
      for (let j = i + 1; j < overlapLinks.length; j++) {
        const compareLink = overlapLinks[j]
        if(currentLink.source === compareLink.source && currentLink.target === compareLink.target) {
          overlapGroup.push(compareLink);
          visited.push(compareLink)
        }
      }
      overlapGroups.push(overlapGroup)
    }
      
    // iterate over overlapGroups and assign radiusY
    for (let i = 0; i < overlapGroups.length; i++) {
      const currentGroup = overlapGroups[i]
      let mapRadiusY = options.yRad
      for (let j = 0; j < currentGroup.length; j++) {
        const currentLink = currentGroup[j]
        currentLink.mapRadiusY = mapRadiusY
        mapRadiusY += options.yRad-1
      }
    }

    

  /********************************** Stroke width/ node radius **********************************/

    // set range for mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0]
    const linkScaleTo = options.arcRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map(( e: any ) => e.arcWeightValue)))
    const maxLink = Number(Math.max(...links.map(( e: any ) => e.arcWeightValue)))

    for (let i = 0; i < links.length; i++) {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, links[i], linkScaleFrom, linkScaleTo, minLink, maxLink)
    }

    calcNodeRadius(uniqueNodes, links, options)
  /**********************************************************************************/
  return {uniqueNodes, links, fields};
}
