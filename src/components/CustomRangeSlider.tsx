import React, { ReactNode, useCallback } from 'react';
import { RangeSlider } from '@grafana/ui';
import { StandardEditorProps, StringFieldConfigSettings } from '@grafana/data';


interface Props extends StandardEditorProps<string, StringFieldConfigSettings> {
  suffix?: ReactNode;
}

// [refactor] Stylistic: dropped the unused `item` and `suffix` from the destructure.
export const CustomRangeSlider: React.FC<Props> = ({ value, onChange }) => {

  const onValueChange = useCallback(
    (value: number[] | undefined) => {
      onChange(String(value))
    },

    [onChange]
  );

  // [refactor] Bug fix: restore the saved range (stored as a "min,max" string) so the slider
  // reflects the configured value instead of always resetting to the previously hard-coded [1, 15].
  const sliderValue = value ? value.split(",").map(Number) : [1, 15];

  return (
    <div>
      <RangeSlider
          min={1}
          max={50}
          onAfterChange={onValueChange}
          onChange={onValueChange}
          orientation="horizontal"
          value={sliderValue}
      />
    </div>
  )
};

