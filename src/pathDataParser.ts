import { calcNodeRadius, calcStrokeWidth, getEvenlySpacedColors } from "utils";

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

  // get the field that's neither used as source or dest
  let additionalField = ""
  if(allData.length > 2) {
    additionalField = allData[1].name
  }

  const delimiter = options.delimiter === "space" ? " " : options.delimiter

  /********************************** Nodes **********************************/

    let uniqueNodes = Array.from([...new Set(allData[0].values.buffer.join(delimiter).split(delimiter))]).map((str, index) => ({
      id: index,
      name: str,
      sum: 1,
      radius: 5
    }));

  /********************************** Links **********************************/

    const pathColors = getEvenlySpacedColors(paths.length, theme.isDark)

    let links: { source: number | undefined; target: number | undefined; path: number; sum: number; strokeWidth: number; field: string; color: string; displayValue: string; isOverlap: boolean; mapRadiusY: number; id: number }[] = [];

    paths.forEach((path: string, pathIndex: number) => {
      const pathNodes = path.split(' ');

      for (let i = 0; i < pathNodes.length - 1; i++) {
        const source = uniqueNodes.find( (node: any) => node.name === pathNodes[i])?.id;
        const target = uniqueNodes.find( (node: any) => node.name === pathNodes[i+1])?.id;
        const isOverlap = links.some((link: any) => link.source === source && link.target === target);
      
        links.push({
          id: 0, 
          source, 
          target, 
          path: pathIndex,
          sum: allData[allData.length -1].values.buffer[pathIndex],
          field: (additionalField === "") ? [additionalField] : allData.find(( obj: any) => obj.name === additionalField).values.buffer[pathIndex],
          strokeWidth: 1,
          color: pathColors[pathIndex],
          displayValue: `${allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).text}${(allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).suffix !== undefined) ? allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).suffix : ""}`,
          isOverlap,
          mapRadiusY: 0
        });

      }
    });

    links.forEach( (link: any, index: number) => {
      link.id = index
    })

    // assign overlap index to render elliptical arc
    let mapRadiusY = options.yRad;
    const overLapLinks = links.filter(link => link.isOverlap)
    
    overLapLinks.forEach(( link, i ) => {
      
      if(i > 0) {
        if(link.source === overLapLinks[i-1].source && link.target === overLapLinks[i-1].target) {
          mapRadiusY+=options.yRad-1
        } else {
          mapRadiusY = options.yRad;
        }
      }
      link.mapRadiusY = mapRadiusY
    });

  /********************************** Stroke width/ node radius **********************************/

    // set range for mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0]
    const linkScaleTo = options.arcRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map(( e: any ) => e.sum)))
    const maxLink = Number(Math.max(...links.map(( e: any ) => e.sum)))

    for (let i = 0; i < links.length; i++) {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, links[i], linkScaleFrom, linkScaleTo, minLink, maxLink)
    }

    calcNodeRadius(uniqueNodes, links, options)


  /**********************************************************************************/
  console.log(links)
  return {uniqueNodes, links, additionalField};
}
