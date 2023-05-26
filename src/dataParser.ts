import { calcStrokeWidth, getEvenlySpacedColors, addNodeSum, calcNodeRadius, clusterNodes } from 'utils';

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

export function parseData(data: { series: any[] }, options: any, theme: any) { // <- should that have proper typing?

  const allData = data.series[0].fields;
  
  // if src/dst not defined in options, take first/second group by default
  const sourceString = options.src ? allData.find((obj: { name: any; }) => obj.name === options.src).name : allData[0].name;
  const targetString = options.dest ? allData.find((obj: { name: any; }) => obj.name === options.dest).name : allData[1].name;
  const sourceValues = allData.find((obj: { name: any; }) => obj.name === sourceString)?.values
  const targetValues = allData.find((obj: { name: any; }) => obj.name === targetString)?.values

  // get the field that's neither used as source or dest
  let additionalFields = []
  if(allData.length > 3) {
    const usedFields = [sourceString, targetString, allData[allData.length -1].name]
    const compareArray = allData.map( (obj: any) => obj.name)
    additionalFields = compareArray.filter( (obj: any ) => !usedFields.includes(obj))
  }

  const hexColors = {
    nodeColor: theme.visualization.getColorByName(options.nodeColor),
  }
  
  /********************************** Nodes **********************************/
  
    // get source and target arrays and create array of unique nodes from them
    const uniqueNodes = Array.from([...new Set([...sourceValues, ...targetValues])]).map((str, index) => ({
      id: index,
      name: str,
      sum: 0,
      radius: 0,
      cluster: "",
      color: hexColors.nodeColor
    }));

  /********************************** Links **********************************/

    let srcById = sourceValues.map((name: any) => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    let dstById = targetValues.map((name: any) => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    let links = srcById.map((element: any, index: string | number) => ({
      srcName: sourceValues.buffer[index],
      dstName: targetValues.buffer[index],
      source: element,
      target: dstById[index],
      sum: allData.find((obj: { name: any; }) => obj.name === allData[allData.length -1].name)?.values.buffer[index] as number,
      strokeWidth: 0,
      color: allData[allData.length -1].display(allData[allData.length -1].values.buffer[index]).color,
      // for coloring the links by source, add a field with the name of the selected field
      [options.colorConfigField]: allData.find((obj: { name: any; }) => obj.name === options.colorConfigField)?.values.buffer[index],
      displayValue: `${allData[allData.length -1].display(allData[allData.length -1].values.buffer[index]).text}${(allData[allData.length -1].display(allData[allData.length -1].values.buffer[index]).suffix !== undefined) ? allData[allData.length -1].display(allData[allData.length -1].values.buffer[index]).suffix : ""}`
    }));

    if(!options.isCluster) {
      links.forEach((link: any, index: number) => {
        additionalFields.forEach( field => {
          Object.assign(link, {[field]: []})
          link[field].push(allData.find((obj: { name: any; }) => obj.name === field)?.values.buffer[index])
        })
      });
    }

  /********************************** Colors **********************************/ 

    // create groups for the field specified
    let groups: any[] = []
    if(options.linkColorConfig !== "default" && options.colorConfigField) {
      // create unique groups according to the setting specified in options
      groups = [...new Set(links.map( ( item: any ) => item[options.colorConfigField]))].map( ( group: any ) => ({
        [options.colorConfigField]: group,
        color: ""
      }))

      const spacedColors = getEvenlySpacedColors(groups.length, theme.isDark)

      groups.forEach( (e, i) => {
        e.color = spacedColors[i]
      })
    }

  /********************************** Stroke width/ node radius **********************************/

    // set range for mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0],
    linkScaleTo = options.arcRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map(( e: any ) => e.sum))),
    maxLink = Number(Math.max(...links.map(( e: any ) => e.sum)))
    
    links.forEach((e: {source: number, strokeWidth: number; sum: number; color: string; field: string;}) => {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, e, linkScaleFrom, linkScaleTo, minLink, maxLink)
      // link color by field
      if (options.linkColorConfig === "field" && groups) {
        e.color = groups.find( group => group[options.colorConfigField] === e[options.colorConfigField as keyof typeof e])!.color
      } else {
        e.color = e.color
      }
    });

  /********************************** Node clustering **********************************/

    if(options.isCluster) {
      clusterNodes(uniqueNodes, links, options, theme, allData)
    }

  /********************************** Bundle overlapping links **********************************/ 

    if(allData.length > 3) {

      const uniqueLinks = links.reduce((acc: any, cur: any, index: number) => {
        const existing = acc.find((e: any) => e.source === cur.source && e.target === cur.target);
        if (existing) {
          console.log(existing)
          additionalFields.forEach(field => {
            if (!existing[field].includes(cur[field])) {
              cur[field].forEach(fieldEntry => {
                existing[field].push(fieldEntry);
              });
            }
          })
          
        } else {
          const addLink = {
            srcName: cur.srcName,
            dstName: cur.dstName,
            source: cur.source,
            target: cur.target,
            sum: cur.sum,
            displayValue: cur.displayValue,
            strokeWidth: 0,
            color: cur.color,
            [options.colorConfigField]: cur[options.colorConfigField]
          }
          additionalFields.forEach(field => {
            Object.assign(addLink, {[field]: []})
            addLink[field] = cur[field]
          })
          acc.push(addLink);
        }
        return acc;
      }, []);

      uniqueLinks.forEach((e: {source: number, strokeWidth: number; sum: number; color: string; field: string;}) => {
        calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, e, linkScaleFrom, linkScaleTo, minLink, maxLink)
      })
      links = uniqueLinks;
    }
    // accumulate nodesums after potential bundling
    addNodeSum(links, uniqueNodes)
    calcNodeRadius(uniqueNodes, links, options)

    console.log(links)

  /**********************************************************************************/

  return {uniqueNodes, links, hexColors, additionalFields};
}
