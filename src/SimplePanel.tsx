import React, { useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { useTheme2 } from '@grafana/ui';
import Arc from './components/Arc';
import SearchField from './components/SearchField';
import { parseData } from 'dataParser';
import { styles } from 'styles';

interface Props extends PanelProps<SimpleOptions> {}
/**
 * Grafana Arc diagram panel
 *
 * @param {*} { options, data, width, height, id }
 * @return { Arc } Arc diagram
 */

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }: any) => {
  const [query, setQuery] = useState("");
  const [zoomState, setZoomState] = useState(10);
  const isIncrement = true

  const onClick = (isIncrement: boolean) => {
    if(!isIncrement && zoomState == 10) {
      return
    } else {
      setZoomState((isIncrement) ? zoomState+1 : zoomState-1)
    }
  }

  let graphOptions = {
    ...options,
  };

  const theme = useTheme2();

  if (data.series[0].fields.length > 3) {
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
        zoomState={zoomState}
      ></Arc>
      <div style={styles.toolBarStyle}>
        {options.search && <SearchField
          onQuery={setQuery}
          nodeList={parsedData.uniqueNodes}
          isDarkMode={theme.isDark}
        ></SearchField>}
        {options.zoom && 
        <div style={styles.zoomButtonWrapper}>
          <button className="zoom-button" style={styles.zoomButtonStyle(theme.isDark)} onClick={() => onClick(!isIncrement)}>
            <img style={styles.zoomIcon(theme.isDark)} src="public/plugins/esnet-test/img/minus_icon.svg" alt=""/>
          </button>
          <button className="zoom-button" style={styles.zoomButtonStyle(theme.isDark)} onClick={() => onClick(isIncrement)}>
            <img style={styles.zoomIcon(theme.isDark)} src="public/plugins/esnet-test/img/plus_icon.svg" alt=""/>
          </button>
        </div>
        }
        
      </div>
      
      
    </div>
  );
};



