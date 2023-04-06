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
    // get panel size and set the dimensions and margins of the graph
    const panelWidth = window.document.body.querySelector("div.panel-content") !.getBoundingClientRect().width;
    const panelHeight = window.document.body.querySelector("div.panel-content") !.getBoundingClientRect().height;

    const margin = {
      top: 20,
      right: 50,
      bottom: 200,
      left: 50
    },
    width = panelWidth - margin.left - margin.right,
    height = panelHeight - margin.top - margin.bottom;

    // get array of equally spaced values for positioning of nodes on x axis
    const values = d3.range(margin.left, panelWidth - margin.right, width / uniqueNodes.length);
    
    const container = containerRef.current,
    graph = gRef.current
    const labelBox = labelRef.current;

    // render nodes
    var svg = d3.select(container)
    .selectAll('circle')
    .data(uniqueNodes)

    svg
      .enter()
      .append("circle")
      .attr("cx", (d, i) => values[i])
      .attr("cy", height)
      .attr("r", props.graphOptions.nodeRadius)
      .style("fill", props.parsedData.hexColors.nodeColor)
      .attr("id", (d, i) => uniqueNodes[i].id)
      .attr("name", (d, i) => uniqueNodes[i].name);

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
        return ['M', start, height,
            'A',
            (start - end) / 2, ',',
            (start - end) / 2, 0, 0, ',',
            start < end ? 1 : 0, end, ',', height
          ]
          .join(' ');
      })
      .style("fill", "none")
      .attr("stroke", props.parsedData.hexColors.linkColor)
      .attr("id", "arc")
      .attr("stroke-width", (l: any) => { return props.graphOptions.normalizeArcs ? l?.sum : props.graphOptions.arcThickness })
      .attr("source", (d, i) => links[i].source)
      .attr("target", (d, i) => links[i].target);

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
      .attr('transform', (d, i) => ("translate(" + values[i] + "," + (height) + ")rotate(-30)"))
      .style("margin-right", "5px")

    // update nodes
    svg
      .attr("r", props.graphOptions.nodeRadius)
      .style("fill", props.parsedData.hexColors.nodeColor)
      .attr("cx", (d, i) => values[i])
      .attr("cy", height)

    // update links
    g
      .attr('d', function (d, i) {
        const start = values[links[i].source]
        const end = values[links[i].target]
        return ['M', start, height,
            'A',
            (start - end) / 2, ',',
            (start - end) / 2, 0, 0, ',',
            start < end ? 1 : 0, end, ',', height
          ]
          .join(' ');
      })
      .attr("stroke", props.parsedData.hexColors.linkColor)
      .attr("stroke-width", (l: any) => { 
        console.log(props.graphOptions.normalizeArcs, props.graphOptions.arcThickness)
        return props.graphOptions.normalizeArcs ? l?.sum : props.graphOptions.arcThickness })

    // update labels
    text
      .attr('transform', (d, i) => ("translate(" + values[i] + "," + (height) + ")rotate(-30)"));


    // highlighting

    var nodes = d3.selectAll("circle")
    var paths = d3.selectAll("path")
    var labels = d3.selectAll("text")
    nodes
      .on("mouseover", function (d) {
        nodes
          .style("opacity", .2)
        d3.select(this)
          .style("opacity", 1)
          .attr("r", 10)
        paths
          .style('stroke', (l: any) => {
            return d.srcElement.id === l?.source || d.srcElement.id === l?.target ? props.parsedData.hexColors.linkColor : props.parsedData.hexColors.linkColor
          })
          .style('stroke-opacity', (l: any) => {
            // why == instead of === idk but works
            return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? 1 : .1
          })

        labels
          .style("font-size", function (label_d: any) {
            return label_d.name === d.srcElement.getAttribute("name") ? 16 : 10
          })
          .style("opacity", function (label_d: any) {
            return label_d.name === d.srcElement.getAttribute("name") ? 1 : .1
          })

      })
      .on('mouseout', function (d) {
        nodes.style('opacity', 1)
          .attr("r", props.graphOptions.nodeRadius)
        paths
          .style('stroke', props.parsedData.hexColors.linkColor)
          .style('stroke-opacity', 1)
          .style('stroke-width', (l: any) => {return props.graphOptions.normalizeArcs ? l?.sum : props.graphOptions.arcThickness})
        labels
          .style("font-size", 10)
          .style("opacity", 1)
      })


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