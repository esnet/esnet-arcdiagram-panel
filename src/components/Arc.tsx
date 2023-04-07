import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

let containerStyle = {
  width: "100%",
  height: "100%"
}


function Arc(props: any) {
  let uniqueNodes = props.parsedData.uniqueNodes;
  let links = props.parsedData.links;
  const containerRef = useRef(null);
  const gRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    // removes the graph if it exists in the dom so it gets rendered with updated dimensions
    d3.selectAll("circle, path, text").remove();

    // either normalize stroke width or set it to weighted
    links.forEach((e: { strokeWidth: any; sum: any; }) => {
      // mapping from sum to strokewidth needs to be changed later
      e.strokeWidth = !props.graphOptions.arcFromSource ? props.graphOptions.arcThickness : e.sum/1000000000000;
    });

     // either normalize radius width or set it to weighted
     uniqueNodes.forEach((e: { radius: any; sum: any; }) => {
      // mapping from sum to strokewidth needs to be changed later
      e.radius = !props.graphOptions.radiusFromSource ? props.graphOptions.nodeRadius : e.sum/10000000000000;
    });

    console.log("The nodes are: ", uniqueNodes)
    console.log("The links are: ", links)

    // margins might be useful later
    /*const margin = {
      top: 20,
      right: 50,
      bottom: 20,
      left: 50
    },*/

    const width = props.width,
    height = props.height

    const container = containerRef.current,
    graph = gRef.current,
    labelBox = labelRef.current;

    // render labels
    var text = d3.select(labelBox)
      .selectAll('text')
      .data(uniqueNodes)

    text
      .enter()
      .append("text")
      .attr("x", -10)
      .attr("y", 10)
      .text((d, i) => uniqueNodes[i].name)
      .style("text-anchor", "end")
      .attr('fill', 'white')
      .attr('font-size', 10)
      .attr('transform', (d, i) => ("translate(" + 0 + "," + (height) + ")rotate(-30)"))
      .style("margin-right", "5px")

    // after the labels are rendered, we can find out the amount of margin we need to apply
    // from the bottom and left so that the diagram is readable. The amount is being calculated from
    // the boundingbox of the largest highlighted label and the most left label
    var offsetBottom = Math.max(...Array.from(document.getElementsByTagName("text"), (text) => text.getBoundingClientRect().height));
    var offsetLeft = document.getElementsByTagName("text")[0].getBoundingClientRect().width
    // Map to highlighted labels (size increases by 60%)
    offsetBottom*=1.6
    offsetLeft*=1.6

    // get array of equally spaced values for positioning of graph on x axis
    const values = d3.range(offsetLeft, width, width / uniqueNodes.length);

    // Update the labels position
    d3.selectAll("text")
    .attr('transform', (d, i) => ("translate(" + values[i] + "," + (height-offsetBottom) + ")rotate(-30)"))

    // render nodes
    var svg = d3.select(container)
    .selectAll('circle')
    .data(uniqueNodes)

    svg
      .enter()
      .append("circle")
      .attr("cx", (d, i) => values[i])
      .attr("cy", height-offsetBottom)
      .attr("r", (n: any) => { return  n?.radius })
      .style("fill", props.parsedData.hexColors.nodeColor)
      .attr("id", (d, i) => uniqueNodes[i].id)
      .attr("name", (d, i) => uniqueNodes[i].name)
      .attr("radius", (d, i) => uniqueNodes[i].radius);

    // render links
    var g = d3.select(graph)
      .selectAll('path')
      .data(links)

    g
      .enter()
      .append('path')
      .attr('d', function (d, i) {
        const start = values[links[i].source]
        const end = values[links[i].target]
        return ['M', start, height-offsetBottom,
            'A',
            (start - end) / 2, ',',
            (start - end) / 2, 0, 0, ',',
            start < end ? 1 : 0, end, ',', height-offsetBottom
          ]
          .join(' ');
      })
      .style("fill", "none")
      .attr("stroke", props.parsedData.hexColors.linkColor)
      .attr("id", "arc")
      .attr("stroke-width", (l: any) => { return  l?.strokeWidth })
      .attr("source", (d, i) => links[i].source)
      .attr("target", (d, i) => links[i].target)

    
    /********************************** highlighting **********************************/ 
    var nodes = d3.selectAll("circle")
    var paths = d3.selectAll("path")
    var labels = d3.selectAll("text")
    var duration = 200;
    nodes
      .on("mouseover", function (d) {
        nodes
          .style("opacity", .2)
          .transition()
          .duration(duration)
        d3.select(this)
          .style("opacity", 1)
          .transition()
          .duration(duration)
          .attr("r", uniqueNodes[d.srcElement.id].radius*2)
        paths
          .transition()
          .style('stroke-opacity', (l: any) => {
            return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? 1 : .1
          })
          .attr('stroke-width', (l: any) => {
            return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? l?.strokeWidth*2 : l?.strokeWidth
          })
          .duration(duration)

        labels
          .transition()
          .duration(duration)
          .attr("font-size", function (label_d: any) {
            return label_d.name === d.srcElement.getAttribute("name") ? 16 : 10
          })
          .style("opacity", function (label_d: any) {
            return label_d.name === d.srcElement.getAttribute("name") ? 1 : .1
          })

      })
      .on('mouseout', function (d) {
        nodes.style('opacity', 1)
          .transition()
          .duration(duration)
        d3.select(this)
          .attr("r", uniqueNodes[d.srcElement.id].radius)
        paths
          .transition()
          .duration(duration)
          .style('stroke-opacity', 1)
          .attr('stroke-width', (l: any) => {
            return l?.strokeWidth
          })
        labels
        .transition()
          .duration(duration)
          .attr("font-size", 10)
          .style("opacity", 1)
      })
      /******************************************************************************/


        

        

  }, [props.graphOptions]);

  return ( 
      <div  style={containerStyle} > 
        <svg style={containerStyle} ref = {containerRef}>
        <g style={containerStyle} ref = {gRef}></g>
        <svg style={containerStyle} ref = {labelRef}></svg>
      </svg>
      </div> 
      
  );
}

export default Arc;