import React, { ReactNode, useCallback } from 'react';
import { RangeSlider } from '@grafana/ui';
import { StandardEditorProps, StringFieldConfigSettings } from '@grafana/data';


interface Props extends StandardEditorProps<string, StringFieldConfigSettings> {
  suffix?: ReactNode;
}

export const CustomRangeSlider: React.FC<Props> = ({ value, onChange, item, suffix }) => {

  const onValueChange = useCallback(
    (value: number[] | undefined) => {
      onChange(String(value))
    },
    
    [value, onChange]
  );

  return (
    <div>
      <RangeSlider
          min={1}
          max={50}
          onAfterChange={onValueChange}
          onChange={onValueChange}
          orientation="horizontal"
          value={[
              1,
              15
          ]}
      />
    </div>
  )
};

