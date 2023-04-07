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
    // Calculate bounding box heigth of nametags for correct margin from bottom
    // Fix double node behavior
    // Implement node radius by source
    // Implement popup when hovering over nodess

    /* DataFrameView doesn't work */
    //const series = dummydataframe.series[0];
    //const frame = new DataFrameView(series);
    var allData = data.series[0].fields;

    // get source and target arrays and create array of unique nodes from them
    let src = allData[0].values
    let dest = allData[1].values
    const uniqueNodes = Array.from([...new Set([...src, ...dest])]).map((str, index) => ({
      id: index,
      name: str
    }));

    let srcById = src.map((name: any) => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    let dstById = dest.map((name: any) => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    const links = srcById.map((element: any, index: string | number) => ({
      source: element,
      target: dstById[index],
      // unit conversion to be added
      sum: <number>allData[2].values.buffer[index],
      strokeWidth: 0
    }));

    // color
    const hexColors = {
      nodeColor: theme.visualization.getColorByName(options.nodeColor),
      linkColor: theme.visualization.getColorByName(options.linkColor)
    }


  return {uniqueNodes, links, hexColors};
}
