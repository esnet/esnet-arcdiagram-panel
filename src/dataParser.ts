import { calcStrokeWidth, getEvenlySpacedColors, addNodeSum, calcNodeRadius, clusterNodes, getFieldDisplayNames } from 'utils';

/**
 * Takes data from Grafana query and returns it in the format needed for this panel
 *
 * @param data the data returned by the query
 * @param options the field options from the editor panel
 * @param theme needed for utility functions for example to map color strings to hex values
 * @return {uniqueNodes} list of unique nodes to be rendered on the x axis
 * @return {links} array of objects with fields source, target, arcWeightValue, strokewidth where each object represents one link
 * @return {hexColors} colors converted to hex
 */

export function parseData(data: { series: any[] }, options: any, theme: any) { // <- should that have proper typing?

  const allData = data.series[0].fields;

  // if src/dst not defined in options, take first/second group by default
  const sourceString = options.src ? allData.find((obj: { name: any; }) => obj.name === options.src).name : allData[0].name;
  const targetString = options.dest ? allData.find((obj: { name: any; }) => obj.name === options.dest).name : allData[1].name;
  const sourceValues = allData.find((obj: { name: any; }) => obj.name === sourceString)?.values
  const targetValues = allData.find((obj: { name: any; }) => obj.name === targetString)?.values
  const arcWeightString = options.arcWeightSource ? allData.find((obj: { name: any; }) => obj.name === options.arcWeightSource).name : allData[allData.length -1].name
  const arcWeightValues = allData.find((obj: { name: any; }) => obj.name === arcWeightString)?.values

  const fields = getFieldDisplayNames(allData, sourceString, targetString)

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
      arcWeightValue: arcWeightValues.buffer[index],
      strokeWidth: 0,
      color: allData[allData.length -1].display(allData[allData.length -1].values.buffer[index]).color,
      // for coloring the links by source, add a field with the name of the selected field
      [options.colorConfigField]: allData.find((obj: { name: any; }) => obj.name === options.colorConfigField)?.values.buffer[index],
    }));

    //if(!options.isCluster) {
      links.forEach((link: any, index: number) => {
        fields.forEach( field => {
          Object.assign(link, {[field.field]: []})
          link[field.field].push(allData.find((obj: { name: any; }) => obj.name === field.field)?.values.buffer[index])
          const display = allData.find((obj: { name: any; }) => obj.name === field.field).display(allData.find((obj: { name: any; }) => obj.name === field.field)?.values.buffer[index])
          const suffix = display.suffix === undefined ? "" : display.suffix
          Object.assign(link, {[`${field.field}Display`]: [`${display.text} ${suffix}`]})
        })
      });
      
    //}

  

  

  /********************************** Node clustering **********************************/

    if(options.isCluster) {
      clusterNodes(uniqueNodes, links, options, theme, allData)
    }

  /********************************** Bundle overlapping links **********************************/ 



    if(allData.length > 3) {
      const uniqueLinks = links.reduce((acc: any, cur: any, index: number) => {
        const existing = acc.find((e: any) => e.source === cur.source && e.target === cur.target);
        if (existing) {
          fields.forEach(field => {
            if(allData.find( (obj: any) => obj.name === field.field).state.range !== undefined) {
              let newValue = (existing[field.field][0]) + (cur[field.field][0])
              existing[field.field] = [newValue]
              const display = allData.find((obj: { name: any; }) => obj.name === field.field).display(newValue)
              existing[`${field.field}Display`] = [`${display.text} ${display.suffix}`]
            } else {
              if (!existing[field.field].includes(cur[field.field])) {
                cur[field.field].forEach((fieldEntry: any) => {
                  existing[field.field].push(fieldEntry);
                });
              }
              existing[`${field.field}Display`] = existing[field.field]
            }
          }) 
        } else {
          const addLink = {
            srcName: cur.srcName,
            dstName: cur.dstName,
            source: cur.source,
            target: cur.target,
            arcWeightValue: cur.arcWeightValue,
            displayValue: cur.displayValue,
            strokeWidth: 0,
            color: cur.color,
            [options.colorConfigField]: cur[options.colorConfigField]
          }
          fields.forEach(field => {
            Object.assign(addLink, {[field.field]: []})
            addLink[field.field] = cur[field.field]
            const display = allData.find((obj: { name: any; }) => obj.name === field.field).display(cur[field.field][0])
            const suffix = display.suffix === undefined ? "" : display.suffix
            if(allData.find( (obj: any) => obj.name === field.field).state.range !== undefined) {
              Object.assign(addLink, {[`${field.field}Display`]: [`${display.text} ${suffix}`]})
            } else {
              Object.assign(addLink, {[`${field.field}Display`]: cur[field.field]})
            }
          })
          acc.push(addLink);
        }
        return acc;
      }, []);
      links = uniqueLinks;
    }
    // accumulate nodesums after potential bundling
    addNodeSum(links, uniqueNodes)
    calcNodeRadius(uniqueNodes, links, options)

  /********************************** Colors **********************************/ 

    // create groups for the field specified
    let groups: any[] = []
    if(options.linkColorConfig !== "default" && options.colorConfigField) {
      // create unique groups according to the setting specified in options
      groups = [...new Set(links.map(item => {
        if (Array.isArray(item[options.colorConfigField])) {
          return item[options.colorConfigField][item[options.colorConfigField].length - 1];
        }
        return item[options.colorConfigField];
      }))].map(group => ({
        [options.colorConfigField]: group,
        color: ""
      }));

      console.log(groups)

      const spacedColors = getEvenlySpacedColors(groups.length, theme.isDark)

      groups.forEach( (e, i) => {
        e.color = spacedColors[i]
      })
    }

  /********************************** Stroke width/ node radius **********************************/

    // set range for mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0],
    linkScaleTo = options.arcRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map(( e: any ) => e.arcWeightValue))),
    maxLink = Number(Math.max(...links.map(( e: any ) => e.arcWeightValue)))
      
    console.log(links)
    links.forEach((e: {source: number, strokeWidth: number; arcWeightValue: number; color: string; field: string; srcName: string}) => {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, e, linkScaleFrom, linkScaleTo, minLink, maxLink)
      // link color by field
      if (options.linkColorConfig === "field" && groups) {
        const linkGroup = (!Array.isArray(e[options.colorConfigField])) ? e[options.colorConfigField] : e[options.colorConfigField][e[options.colorConfigField].length - 1]
        console.log(linkGroup)
        e.color = groups.find( group => group[options.colorConfigField] === linkGroup)!.color
      }
    });
    
  /**********************************************************************************/
  return {uniqueNodes, links, hexColors, fields};
}
