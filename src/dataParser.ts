//import { DataFrameView } from '@grafana/data';
// import { color } from 'd3';


export function parseData(data: { series: any[] }, options: any, theme: any) { // <- should that have proper typing?
    //const { valueFieldName } = options;

    // We need to return:
    // - list of unique nodes 
    // - links between nodes

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
      sum: <number>allData[2].values.buffer[index]/10000000000000,
      strokeWidth: 0
    }));

    // color
    const hexColors = {
      nodeColor: theme.visualization.getColorByName(options.nodeColor),
      linkColor: theme.visualization.getColorByName(options.linkColor)
    }


  return {uniqueNodes, links, hexColors};
}
