import React, { useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { useTheme2 } from '@grafana/ui';
import Arc from './components/Arc';
import SearchField from './components/SearchField';
import { parseData } from 'dataParser';
import { styles } from 'styles';
import { calcDiagramHeight } from 'utils';

interface Props extends PanelProps<SimpleOptions> {}
/**
 * Grafana Arc diagram panel
 *
 * @param {*} { options, data, width, height, id }
 * @return { Arc } Arc diagram
 */
export const SimplePanel: React.FC<Props> = ({ options, data, width, height, id }: any) => {
  const [query, setQuery] = useState("");

  let graphOptions = {
    ...options,
  };
  
  const theme = useTheme2();

  if (data.series[0].fields.length > 4) {
    return <div>4th group by not supported</div>;
  }

  // check if source equals dst 
  const source = options.src ? data.series[0].fields.find((obj: { name: any; }) => obj.name === options.src).name : data.series[0].fields[0].name;
  const target = options.dest ? data.series[0].fields.find((obj: { name: any; }) => obj.name === options.dest).name : data.series[0].fields[1].name;

  // catch errors
  if (source === target) {
    return <div>Source equals target</div>;
  }

  let parsedData: { uniqueNodes: any[]; links: any[] } = {
    uniqueNodes: [],
    links: []
  };

  try {
    parsedData = parseData(data, graphOptions, theme);
  } catch (error) {
    console.error('parsing error: ', error);
  }

  console.log((calcDiagramHeight(parsedData.uniqueNodes, parsedData.links, width) > height))
  // check if diagram fits panel
  if (calcDiagramHeight(parsedData.uniqueNodes, parsedData.links, width) > height) {
    //return <div>Increase panels height to fit diagram</div>;
  }

  const textColor = theme.colors.text.primary;

  return (
    <div style={styles.panelContainerStyle}>
      <Arc
        textColor={textColor}
        parsedData={parsedData}
        graphOptions={graphOptions}
        width={width}
        height={height}
        query={query}
        isDarkMode={theme.isDark}
        panelId={id}
      ></Arc>
      {options.search && <SearchField
        onQuery={setQuery}
        nodeList={parsedData.uniqueNodes}
        isDarkMode={theme.isDark}
      ></SearchField>}
      
    </div>
  );
};



