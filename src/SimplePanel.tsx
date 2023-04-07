import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { useTheme2 } from '@grafana/ui';
import Arc from './components/Arc';
import { parseData } from 'dataParser';


interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }: any) => {
  let graphOptions = {
    ...options,
  };

  const theme = useTheme2();
  
  let parsedData: { uniqueNodes:any[]; links:any[] } = {
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
    <Arc
      textColor={textColor}
      parsedData={parsedData}
      graphOptions={graphOptions}
    ></Arc>
  );
};



