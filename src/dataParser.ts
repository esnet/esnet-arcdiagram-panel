import { mapToLogRange } from 'utils';

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
    //const { valueFieldName } = options;

    // We need to return:
    // - list of unique nodes 
    // - links between nodes

    // To do:
    // DONE Work on conventions regarding commenting and general code
    // DONE Calculate bounding box heigth of nametags for correct margin from bottom
    // DONE Fix double node behavior
    // DONE node radius by source
    // popup when hovering over nodes
    // group links by color
    // Unit conversion
    // fix nodes jumping when resizing panel
    // highlight receiving labels

    // log vs linear scale
    // dropdown for choosing source and dest

    /* DataFrameView doesn't work */
    //const series = dummydataframe.series[0];
    //const frame = new DataFrameView(series);
    var allData = data.series[0].fields;

    let source = allData[0].values
    let target = allData[1].values

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
      sum: <number>allData[2].values.buffer[index],
      strokeWidth: 0
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

    

    /********************************** Scaling **********************************/ 

      const minLink = Number(Math.min(...links.map(( e: any ) => e.sum))),
      maxLink = Number(Math.max(...links.map(( e: any ) => e.sum))),
      minNode = Number(Math.min(...uniqueNodes.map(( e: any ) => e.sum))),
      maxNode = Number(Math.max(...uniqueNodes.map(( e: any ) => e.sum)))

      links.forEach((e: { strokeWidth: any; sum: any; }) => {
        // check if arc thickness is set to source
        if(options.arcFromSource) {
          console.log(options.scaling)

          // check if we apply logarithmic or linear scaling
          if(options.scaling == "log") {
            e.strokeWidth = mapToLogRange(e.sum, minLink, maxLink, 1, 10)
          } else {
            e.strokeWidth = e.sum/1000000000000
          }
        } else {
          e.strokeWidth = options.arcThickness
        }
      });


      uniqueNodes.forEach((e: { id:any, radius: any; sum: any; }) => {
        // check if arc thickness is set to source
        if(options.radiusFromSource) {
          // check if we apply logarithmic or linear scaling
          if(options.scaling === "log") {
            // check if node only receiving. if yes, give it the size of the largest incoming link
            if(![...new Set(links.map((node: { source: any; }) => node.source))].includes(e.id)) {
              // to do
              e.radius = 5
            } else {
              e.radius = mapToLogRange(e.sum, minNode, maxNode, 5, 15)
            }
            
          } else {
            e.radius = e.sum/10000000000000
          }
          
        } else {
          e.radius = options.nodeRadius
        }
      });


     




    

    


  return {uniqueNodes, links, hexColors};
}
