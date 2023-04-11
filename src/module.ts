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
    .addBooleanSwitch({
      path: 'radiusFromSource',
      name: 'Node radius from source',
      defaultValue: false,
    })
    .addSelect({
      path: 'scaling',
      name: 'Scaling',
      description: 'Select the scaling of the diagram',
      defaultValue: "lin",
      settings: {
        allowCustomValue: false,
        options: [
          {
            label: 'Logarithmic',
            value: 'log',
          },
          {
            label: 'Linear',
            value: 'lin',
          },
        ],
      },
      showIf: config => config.radiusFromSource || config.arcFromSource
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
    .addColorPicker({
      path: 'nodeColor',
      name: 'Node Color',
      defaultValue: 'blue',
    })
    .addColorPicker({
      path: 'linkColor',
      name: 'Link Color',
      defaultValue: 'blue',
    })

    .addSliderInput({
      path: 'nodeRadius',
      name: 'Node radius',
      defaultValue: 5,
      settings: {
        min: 5,
        max: 30,
        step: 1,
      },
      showIf: config => !config.radiusFromSource,
    })
    .addSliderInput({
      path: 'nodePadding',
      name: 'Node padding',
      defaultValue: 30,
      settings: {
        min: 1,
        max: 100,
        step: 1,
      },
    })
});
