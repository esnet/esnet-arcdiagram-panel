import { PanelPlugin, getFieldDisplayName, FieldOverrideContext } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

const OptionsCategory = ['Display'];

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addBooleanSwitch({
      path: 'arcFromSource',
      name: 'Arc thickness from source',
      defaultValue: false,
      category: OptionsCategory,
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
      category: OptionsCategory,
    })
    .addSliderInput({
      path: 'arcOpacity',
      name: 'Arc opacity',
      defaultValue: 1,
      settings: {
        min: .1,
        max: 1,
        step: .1,
      },
      category: OptionsCategory,
    })
    .addBooleanSwitch({
      path: 'radiusFromSource',
      name: 'Node radius from source',
      defaultValue: false,
      category: OptionsCategory,
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
      category: OptionsCategory,
    })
    .addSelect({
      path: 'linkColorConfig',
      name: 'Link color',
      description: 'Select configuration for the link color',
      defaultValue: "single",
      category: OptionsCategory,
      settings: {
        allowCustomValue: false,
        options: [
        { 
          label: "Single", 
          value: "single"
        },
        { 
          label: "By source", 
          value: "source"
        },
        { 
          label: "By field", 
          value: "field"
        }
        ],
      },
    })
    .addColorPicker({
      path: 'linkColor',
      name: 'Link Color',
      defaultValue: 'blue',
      showIf: config => config.linkColorConfig === "single",
      category: OptionsCategory,
    })
    .addColorPicker({
      path: 'nodeColor',
      name: 'Node Color',
      defaultValue: 'blue',
      category: OptionsCategory,
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
      showIf: config => config.radiusFromSource || config.arcFromSource,
      category: OptionsCategory,
    })
    
    .addSliderInput({
      path: 'saturation',
      name: 'Saturation',
      defaultValue: 100,
      settings: {
        min: 0,
        max: 100,
        step: 1,
      },
      showIf: config => config.groupLinkColor,
      category: OptionsCategory,
    })
    .addSliderInput({
      path: 'lightness',
      name: 'Lightness',
      defaultValue: 50,
      settings: {
        min: 0,
        max: 100,
        step: 1,
      },
      showIf: config => config.groupLinkColor,
      category: OptionsCategory,
    })
    .addSelect({
      path: 'src',
      name: 'Source',
      description: 'Select the field to use as source:',
      category: OptionsCategory,
      settings: {
        allowCustomValue: false,
        options: [],
        getOptions: async (context: FieldOverrideContext) => {
          const options = [];
          if (context && context.data) {
            for (const frame of context.data) {
              for (const field of frame.fields) {
                const name = getFieldDisplayName(field, frame, context.data);
                const value = name;
                options.push({ value, label: name });
              }
            }
          }
          return Promise.resolve(options);
        },
      },
    })
    .addSelect({
      path: 'dest',
      name: 'Destination',
      description: 'Select the field to use as target:',
      category: OptionsCategory,
      defaultValue: "",
      settings: {
        allowCustomValue: false,
        options: [],
        getOptions: async (context: FieldOverrideContext) => {
          const options = [];
          if (context && context.data) {
            for (const frame of context.data) {
              for (const field of frame.fields) {
                const name = getFieldDisplayName(field, frame, context.data);
                const value = name;
                options.push({ value, label: name });
              }
            }
          }
          return Promise.resolve(options);
        },
      },
    })
    .addTextInput({
      path: 'toolTipMetric',
      name: 'Tooltip text',
      category: OptionsCategory,
      defaultValue: "",
      description: 'Text to be displayed infront of metric.',
    })
    .addTextInput({
      path: 'toolTipGroupBy',
      name: 'Tooltip text',
      category: OptionsCategory,
      defaultValue: "",
      description: 'Text to be displayed infront of group by.',
    });
});


