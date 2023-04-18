import { mapToLogRange } from 'utils';
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

  // if src/dst not defined in options, take first/second group by as default
  var source = options.src ? allData.find((obj: { name: any; }) => obj.name === options.src)?.values : allData[0].values;
  var target = options.dest ? allData.find((obj: { name: any; }) => obj.name === options.dest)?.values : allData[1].values;

  // get source and target arrays and create array of unique nodes from them
  const uniqueNodes = Array.from([...new Set([...source, ...target])]).map((str, index) => ({
    id: index,
    name: str,
    sum: 0,
    radius: 0
  }));

  let srcById = source.map((name: any) => {
    const dictionaryItem = uniqueNodes.find(item => item.name === name);
    return dictionaryItem ? dictionaryItem.id : null;
  });

  let dstById = target.map((name: any) => {
    const dictionaryItem = uniqueNodes.find(item => item.name === name);
    return dictionaryItem ? dictionaryItem.id : null;
  });

  const links = srcById.map((element: any, index: string | number) => ({
    source: element,
    target: dstById[index],
    sum: <number>allData.find((obj: { name: any; }) => obj.name === "Sum")?.values.buffer[index],
    strokeWidth: 0,
    color: "",
    groupBy: allData[3] ? allData[2].values.buffer[index] : ""
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

  // color
  const hexColors = {
    nodeColor: theme.visualization.getColorByName(options.nodeColor),
    linkColor: theme.visualization.getColorByName(options.linkColor)
  }


  /********************************** Scaling/coloring **********************************/ 

    const minLink = Number(Math.min(...links.map(( e: any ) => e.sum))),
    maxLink = Number(Math.max(...links.map(( e: any ) => e.sum))),
    minNode = Number(Math.min(...uniqueNodes.map(( e: any ) => e.sum))),
    maxNode = Number(Math.max(...uniqueNodes.map(( e: any ) => e.sum)))
    
    var sourceGroups = [...new Set(links.map((item: { source: any; }) => item.source))].map( (source,i) => ({
      source, 
      color: ""
    }));

    const spacedColors = getEvenlySpacedColors(sourceGroups.length,options.saturation,options.lightness)

    sourceGroups.forEach( (e, i) => {
      e.color = spacedColors[i]
    })
    console.log(options.linkColorConfig)

    links.forEach((e: {source: number, strokeWidth: number; sum: number; color: string}) => {
      // check if arc thickness is set to source
      if(options.arcFromSource) {
        // check if we apply logarithmic or linear scaling
        if(options.scale == "log") {
          e.strokeWidth = mapToLogRange({ number: e.sum, min: minLink, max: maxLink, scaleFrom: 1, scaleTo: 20 })
        } else {
          e.strokeWidth = e.sum/1000000000000
        }
      } else {
        e.strokeWidth = options.arcThickness
      }
      // set link color
      if(options.linkColorConfig === "source") {
        e.color = sourceGroups.find( group => group.source === e.source)!.color
      } else if (options.linkColorConfig === "single") {
        e.color = hexColors.linkColor
      } else {
        // color by field 

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
            e.radius = mapToLogRange({ number: e.sum, min: minNode, max: maxNode, scaleFrom: 5, scaleTo: 15 })
          }
          
        } else {
          if(![...new Set(links.map((node: { source: any; }) => node.source))].includes(e.id)) {
            e.radius = Math.max(...links.filter( (link: { target: any; }) => link.target === e.id).map((el: { strokeWidth: number}) => el.strokeWidth))/2
          } else {
            e.radius = (e.sum/1000000000000)/2
          }
          
        }
        
      } else {
        e.radius = options.nodeRadius
      }
    });

    // additional group by
    const uniqueLinks = Array.from(
      new Set(links.map(({ source, target }: {source: number, target: number}) => `${source}-${target}`))
    ).map((link: any) => {
      const [source, target] = link.split('-');
      return {
        source: parseInt(source),
        target: parseInt(target),
        groupBy: links
          .filter(({ source, target }: { source: number, target: number}) => `${source}-${target}` === link)
          .map(({ groupBy }: { groupBy:number }) => groupBy.toString()),
      };
    });
    
    console.log("Unique links with group by: ", uniqueLinks);

  return {uniqueNodes, links, hexColors, uniqueLinks};
}
