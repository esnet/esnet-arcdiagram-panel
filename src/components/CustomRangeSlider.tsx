import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { RangeSlider } from '@grafana/ui';
import { StandardEditorProps, StringFieldConfigSettings } from '@grafana/data';


interface Props extends StandardEditorProps<string, StringFieldConfigSettings> {
  suffix?: ReactNode;
}

export const CustomRangeSlider: React.FC<Props> = ({ value, onChange, item, suffix }) => {


  return (
    <div>
      <RangeSlider
          max={100}
          min={0}
          onAfterChange={function Nt(){}}
          onChange={function Nt(){}}
          orientation="horizontal"
          value={[
              10,
              62
          ]}
      />
    </div>
  )
};

