import React, { useEffect, useRef, useState, ReactNode } from 'react';
import * as d3 from 'd3';
import { idToName, getNodeTargets, linSpace, resetLabel, replaceEllipsis, evaluateQuery } from 'utils';
import './animation.css'
import { styles } from 'styles'

let toolTip = {
  source: "",
  target: <p></p> as ReactNode,
  sum: "",
  field: <p></p> as ReactNode,
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

  function updateTooltip(pos: number[], isActive: boolean, sourceId: number,  targetId?: number, displayValue?: string): void {
    
    // when only sourceId is passed, display node and its targets
    if(targetId === undefined) {
      toolTip.source = idToName(sourceId,uniqueNodes)
      // get targets for passed nodes as strings
      toolTip.target = getNodeTargets({ id: sourceId, links })
                       .map((id) => idToName(id, uniqueNodes))
                       .filter((value, index, array) => array.indexOf(value) === index)
                       .map((string, index) => (
                        <p style={styles.toolTipStyle.text} key={index}>
                          {string}
                          <br />
                        </p>
                       ))     
      // reset metric and field  
      toolTip.sum = ""
      toolTip.field = <p></p>
    } else {
      toolTip.source = idToName(sourceId,uniqueNodes)
      toolTip.target =  <p style={styles.toolTipStyle.text}>{idToName(targetId,uniqueNodes)}</p>
      toolTip.sum = displayValue!
      toolTip.field = <p><b style={styles.toolTipStyle.preface}>{props.parsedData.additionalField}</b>{links.find((item: { source: any; target: any; }) => item.source === sourceId && item.target === targetId).field
                      .map((string: any, index: number) => (
                        <p style={styles.toolTipStyle.text} key={index}>
                          {string}
                          <br />
                        </p>
                      ))}
                      </p>
    }
   
    // toggle tooltip
    handleToggleTooltip(isActive)

    // update position
    const mapBounds = document.querySelectorAll(".panel-container")[0].getBoundingClientRect();
    let offsetY = pos[1] - mapBounds.top,
    offsetX = pos[0] - mapBounds.left
    
    const toolTipDom = document.querySelectorAll(".tooltip")[0] as HTMLElement,
    toolTipBounds = toolTipDom.getBoundingClientRect();
    
    let leftOrRight = "left";
    if(offsetX + toolTipBounds.right > mapBounds.right) {
      leftOrRight = "right";
      offsetX = mapBounds.right - pos[0]
    }

    let topOrBottom = "top"

    if((offsetY + toolTipBounds.bottom-350 > mapBounds.bottom)) {
      topOrBottom = "bottom";
      offsetY = mapBounds.bottom - pos[1]
    }
    
    if (topOrBottom === "top") {
      toolTipDom.style.top = `${offsetY}px`;
    } else {
      toolTipDom.style.bottom = `${offsetY}px`;
    }
    
    if (leftOrRight === "left") {
      toolTipDom.style.left = `${offsetX}px`;
    } else {
      toolTipDom.style.right = `${offsetX}px`;
    }

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
    const text = d3.select(labelBox)
      .selectAll('text')
      .data(uniqueNodes)

    text
      .enter()
      .append("text")
      // if node has large radius, offset the label for readability
      .attr("x", (d: any) => { return uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius >= 5 ? -(uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius*2) : -10 })
      .attr("y", (d: any) => { return uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius >= 5 ? (uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius*2) : 10 })
      .text((d, i) => uniqueNodes[i].name)
      .style("text-anchor", "end")
      .attr('fill', () => {return props.isDarkMode ? "white" : "black"})
      .attr('font-size', 10)
      .attr('transform', (d, i) => ("translate(" + 0 + "," + (height) + ")rotate(-45)"))
      .style("margin-right", "5px")
      .attr('name', (d, i) => { return uniqueNodes[i].name})
      .attr('id', (d, i) => { return i})

    // after the labels are rendered, we can find out the amount of margin we need to apply
    // from the bottom and left so that the diagram is readable. The amount is being calculated from
    // the boundingbox of the largest highlighted label and the most left label
    let offsetBottom = Math.max(...Array.from($("text"), (text) => text.getBoundingClientRect().height));
    // Map to highlighted labels (size increases by 60%)
    offsetBottom*=1.6

    // get array of equally spaced values for positioning of graph on x axis
    const values = linSpace(50, width-50, uniqueNodes.length);

    // Update the labels position
    d3.selectAll("text")
    .attr('transform', (d, i) => ("translate(" + values[i] + "," + (height-offsetBottom) + ")rotate(-45)"))

    // check if label is out of bounds
    const labelsAsHtml = document.getElementsByTagName("text")
    Array.from(labelsAsHtml).forEach(element => {
      replaceEllipsis(element, false)
    });

    if(props.graphOptions.search) {evaluateQuery(props.query,uniqueNodes, labelsAsHtml)}

    // render nodes
    const svg = d3.select(container)
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
    const g = d3.select(graph)
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
      .style("stroke-opacity", props.graphOptions.arcOpacity)
      .attr("source", (d, i) => links[i].source)
      .attr("target", (d, i) => links[i].target)
      .attr("sum", (d, i) => links[i].sum)
      .attr("displayValue", (d, i) => links[i].displayValue)
    
    /********************************** Highlighting **********************************/ 
    const nodes = d3.selectAll("circle")
    const paths = d3.selectAll("path")
    const labels = d3.selectAll("text")
    const duration = 200;
    nodes
      .on("mouseover", function (d) {
        // Tooltip
        updateTooltip([d.clientX,d.clientY], true, Number(d.srcElement.id));
        labelsAsHtml[d.srcElement.id].setAttribute("name", labelsAsHtml[d.srcElement.id].innerHTML)
        const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links })
        // add ellipsis for node being hovered over & target nodes
        replaceEllipsis(labelsAsHtml[d.srcElement.id],true)
        nodeTargets.forEach(e => {
          replaceEllipsis(labelsAsHtml[e],true)
        })
        nodes
          .style("opacity", ( n: any) => {
            return nodeTargets.includes(n.id) ? 1 : 0.5
          })
          .transition()
          .attr("r", (n: any) => {
            return nodeTargets.includes(n.id) ? uniqueNodes[n.id].radius*2 : uniqueNodes[n.id].radius
          } )
          .duration(duration)
        d3.select(this)
          .style("opacity", 1)
          .transition()
          .duration(duration)
          .attr("r", uniqueNodes[d.srcElement.id].radius*2)
        paths
          .transition()
          .style('stroke-opacity', (l: any) => {
            /* eslint-disable eqeqeq */
            return d.srcElement.id == l?.source ? props.graphOptions.arcOpacity : props.graphOptions.arcOpacity*.5
          })
          .attr('stroke-width', (l: any) => {
            /* eslint-disable eqeqeq */
            return d.srcElement.id == l?.source ? l?.strokeWidth*2 : l?.strokeWidth
          })
          .duration(duration)
        labels
          .transition()
          .duration(duration)
          .attr("font-size", (label_d: any) => {
            return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? 16 : 10
          })
          .style("opacity", (label_d: any) => {
            return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? 1 : .1
          })
      })
      .on('mouseout', function (d) {
        const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links })
        resetLabel(labelsAsHtml[d.srcElement.id])
        nodeTargets.forEach(e => {
          resetLabel(labelsAsHtml[e])
        })
        handleToggleTooltip(false);
        nodes
          .transition()
          .duration(duration)
          .attr("r", (n: any) => {
            return uniqueNodes[n.id].radius
          } )
          .style('opacity', 1)
        d3.select(this)
          .transition()
          .duration(duration)
          .attr("r", uniqueNodes[d.srcElement.id].radius)
        paths
          .transition()
          .duration(duration)
          .style('stroke-opacity', props.graphOptions.arcOpacity)
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
        updateTooltip([d.clientX,d.clientY], true, Number(d.srcElement.getAttribute("source")), Number(d.srcElement.getAttribute("target")), d.srcElement.getAttribute("displayValue"));
        paths
          .style("opacity", props.graphOptions.arcOpacity*0.5)
          .transition()
          .duration(duration)
        d3.select(this)
          .transition()
          .style('opacity', props.graphOptions.arcOpacity)
          .duration(duration)
      })
      .on('mouseout', function (d) {
        handleToggleTooltip(false);
        paths
          .style("opacity", props.graphOptions.arcOpacity)
          .transition()
          .duration(duration)
        d3.select(this)
          .transition()
          .style('opacity', props.graphOptions.arcOpacity)
          .duration(duration)
      })
  /* eslint-disable react-hooks/exhaustive-deps */
  }, [props.graphOptions, links, props.height, props.parsedData.hexColors.nodeColor, props.width, uniqueNodes]);

  return ( 
    <div  style={styles.containerStyle} > 
      <svg style={styles.containerStyle} ref = {containerRef}>
        <g style={styles.containerStyle} ref = {gRef}></g>
        <svg style={styles.labelStyle} ref = {labelRef}></svg>
      </svg>

      {showTooltip && (
        <div ref={tooltipRef} style={styles.toolTipStyle.box} className='tooltip'>
          <p style={styles.toolTipStyle.text} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipSource}</b> {" "}{toolTip.source}</p>
          <div style={styles.toolTipStyle.text} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipTarget}</b>{toolTip.target}</div>

          <p style={styles.toolTipStyle.text} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipMetric}</b> {toolTip.sum}</p>

          <p style={styles.toolTipStyle.text} > {toolTip.field}</p>
        </div>
      )}
    </div> 
  );
}


export default Arc;
