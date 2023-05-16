//import { calcStrokeWidth, mapToLogRange, getEvenlySpacedColors } from 'utils';

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

  const pathString = options.pathString ? allData.find((obj: { name: any; }) => obj.name === options.pathString).name : allData[0].name;
  // get the field that's neither used as source or dest
  let additionalField = ""
  if(allData.length > 2) {
    //const usedFields = [sourceString, targetString, allData[allData.length -1].name]
    //const compareArray = allData.map( (obj: any) => obj.name)
    //additionalField = compareArray.filter( (obj: any ) => !usedFields.includes(obj))[0]
    console.log(pathString)
  }

  /********************************** Nodes **********************************/

    let uniqueNodes = Array.from([...new Set(allData[0].values.buffer.join(" ").split(" "))]).map((str, index) => ({
      id: index,
      name: str,
      sum: 1,
      radius: 5
    }));

  /********************************** Links **********************************/

    const pathColors = getEvenlySpacedColors(paths.length, theme.isDark)

    let links: { source: number | undefined; target: number | undefined; path: number; sum: number; strokeWidth: number; field: string; color: string; displayValue: string; }[] = [];

    paths.forEach((path: string, pathIndex: number) => {
      const pathNodes = path.split(' ');

      for (let i = 0; i < pathNodes.length - 1; i++) {
        const source = uniqueNodes.find( (node: any) => node.name === pathNodes[i])?.id;
        const target = uniqueNodes.find( (node: any) => node.name === pathNodes[i+1])?.id;
        links.push({ 
          source, 
          target, 
          path: pathIndex,
          sum: allData[allData.length -1].values.buffer[pathIndex],
          field: "",
          strokeWidth: 1,
          color: pathColors[pathIndex],
          displayValue: `${allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).text}${(allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).suffix !== undefined) ? allData[allData.length -1].display(allData[allData.length -1].values.buffer[pathIndex]).suffix : ""}`
        });
      }
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

  return {uniqueNodes, links};
}
