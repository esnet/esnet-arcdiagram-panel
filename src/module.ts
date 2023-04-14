import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addBooleanSwitch({
      path: 'arcFromSource',
      name: 'Arc thickness from source',
      defaultValue: false,
    })
    .addSliderInput({
      path: 'arcThickness',
      name: 'Arc thickness',
      defaultValue: 1,
      settings: {
        min: 1,
        max: 15,
        step: 1,
      },
      showIf: config => !config.arcFromSource,
    })
    .addBooleanSwitch({
      path: 'radiusFromSource',
      name: 'Node radius from source',
      defaultValue: false,
    })
    .addSliderInput({
      path: 'nodeRadius',
      name: 'Node radius',
      defaultValue: 5,
      settings: {
        min: 5,
        max: 15,
        step: 1,
      },
      showIf: config => !config.radiusFromSource,
    })
    .addSelect({
      path: 'scale',
      name: 'Scaling',
      defaultValue: "lin",
      description: 'Select the scaling of the diagram',
      settings: {
        allowCustomValue: false,
        options: [
          {
            label: 'Linear',
            value: 'lin',
          },
          {
            label: "Logarithmic",
            value: "log"
          }
        ],
      },
      showIf: config => config.radiusFromSource || config.arcFromSource
    })
    .addColorPicker({
      path: 'nodeColor',
      name: 'Node Color',
      defaultValue: 'blue',
      showIf: config => !config.groupLinkColor,
    })
    .addColorPicker({
      path: 'linkColor',
      name: 'Link Color',
      defaultValue: 'blue',
      showIf: config => !config.groupLinkColor,
    })
    
    .addBooleanSwitch({
      path: 'groupLinkColor',
      name: 'Link color by source',
      defaultValue: false,
    })
});
