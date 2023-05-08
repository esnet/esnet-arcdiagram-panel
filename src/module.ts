import { PanelPlugin, getFieldDisplayName, FieldOverrideContext, FieldConfigProperty } from '@grafana/data';
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
      defaultValue: "default",
      category: AppearanceCategory,
      settings: {
        allowCustomValue: false,
        options: [
          { 
            label: "Default", 
            value: "default"
          },
          { 
            label: "By field", 
            value: "field",
          }
        ],
      },
    })
    .addSelect({
      path: 'colorConfigField',
      name: 'Field',
      description: 'Select a field to base the link color on:',
      category: AppearanceCategory,
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
      showIf: config => config.linkColorConfig !== "default",
    })
    .addColorPicker({
      path: 'linkColor',
      name: 'Link Color',
      defaultValue: 'blue',
      showIf: config => config.linkColorConfig === "default",
      category: AppearanceCategory,
    })
    .addColorPicker({
      path: 'nodeColor',
      name: 'Node Color',
      defaultValue: 'blue',
      category: AppearanceCategory,
    })
    .addBooleanSwitch({
      path: 'search',
      name: 'Activate search bar',
      defaultValue: false,
      category: AppearanceCategory,
    })
    .addSliderInput({
      path: 'fontSize',
      name: 'Font size',
      defaultValue: 10,
      settings: {
        min: 5,
        max: 20,
        step: 1,
      },
      category: AppearanceCategory,
    })
    .addBooleanSwitch({
      path: 'zoom',
      name: 'Activate zoom button',
      defaultValue: false,
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
      name: 'Range for weighted links',
      description: 'Range which the arc thickness is being mapped to',
      category: DataCategory,
      defaultValue: "1,15",
      showIf: config => config.arcFromSource,
    })
    .addCustomEditor({
      id: "setRange",
      path: "NodeRange",
      editor: CustomRangeSlider,
      name: 'Range for weighted nodes',
      description: 'Range which the node radius is being mapped to',
      category: DataCategory,
      defaultValue: "1,15",
      showIf: config => config.scale === "log" && config.radiusFromSource,
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
    .addTextInput({
      path: "toolTipMetric",
      name: 'Tooltip text',
      category: DataCategory,
      defaultValue: "Sum: ",
      description: 'Text to be displayed infront of metric.',
    })
})
.useFieldConfig({
  disableStandardOptions: [FieldConfigProperty.NoValue, FieldConfigProperty.Max, FieldConfigProperty.Min],
  standardOptions: {
    [FieldConfigProperty.Color]: {
      settings: {
        byValueSupport: true,
        bySeriesSupport: true,
        preferThresholdsMode: true,
      },
    },
  },
});


