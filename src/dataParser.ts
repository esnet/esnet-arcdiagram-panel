import { calcStrokeWidth, mapToLogRange } from 'utils';
import { getEvenlySpacedColors } from 'utils';

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

  var allData = data.series[0].fields;

  /********************************** Nodes/links **********************************/ 

  // if src/dst not defined in options, take first/second group by default
  var sourceString = options.src ? allData.find((obj: { name: any; }) => obj.name === options.src).name : allData[0].name;
  var targetString = options.dest ? allData.find((obj: { name: any; }) => obj.name === options.dest).name : allData[1].name;
  var sourceValues = allData.find((obj: { name: any; }) => obj.name === sourceString)?.values
  var targetValues = allData.find((obj: { name: any; }) => obj.name === targetString)?.values

  // get the field that's neither used as source or dest
  var additionalField = ""
  if(allData.length > 3) {
    const usedFields = [sourceString, targetString, allData[allData.length -1].name]
    const compareArray = allData.map( (obj: any) => obj.name)
    // this should be an array "additionalFields" to account for more than one additional field 
    var additionalFields = compareArray.filter( (obj: any ) => !usedFields.includes(obj))
    //console.log(additionalFields)
    additionalField = compareArray.filter( (obj: any ) => !usedFields.includes(obj))[0]
  }
  
  // get source and target arrays and create array of unique nodes from them
  const uniqueNodes = Array.from([...new Set([...sourceValues, ...targetValues])]).map((str, index) => ({
    id: index,
    name: str,
    sum: 0,
    radius: 0
  }));

  let srcById = sourceValues.map((name: any) => {
    const dictionaryItem = uniqueNodes.find(item => item.name === name);
    return dictionaryItem ? dictionaryItem.id : null;
  });

  let dstById = targetValues.map((name: any) => {
    const dictionaryItem = uniqueNodes.find(item => item.name === name);
    return dictionaryItem ? dictionaryItem.id : null;
  });

  let links = srcById.map((element: any, index: string | number) => ({
    source: element,
    target: dstById[index],
    sum: <number>allData.find((obj: { name: any; }) => obj.name === allData[allData.length -1].name)?.values.buffer[index],
    strokeWidth: 0,
    color: "",
    field: (additionalField === "") ? additionalField : allData.find(( obj: any) => obj.name === additionalField).values.buffer[index],
    // for coloring the links by source, add a field with the name of the selected field
    [options.colorConfigField]: allData.find((obj: { name: any; }) => obj.name === options.colorConfigField)?.values.buffer[index]
  }));
  // Initialize object to store aggregated sums
  const nodeSums: {[key: number]: number} = {};

  // Loop through links array and populate nodeSums object
  links.forEach((link: { source: any; sum: any; }) => {
    const {source, sum} = link;
    if (nodeSums[source]) {
      nodeSums[source] += sum;
    } else {
      nodeSums[source] = sum;
    }
  });

  // Create array of unique nodes with aggregated sums
  const nodes  = Object.keys(nodeSums).map(nodeId => ({
    id: parseInt(nodeId),
    sum: nodeSums[parseInt(nodeId)],
  }));

  links.forEach(function(link: { target: any; }) {
    const target = link.target;
    if (!nodeSums[target]) {
      nodes.push({id: target, sum: 1});
      nodeSums[target] = 1;
    }
  });

  uniqueNodes.map(function(element, index) {
    element.sum = nodes[index].sum
  });

  /********************************** Scaling/coloring **********************************/
  
    // remove duplicates if more than 2 group bys
    if(allData.length > 3) {
      links = links.reduce((acc: any, cur: any) => {
        const existing = acc.find((e: any) => e.source === cur.source && e.target === cur.target);
        if (existing) {
          existing.sum += cur.sum;
          if (!existing.field.includes(cur.field)) {
            existing.field.push(cur.field);
          }
        } else {
          acc.push({
            source: cur.source,
            target: cur.target,
            sum: cur.sum,
            strokeWidth: 0,
            color: cur.color,
            field: [cur.field],
            [options.colorConfigField]: cur[options.colorConfigField]
            // you can copy any other fields from the current object as needed
          });
        }
        return acc;
      }, []);
    }

   // color
    const hexColors = {
      nodeColor: theme.visualization.getColorByName(options.nodeColor),
      linkColor: theme.visualization.getColorByName(options.linkColor)
    }

    // set range for log mapping
    const linkScaleFrom = options.arcRange?.split(",").map(Number)[0]
    const linkScaleTo = options.arcRange?.split(",").map(Number)[1]
    const nodeScaleFrom = options.NodeRange?.split(",").map(Number)[0]
    const nodeScaleTo = options.NodeRange?.split(",").map(Number)[1]

    const minLink = Number(Math.min(...links.map(( e: any ) => e.sum))),
    maxLink = Number(Math.max(...links.map(( e: any ) => e.sum))),
    minNode = Number(Math.min(...uniqueNodes.map(( e: any ) => e.sum))),
    maxNode = Number(Math.max(...uniqueNodes.map(( e: any ) => e.sum)))

    // create groups for the field specified
    if(options.linkColorConfig !== "single" && options.colorConfigField) {
      // create unique groups according to the setting specified in options
      var groups = [...new Set(links.map( ( item: any ) => item[options.colorConfigField]))].map( ( group: any ) => ({
        [options.colorConfigField]: group,
        color: ""
      }))

      const spacedColors = getEvenlySpacedColors(groups.length)

      groups.forEach( (e, i) => {
        e.color = spacedColors[i]
      })
    }
    
    links.forEach((e: {source: number, strokeWidth: number; sum: number; color: string; field: string;}) => {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, e, linkScaleFrom, linkScaleTo, minLink, maxLink)
      // link color by field
      if (options.linkColorConfig === "field" && groups) {
        e.color = groups.find( group => group[options.colorConfigField] === e[options.colorConfigField])!.color
      } else {
 
        e.color = hexColors.linkColor
      }
    });

    uniqueNodes.forEach((e: { id:any, radius: any; sum: any; }) => {
      // check if arc thickness is set to source
      if(options.radiusFromSource) {
        // check if we apply logarithmic or linear scaling
        if(options.scale === "log") {
          // check if node only receiving. if yes, give it the size of the largest incoming link
          if(![...new Set(links.map((node: { source: any; }) => node.source))].includes(e.id)) {
            e.radius = Math.max(...links.filter( (link: { target: any; }) => link.target === e.id).map((el: { strokeWidth: number}) => el.strokeWidth))/2
          } else {
            e.radius = mapToLogRange( e.sum, nodeScaleFrom, nodeScaleTo, minNode, maxNode)
          }
          
        } else {
          if(![...new Set(links.map((node: { source: any; }) => node.source))].includes(e.id)) {
            e.radius = Math.max(...links.filter( (link: { target: any; }) => link.target === e.id).map((el: { strokeWidth: number}) => el.strokeWidth))/2
          } else {
            e.radius = (e.sum/100000000000000)
          }
          
        }
        
      } else {
        e.radius = options.nodeRadius
      }
    });

    /*uniqueLinks.forEach((e: {source: number, strokeWidth: number; sum: number; color: string; field: string;}) => {
      calcStrokeWidth(options.arcFromSource, options.scale, options.arcThickness, e, linkScaleFrom, linkScaleTo, minLink, maxLink)
    })*/

  return {uniqueNodes, links, hexColors, additionalField};
}
