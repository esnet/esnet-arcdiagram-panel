# Arcdiagram Panel Plugin

This plugin creates an arc diagram showing the relationship between 2 selected fields (source and destination).
A third group by will be displayed in the tooltip.

![](https://github.com/esnet/esnet-arcdiagram-panel/blob/main/src/img/arcdiagram-plugin.png)


## Options
### Appearance
**Arc thickness / node radius from source:** Adjusts the arc thickness / node radius based on the metric<br>
**Arc thickness:** Slider from 1 to 15 to adjust thickness of the links (if arc thickness not from source)<br>
**Arc opacity:** Slider from 0.1 to 1 to adjust opacity of the links <br>
**Node radius:** Slider from 5 to 15 to adjust radius of the nodes (if node radius not from source)<br>

**Link color:** Dropdown to pick the preferred coloring. "Default" allows to use the color picker for the preferred color. "By field" opens another dropdown that gives the option to pick a group by which the color should be based on

### Data
**Scaling:** Appears when arc thickness / node radius is set to "from source". Gives the option to select linear or logarithmic scaling<br>
**Range for weighted links/nodes:** Appears when arc thickness / node radius is set to "from source". Slider to select a range to which the arc/node size is being mapped to<br>
**Source:** Dropdown to select field for source nodes<br>
**Destination:** Dropdown to select field for destination nodes<br>
**Tooltip text:** Text to be displayed infront of data in the tooltip
