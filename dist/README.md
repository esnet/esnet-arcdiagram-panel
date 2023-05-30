# Arcdiagram Panel Plugin

This plugin creates an arc diagram showing the relationship between 2 selected fields (source and destination).
A third group by will be displayed in the tooltip.

![](https://github.com/esnet/esnet-arcdiagram-panel/blob/main/src/img/arcdiagram-plugin.png)


## Options
### Mode
**Visualize traceroute:** Switches between default diagram usage and traceroute visualization.<br>
**String delimiter:** Character used to separate nodes when visualizing traceroute.<br>
### Appearance
**Arc thickness from source:** Determines if the arc thickness should be based on the source node.<br>
**Arc thickness:** Specifies the thickness of the arcs if arc thickness is not set to "from source".<br>
**Arc opacity:** Specifies the opacity of the arcs.<br>
**Node radius from source:** Determines if the node radius should be based on the source node.<br>
**Node radius:** Specifies the weight of the nodes if node radius is not set to "from source".<br>
**Link color:** Selects the configuration for the link color. The options include 'Default' and 'By field'. When 'Default' is selected, the links are colored based on the specified color or by utilizing thresholds. Choosing 'By field' opens another dropdown to select the field used for coloring the links.<br>
**Field:** Dropdown to select the field used for coloring the links.<br>
**Node Color:** Specifies the color of the nodes.<br>
**Font size:** Specifies the labels font size.<br>
**Margin between overlapping links:** Sets the margin between overlapping links when traceroute mode is selected.<br>
**Left/right margin:** Sets the margin between the diagram and the left/right border.<br>
**Activate search bar:** Shows the search bar.<br>
**Activate zoom button:** Shows the zoom buttons.<br>
### Data
**Scaling:** Selects the scaling of the diagram (linear or logarithmic).<br>
**Range for weighted links:** Specifies the range to map arc thickness for weighted links.<br>
**Range for weighted nodes:** Specifies the range to map node radius for weighted nodes.<br>
**Activate node clustering:** Activates node clustering.<br>
**Source cluster:** Field used to cluster the source nodes.<br>
**Destination cluster:** Field used to cluster the destination nodes.<br>
**Path:** Field used as the traceroute path.<br>
**Source:** Field used as the source.<br>
**Destination:** Field used as the destination.<br>
**Tooltip text:** Text displayed in front of the target node in the tooltip.<br>
**Tooltip text:** Text displayed in front of the source node in the tooltip.<br>
**Tooltip text:** Text displayed in front of the metric in the tooltip.<br>
