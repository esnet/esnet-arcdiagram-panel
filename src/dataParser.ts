//import { DataFrameView } from '@grafana/data';
// import { color } from 'd3';
import dummydataframe from 'dummydataframe.json'


export function parseData(data: { series: any[] }, options: any, theme: any) { // <- should that have proper typing?
    //const { valueFieldName } = options;

    // We need to return:
    // - list of unique nodes 
    // - links between nodes

    /* DataFrameView doesn't work */
    //const series = dummydataframe.series[0];
    //const frame = new DataFrameView(series);
    var allData = dummydataframe.series[0].fields;

    // get src and dst arrays and create array of unique nodes from them
    let src = allData.find(obj => obj.name ==="meta.src_preferred_org.keyword")!.values
    let dest = allData.find(obj => obj.name ==="meta.dst_preferred_org.keyword")!.values
    const uniqueNodes = Array.from([...new Set([...src, ...dest])]).map((str, index) => ({
      id: index,
      name: str
    }));

    let srcById = src.map(name => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    let dstById = dest.map(name => {
      const dictionaryItem = uniqueNodes.find(item => item.name === name);
      return dictionaryItem ? dictionaryItem.id : null;
    });

    const links = srcById.map((element, index) => ({
      source: element,
      target: dstById[index],
      sum: <number>(allData.find(obj => obj.name ==="Sum")!.values[index])/100000000000000
    }));
    
    // color
    const hexColors = {
      nodeColor: theme.visualization.getColorByName(options.nodeColor),
      linkColor: theme.visualization.getColorByName(options.linkColor)
    }


  return {uniqueNodes, links, hexColors};
}
