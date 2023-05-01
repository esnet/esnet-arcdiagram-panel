# Matrix Panel Plugin

This plugin creates an arc diagram showing the relationship between 2 selected fields (source and destination).
A third group by will be displayed in the tooltip.

![](https://github.com/esnet/esnet-arcdiagram-panel/tree/main/src/img/arcdiagram-plugin.png?raw=true)

## Options
### Appearance
**Arc thickness / node radius from source:** Adjusts the arc thickness / node radius based on the metric
**Link color:** Dropdown to pick the preferred coloring. "Single" allows to use the color picker for the preferred color. "By field" opens another dropdown that gives the option to pick a group by which the color should be based on

### Data
**Scaling:** Appears when arc thickness / node radius is set to "from source". Gives the option to select linear or logarithmic scaling
**Range for weighted links/nodes:** Appears when arc thickness / node radius is set to "from source". Slider to select a range to which the arc/node size is being mapped to
**Source:** Dropdown to select field for source nodes
**Destination:** Dropdown to select field for destination nodes
**Tooltip text:** Text to be displayed infront of data in the tooltip
