import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addBooleanSwitch({
      path: 'labelsOnHover',
      name: 'Labels on hover',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'normalizeArcs',
      name: 'Arc thickness from source',
      defaultValue: false,
    })
    .addSliderInput({
      path: 'arcThickness',
      name: 'Arc thickness',
      defaultValue: 1,
      settings: {
        min: 1,
        max: 5,
        step: 1,
      },
      showIf: config => !config.normalizeArcs,
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
    .addBooleanSwitch({
      path: 'normalizeRadius',
      name: 'Node radius from source',
      defaultValue: false,
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
      showIf: config => !config.normalizeRadius,
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
    });
});
