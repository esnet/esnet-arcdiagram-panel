import { PanelPlugin, getFieldDisplayName, FieldOverrideContext } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';
import { CustomRangeSlider } from './components/CustomRangeSlider'

const AppearanceCategory = ['Appearance'];
const DataCategory = ['Data'];


export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addBooleanSwitch({
      path: 'arcFromSource',
      name: 'Arc thickness from source',
      defaultValue: false,
      category: AppearanceCategory,
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
      category: AppearanceCategory,
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
      category: AppearanceCategory,
    })
    .addBooleanSwitch({
      path: 'radiusFromSource',
      name: 'Node radius from source',
      defaultValue: false,
      category: AppearanceCategory,
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
      category: AppearanceCategory,
    })
    .addSelect({
      path: 'linkColorConfig',
      name: 'Link color',
      description: 'Select configuration for the link color',
      defaultValue: "single",
      category: AppearanceCategory,
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
            value: "field",
          }
        ],
      },
    })
    .addColorPicker({
      path: 'linkColor',
      name: 'Link Color',
      defaultValue: 'blue',
      showIf: config => config.linkColorConfig === "single",
      category: AppearanceCategory,
    })
    .addColorPicker({
      path: 'nodeColor',
      name: 'Node Color',
      defaultValue: 'blue',
      category: AppearanceCategory,
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
      category: DataCategory,
    })
    .addCustomEditor({
      id: "setRange",
      path: "arcRange",
      editor: CustomRangeSlider,
      name: '',
      category: DataCategory,

    })
    .addSelect({
      path: 'src',
      name: 'Source',
      description: 'Select the field to use as source:',
      category: DataCategory,
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
      category: DataCategory,
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
      path: "toolTipSource",
      name: 'Tooltip text',
      category: DataCategory,
      defaultValue: "From: ",
      description: 'Text to be displayed infront of target node.',
    })
    .addTextInput({
      path: "toolTipTarget",
      name: 'Tooltip text',
      category: DataCategory,
      defaultValue: "To: ",
      description: 'Text to be displayed infront of source node.',
    })
    
});


