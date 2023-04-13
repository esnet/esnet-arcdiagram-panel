import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { idToName } from 'utils';
import { getNodeTargets } from 'utils';

import { styles } from 'styles'

let toolTip = {
  source: "",
  target: "",
  sum: "",
  pos: [0,0]
}

function Arc(props: any) {
  let uniqueNodes = props.parsedData.uniqueNodes;
  let links = props.parsedData.links;
  const containerRef = useRef(null),
  gRef = useRef(null),
  labelRef = useRef(null),
  tooltipRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggleTooltip = (isActive: boolean) => {
    setShowTooltip(isActive);
  }

  function updateTooltip(pos: number[], isActive: boolean, sourceId: number,  targetId?: number, sum?:number): void {
    // when only sourceId is passed, display node and its targets
    if(targetId == undefined) {
      toolTip.source = idToName(sourceId,uniqueNodes)
      // get targets for passed nodes as strings
      toolTip.target = getNodeTargets({ id: sourceId, links })
                       .map((id) => idToName(id, uniqueNodes))
                       .join(", ")
      toolTip.sum = ""
    } else {
      toolTip.source = idToName(sourceId,uniqueNodes)
      toolTip.target = idToName(targetId,uniqueNodes)
      toolTip.sum = "Sum: " + String(sum)
    }
    
   
    // toggle tooltip
    handleToggleTooltip(isActive)

    // update position
    var mapBounds = document.querySelectorAll(".panel-container")[0].getBoundingClientRect();
    var offsetY = pos[1] - mapBounds.top
    var offsetX = pos[0] - mapBounds.left
    
    var toolTipDom = document.querySelectorAll(".tooltip")[0];
    var toolTipBounds = toolTipDom.getBoundingClientRect();
    
    var leftOrRight = "left";
    if(offsetX + toolTipBounds.right > mapBounds.right) {
      leftOrRight = "right";
      offsetX = mapBounds.right - pos[0]
    }

    var topOrBottom = "top"
    if(offsetY + toolTipBounds.bottom > mapBounds.bottom) {
      topOrBottom = "bottom";
      offsetY = mapBounds.bottom - pos[1]
    }

    

    toolTipDom.style[topOrBottom] = `${offsetY}px`
    toolTipDom.style[leftOrRight] = `${offsetX}px`
    
    console.log("left ", toolTipDom.style["left"])
    console.log("right ", toolTipDom.style["right"])

  };

  useEffect(() => {
    // removes the graph if it exists in the dom so it gets rendered with updated dimensions
    d3.selectAll("circle, path, text").remove();

  

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
    var offsetBottom = Math.max(...Array.from($("text"), (text) => text.getBoundingClientRect().height));
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
      .attr("stroke", (l: any) => { return  l?.color })
      .attr("id", "arc")
      .attr("stroke-width", (l: any) => { return  l?.strokeWidth })
      .attr("source", (d, i) => links[i].source)
      .attr("target", (d, i) => links[i].target)
      .attr("sum", (d, i) => links[i].sum)
    
    /********************************** Highlighting **********************************/ 
    var nodes = d3.selectAll("circle")
    var paths = d3.selectAll("path")
    var labels = d3.selectAll("text")
    var duration = 200;
    nodes
      .on("mouseover", function (d) {
        // Tooltip
        updateTooltip([d.clientX,d.clientY], true, Number(d.srcElement.id));

        const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links })
        console.log(d)
        nodes
          .style("opacity", ( n: any) => {
            return nodeTargets.includes(n.id) ? 1 : 0.5
          })
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
            return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? 1 : .5
          })
          .attr('stroke-width', (l: any) => {
            return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? l?.strokeWidth*2 : l?.strokeWidth
          })
          .duration(duration)
        labels
          .transition()
          .duration(duration)
          .attr("font-size", function (label_d: any) {
            return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? 16 : 10
          })
          .style("opacity", function (label_d: any) {
            return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? 1 : .1
          })
      })
      .on('mouseout', function (d) {
        handleToggleTooltip(false);
        nodes
          .transition()
          .duration(duration)
          .style('opacity', 1)
        d3.select(this)
          .transition()
          .duration(duration)
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

      /********************************** Link tooltip **********************************/ 

      paths
      .on("mouseover", function (d) {
        updateTooltip([d.clientX,d.clientY], true, Number(d.srcElement.getAttribute("source")), Number(d.srcElement.getAttribute("target")), d.srcElement.getAttribute("sum"));
        paths
          .style("opacity", .1)
          .transition()
          .duration(duration)
        d3.select(this)
          .transition()
          .style('opacity', 1)
          .duration(duration)
      })
      .on('mouseout', function (d) {
        handleToggleTooltip(false);
        paths
          .style("opacity", 1)
          .transition()
          .duration(duration)
        d3.select(this)
          .transition()
          .style('opacity', 1)
          .duration(duration)

      })

  }, [props.graphOptions]);

  return ( 
    <div  style={styles.containerStyle} > 
      <svg style={styles.containerStyle} ref = {containerRef}>
      <g style={styles.containerStyle} ref = {gRef}></g>
      <svg style={styles.containerStyle} ref = {labelRef}></svg>
      </svg>


      {showTooltip && (
        <div ref={tooltipRef} style={styles.toolTipStyle.box} className='tooltip'>
          <p style={styles.toolTipStyle.text} >{toolTip.source}</p>
          <p style={styles.toolTipStyle.text}>{`->`}</p>
          <p style={styles.toolTipStyle.text} >{toolTip.target}</p>

          <p style={styles.toolTipStyle.text} >{toolTip.sum}</p>


        </div>
      )}
    </div> 
  );
}

export default Arc;