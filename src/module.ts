import { PanelPlugin, getFieldDisplayName, FieldOverrideContext, FieldConfigProperty } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';
import { CustomRangeSlider } from './components/CustomRangeSlider'

const AppearanceCategory = ['Appearance'];
const DataCategory = ['Data'];
const ModeCategory = ['Mode'];


export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addBooleanSwitch({
      path: 'hopMode',
      name: 'Visualize AS path',
      defaultValue: false,
      category: ModeCategory,
      showIf: config => !config.isCluster
    })
    .addSelect({
      path: 'delimiter',
      name: 'String delimiter',
      description: 'Character to seperate nodes by',
      defaultValue: "Space",
      category: ModeCategory,
      settings: {
        allowCustomValue: false,
        options: [
          { 
            label: "Space", 
            value: "space"
          },
          { 
            label: ",", 
            value: ",",
          },
          { 
            label: ";", 
            value: ";",
          },
          { 
            label: ":", 
            value: ":",
          }
        ],
      },
      showIf: config => config.hopMode
    })
    .addBooleanSwitch({
      path: 'arcFromSource',
      name: 'Arc thickness from source',
      defaultValue: false,
      category: AppearanceCategory,
    })
    .addBooleanSwitch({
      path: 'radiusFromSource',
      name: 'Node radius from source',
      defaultValue: false,
      category: AppearanceCategory,
      showIf: config => !config.hopMode
    })
    .addSelect({
      path: 'arcWeightSource',
      name: 'Weight field',
      description: 'Select a field for the arc and node weight (has to be a metric):',
      category: AppearanceCategory,
      settings: {
        allowCustomValue: false,
        options: [],
        getOptions: async (context: FieldOverrideContext) => {
          const options = [];
          if (context && context.data) {
            for (const frame of context.data) {
              for (const field of frame.fields) {
                const value = field.name;
                options.push({ value, label: value });
              }
            }
          }
          return Promise.resolve(options);
        },
      },
      showIf: config => config.arcFromSource || config.radiusFromSource,
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
        min: .6,
        max: 1,
        step: .1,
      },
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
      description: 'Select configuration for the link color ("By Field" will overwrite threshold)',
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
      showIf: config => !config.hopMode,
    })
    .addSelect({
      path: 'colorConfigField',
      name: 'Field',
      description: 'Select a field to base the link color on',
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
      path: 'nodeColor',
      name: 'Node Color',
      defaultValue: 'blue',
      category: AppearanceCategory,
      showIf: config => !config.isCluster
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
    .addSliderInput({
      path: 'tooltipFontSize',
      name: 'Tooltip font size',
      defaultValue: 8,
      settings: {
        min: 8,
        max: 20,
        step: 1,
      },
      category: AppearanceCategory,
    })
    .addSliderInput({
      path: 'yRad',
      name: 'Margin between overlapping links',
      defaultValue: 1.3,
      settings: {
        min: 1,
        max: 2,
        step: .1,
      },
      showIf: config => config.hopMode,
      category: AppearanceCategory,
    })
    .addSliderInput({
      path: 'arcHeight',
      name: 'Height of links',
      defaultValue: 0.4,
      settings: {
        min: 0.2,
        max: 1.5,
        step: .1,
      },
      showIf: config => !config.hopMode,
      category: AppearanceCategory,
    })
    .addSliderInput({
      path: 'marginLeft',
      name: 'Margin from left border',
      defaultValue: 50,
      settings: {
        min: 0,
        max: 200,
        step: 1,
      },
      category: AppearanceCategory,
    })
    .addSliderInput({
      path: 'marginRight',
      name: 'Margin from right border',
      defaultValue: 50,
      settings: {
        min: 0,
        max: 200,
        step: 1,
      },
      category: AppearanceCategory,
    })
    .addBooleanSwitch({
      path: 'search',
      name: 'Show search bar',
      defaultValue: false,
      category: AppearanceCategory,
    })
    .addBooleanSwitch({
      path: 'zoom',
      name: 'Show zoom button',
      defaultValue: false,
      category: AppearanceCategory,
    })
    .addTextInput({
      path: "toolTipSource",
      name: 'Tooltip source',
      category: AppearanceCategory,
      defaultValue: "From: ",
      description: 'Text to be displayed infront of target node.',
    })
    .addTextInput({
      path: "toolTipTarget",
      name: 'Tooltip target',
      category: AppearanceCategory,
      defaultValue: "To: ",
      description: 'Text to be displayed infront of source node.',
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
      path: "nodeRange",
      editor: CustomRangeSlider,
      name: 'Range for weighted nodes',
      description: 'Range which the node radius is being mapped to',
      category: DataCategory,
      defaultValue: "1,15",
      showIf: config => config.radiusFromSource,
    })
    .addBooleanSwitch({
      path: 'isCluster',
      name: 'Activate node clustering',
      defaultValue: false,
      category: DataCategory,
    })
    .addSelect({
      path: 'srcCluster',
      name: 'Source cluster',
      description: 'Select the field to cluster the source by:',
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
      showIf: config => config.isCluster
    })
    .addSelect({
      path: 'dstCluster',
      name: 'Destination cluster',
      description: 'Select the field to cluster the target by:',
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
      showIf: config => config.isCluster
    })
    .addSelect({
      path: 'pathField',
      name: 'Path',
      description: 'Select the field to use as traceroute:',
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
      showIf: config => config.hopMode
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
      showIf: config => !config.hopMode
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
      showIf: config => !config.hopMode
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


