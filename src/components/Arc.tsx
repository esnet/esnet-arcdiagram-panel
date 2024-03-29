import React, { useEffect, useRef, useState, ReactNode } from 'react';
import * as d3 from 'd3';
import { idToName, getNodeTargets, linSpace, resetLabel, replaceEllipsis, evaluateQuery, handleZoom, getQueryMatches, calcBottomOffset } from 'utils';
import '../styles.css'
import { styles } from 'styles'
import { locationService } from '@grafana/runtime';
let toolTip = {
  source: "",
  target: <p></p> as ReactNode,
  field: <p></p> as ReactNode,
  pos: [0,0]
}

function Arc(props: any) {
  let isEdit = locationService.getSearchObject().editPanel !== undefined;
  let firstRender = false;

    if(!isEdit) {
      localStorage.setItem("this", "true")
    }

    if(localStorage.getItem("this") ===  "true" && isEdit) {
      firstRender = true;
    }
    
    if(isEdit){
      localStorage.setItem("this", "false")
    }

  
  let uniqueNodes = props.parsedData.uniqueNodes;
  let links = props.parsedData.links;
  const containerRef = useRef(null),
  gRef = useRef(null),
  labelRef = useRef(null),
  tooltipRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false)

  const handleToggleTooltip = (isActive: boolean) => {
    setShowTooltip(isActive);
  }

  function updateTooltip(pos: number[], isActive: boolean, sourceId: number,  targetId?: number, displayValue?: string, linkId?: number): void {
    
    // when only sourceId is passed, display node and its targets
    if(targetId === undefined) {
      toolTip.source = idToName(sourceId,uniqueNodes)
      // get targets for passed nodes as strings
      const nodeTargets = getNodeTargets({ id: sourceId, links })
      if(nodeTargets.length > 1) {
        toolTip.target = nodeTargets
                        .map((id) => idToName(id, uniqueNodes))
                        .filter((value, index, array) => array.indexOf(value) === index)
                        .map((string, index) => (
                          <p style={styles.toolTipStyle.text(props.zoom)} key={index}>
                            {string}
                            <br />
                          </p>
                        ))
      } else if (nodeTargets.length === 1) {
        toolTip.target = idToName(nodeTargets[0], uniqueNodes)
      } else {
        toolTip.target = "";
      }
      if(props.graphOptions.isCluster) {
        toolTip.field = <p><b style={styles.toolTipStyle.preface}>Cluster: </b> {uniqueNodes[sourceId].cluster}</p>
      } else {
        toolTip.field = <p><b style={styles.toolTipStyle.preface}>Weight: </b>{uniqueNodes[sourceId].sum}</p>
      }
    } else {
      toolTip.source = idToName(sourceId,uniqueNodes)
      toolTip.target = idToName(targetId,uniqueNodes)
     
      const hoverLink = (links.find((item: { source: any; target: any; }) => item.source === sourceId && item.target === targetId))
      toolTip.field = props.parsedData.fields.map((field: any, index: number) => (    
                        <p key={index}><b style={styles.toolTipStyle.preface}>{field.displayName}:</b>
                        {hoverLink[`${field.field}Display`].map((string: any, index: number) => (
                              <p style={styles.toolTipStyle.text(props.zoom)} key={index}>
                                {string}
                                <br />
                              </p>
                            ))
                          }
                        </p>
                      ))
    }
   
    // toggle tooltip
    handleToggleTooltip(isActive)

    // update position
    const panelContainer = document.querySelectorAll(`[data-panelid="${props.panelId}"]`)[0]
    if(panelContainer !== undefined) {
      const mapBounds = panelContainer.getBoundingClientRect();
      let offsetY = pos[1] - mapBounds.top,
      offsetX = pos[0] - mapBounds.left
      
      const toolTipDom = document.querySelectorAll("#tooltip")[0] as HTMLElement,
      toolTipBounds = toolTipDom.getBoundingClientRect();
      
      let leftOrRight = "left";
      if(offsetX + toolTipBounds.right > mapBounds.right) {
        leftOrRight = "right";
        offsetX = mapBounds.right - pos[0]
      }
    
      let topOrBottom = "top" 
      // add margin of 31.99px
      if(toolTipBounds.height+pos[1]+31.99 > mapBounds.bottom) {
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
    }
  };

  useEffect(() => {

    // removes the graph if it exists in the dom so it gets rendered with updated dimensions
    d3.selectAll(`[data-panelid="${props.panelId}"] circle, [data-panelid="${props.panelId}"] path, [data-panelid="${props.panelId}"] text`).remove();
    

    const width = props.width,
    height = props.height

    const container = containerRef.current,
    graph = gRef.current,
    labelBox = labelRef.current;

    // render labels
    const text = d3.select(labelBox)
      .selectAll(`[data-panelid="${props.panelId}"] text`)
      .data(uniqueNodes)

    text
      .enter()
      .append("text")
      // if node has large radius, offset the label for readability
      .attr("x", (d: any) => { return uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius >= 7 ? -(uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius*1.6) : -10 })
      .attr("y", (d: any) => { return uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius >= 7 ? (uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius*0.8) : 10 })
      .text((d, i) => uniqueNodes[i].name)
      .style("text-anchor", "end")
      .attr('fill', () => {return props.isDarkMode ? "white" : "black"})
      .attr('font-size', props.graphOptions.fontSize)
      .attr('transform', (d, i) => ("translate(" + 0 + "," + (height) + ")rotate(-45)"))
      .style("margin-right", "5px")
      .attr('name', (d, i) => { return uniqueNodes[i].name })
      .attr('id', (d, i) => { return i })


    // get array of equally spaced values for positioning of graph on x axis
    let values = linSpace(props.graphOptions.marginLeft, width-props.graphOptions.marginRight, uniqueNodes.length);
    
    let labelsAsHtml = document.querySelectorAll(`[data-panelid="${props.panelId}"] text`)

    let offsetBottom = calcBottomOffset(labelsAsHtml)

      // Update the labels position
        d3.selectAll(`[data-panelid="${props.panelId}"] text`)
      .attr('transform', (d, i) => {
          return (
            "translate(" + values[i] + "," + (height-offsetBottom) + ")rotate(-45)")
      })
      
    // check if label is out of bounds
    Array.from(labelsAsHtml).forEach(element => {
      replaceEllipsis(element, false)
    });
    
    // render nodes
    const svg = d3.select(container)
    .selectAll(`[data-panelid="${props.panelId}"] circle`)
    .data(uniqueNodes)

    svg
      .enter()
      .append("circle")
      .attr("cx", (d, i) => {
        return values[i]
      })
      .attr("cy", height-offsetBottom)
      .attr("r", (n: any) => { return  n?.radius })
      .style("fill", (d, i) => uniqueNodes[i].color)
      .attr("id", (d, i) => uniqueNodes[i].id)
      .attr("name", (d, i) => uniqueNodes[i].name)
      .attr("radius", (d, i) => uniqueNodes[i].radius);

    // render links
    const g = d3.select(graph)
      .selectAll(`[data-panelid="${props.panelId}"] path`)
      .data(links)

    g
      .enter()
      .append('path')
      .attr('d', function (d, i) {
        const start = values[links[i].source]
        const end = values[links[i].target]

        const radiusX = Math.abs(start - end) / 2; // X-axis radius
        let radiusY = radiusX * props.graphOptions.arcHeight; // Y-axis radius, multiply with linkHeight to get elliptical shape
        if(props.graphOptions.hopMode) {
          if(links[i].isOverlap) { radiusY = radiusX * links[i].mapRadiusY }
        }
        const largeArcFlag = Math.abs(start - end) > Math.PI ? 1 : 0; // Determines whether the arc should be greater than or less than 180 degrees
        return [
          'M', start, height - offsetBottom,
          'A', radiusX, ',', radiusY, 0, largeArcFlag, ',', start < end ? 1 : 0, end, ',', height - offsetBottom
        ]
        .join(' ');
      })
      .style("fill", "none")
      .attr("stroke", (l: any) => { return  l?.color })
      .attr("id", (d, i) => links[i].id)
      .attr("stroke-width", (l: any) => { return  l?.strokeWidth })
      .style("opacity", props.graphOptions.arcOpacity)
      .attr("source", (d, i) => links[i].source)
      .attr("target", (d, i) => links[i].target)
      .attr("sum", (d, i) => links[i].sum)
      .attr("displayValue", (d, i) => links[i].displayValue)
      .attr("path", (d, i) => links[i].path)

    let nodes = d3.selectAll(`[data-panelid="${props.panelId}"] circle`)
    let paths = d3.selectAll(`[data-panelid="${props.panelId}"] path`)
    let labels = d3.selectAll(`[data-panelid="${props.panelId}"] text`)
    const duration = 200;

    const isQuery = props.query.length !==0
    const queryMatches = getQueryMatches(props.query, uniqueNodes)

    function highlighting() {
      /********************************** Highlighting **********************************/ 

      if(firstRender) {
        nodes = d3.selectAll(`[data-panelid="${props.panelId}"] circle`)
        paths = d3.selectAll(`[data-panelid="${props.panelId}"] path`)
        labels = d3.selectAll(`[data-panelid="${props.panelId}"] text`)
      }

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
              if(isQuery) {
                return queryMatches.has(n.id) ? 1 : 0.1
              } else {
                return nodeTargets.includes(n.id) ? 1 : 0.1
              }
              
            })
            .transition()
            .attr("r", (n: any) => {
              if(isQuery) {
                return uniqueNodes[n.id].radius
              } else {
                return nodeTargets.includes(n.id) ? uniqueNodes[n.id].radius*2 : uniqueNodes[n.id].radius
              }  
            })
            .duration(duration)
          d3.select(this)
            .style("opacity", 1)
            .transition()
            .duration(duration)
            .attr("r", uniqueNodes[d.srcElement.id].radius*2)
          paths
            .transition()
            .style('opacity', (l: any) => {
              if(isQuery) {
                return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : .1
              } else {
                /* eslint-disable eqeqeq */
                return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? props.graphOptions.arcOpacity : .1
              }  
            })
            .attr('stroke-width', (l: any) => {
              /* eslint-disable eqeqeq */
              return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? l?.strokeWidth*2 : l?.strokeWidth
            })
            .duration(duration)
          labels
            .transition()
            .duration(duration)
            .attr("font-size", (label_d: any) => {
              if(isQuery) {
                return label_d.name === d.srcElement.getAttribute("name") ? props.graphOptions.fontSize*1.6 : props.graphOptions.fontSize
              } else {
                return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? props.graphOptions.fontSize*1.6 : props.graphOptions.fontSize
              }
            })
            .style("opacity", (label_d: any) => {
              if(isQuery) {
                return label_d.name === d.srcElement.getAttribute("name") ? 1 : .1
              } else {
                return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? 1 : .1
              }
            })
        })
        .on('mouseout', function (d) {
          const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links })
          replaceEllipsis(labelsAsHtml[d.srcElement.id], false)
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
            })
            .style("opacity",(n: any) => {
              if(isQuery) {
                return queryMatches.has(n.id) ? 1 : .1
              } else {
                return 1
              }
            })
          d3.select(this)
            .transition()
            .duration(duration)
            .attr("r", uniqueNodes[d.srcElement.id].radius)
          paths
            .transition()
            .duration(duration)
            .style("opacity",(l: any) => {
              if(isQuery) {
                return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : .1
              } else {
                return props.graphOptions.arcOpacity
              }
            })
            .attr('stroke-width', (l: any) => {
              return l?.strokeWidth
            })
          labels
            .transition()
            .duration(duration)
            .attr("font-size", props.graphOptions.fontSize)
            .style("opacity",(l: any) => {
              if(isQuery) {
                return queryMatches.has(l.id) ? 1 : .1
              } else {
                return 1
              }
            })
        })
    }
    highlighting()
    
    function toolTip() {
      /********************************** Link tooltip **********************************/ 

      if(firstRender) {
        nodes = d3.selectAll(`[data-panelid="${props.panelId}"] circle`)
        paths = d3.selectAll(`[data-panelid="${props.panelId}"] path`)
        labels = d3.selectAll(`[data-panelid="${props.panelId}"] text`)
      }
      
      paths
      .on("mouseover", function (d) {
        updateTooltip([d.clientX,d.clientY], true, Number(d.srcElement.getAttribute("source")), Number(d.srcElement.getAttribute("target")), d.srcElement.getAttribute("displayValue"), d.srcElement.id);
        paths
          .style("opacity",(l: any) => {
            if(isQuery) {
              return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : .1
            } else if (props.graphOptions.hopMode) {
              return Number(d.srcElement.getAttribute("path")) === l.path ? props.graphOptions.arcOpacity : .1
            } else {
              return .1
            }
          })
          .transition()
          .duration(duration)
        d3.select(this)
          .transition()
          .style("opacity", props.graphOptions.arcOpacity) 
          .duration(duration)
      })
      .on('mouseout', function (d) {
        handleToggleTooltip(false);
        paths
          .transition()
          .duration(duration)
          .style("opacity",(l: any) => {
            if(isQuery) {
              return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : .1
            } else {
              return props.graphOptions.arcOpacity
            }
          })
          .attr('stroke-width', (l: any) => {
            return l?.strokeWidth
          })
        d3.select(this)
          .transition()
          .style("opacity",(l: any) => {
            if(isQuery) {
              return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : .1
            } else {
              return props.graphOptions.arcOpacity
            }
          })
          .duration(duration)
          .attr('stroke-width', (l: any) => {
            return l?.strokeWidth
          })
      })    
    }

    toolTip()
      

    if(props.graphOptions.search && isQuery) {evaluateQuery(props.query,uniqueNodes, labels, paths, nodes, props.graphOptions.arcOpacity)}

    // edge case for rendering the graph on first render when editing editMode
    if(firstRender) {
      setTimeout( () => {

        let newValues = [...values, ...values]

        // render labels
        const text = d3.select(labelBox)
        .selectAll(`[data-panelid="${props.panelId}"] text`)
        .data(uniqueNodes)

        text
          .enter()
          .append("text")
          // if node has large radius, offset the label for readability
          .attr("x", (d: any) => { return uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius >= 7 ? -(uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius*1.6) : -10 })
          .attr("y", (d: any) => { return uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius >= 7 ? (uniqueNodes.find((e: { id: any; }) => e.id === d.id).radius*0.8) : 10 })
          .text((d, i) => uniqueNodes[i].name)
          .style("text-anchor", "end")
          .attr('fill', () => {return props.isDarkMode ? "white" : "black"})
          .attr('font-size', props.graphOptions.fontSize)
          .attr('transform', (d, i) => ("translate(" + 0 + "," + (height) + ")rotate(-45)"))
          .style("margin-right", "5px")
          .attr('name', (d, i) => { return uniqueNodes[i].name })
          .attr('id', (d, i) => { return i })

        labelsAsHtml = document.querySelectorAll(`[data-panelid="${props.panelId}"] text`)
        offsetBottom = calcBottomOffset(labelsAsHtml)
        const offsetFirstRender = 40


        // Update the labels position
        d3.selectAll(`[data-panelid="${props.panelId}"] text`)
        .attr('transform', (d, i) => {
            return (
              "translate(" + newValues[i] + "," + (height-offsetBottom-offsetFirstRender) + ")rotate(-45)")
        })

            // check if label is out of bounds
        Array.from(labelsAsHtml).forEach(element => {
          replaceEllipsis(element, false)
        });

        // render nodes
        const svg = d3.select(container)
        .selectAll(`[data-panelid="${props.panelId}"] circle`)
        .data(uniqueNodes)

        svg
          .enter()
          .append("circle")
          .attr("cx", (d, i) => {
            return values[i]
          })
          .attr("cy", height-offsetBottom-offsetFirstRender)
          .attr("r", (n: any) => { return  n?.radius })
          .style("fill", (d, i) => uniqueNodes[i].color)
          .attr("id", (d, i) => uniqueNodes[i].id)
          .attr("name", (d, i) => uniqueNodes[i].name)
          .attr("radius", (d, i) => uniqueNodes[i].radius);

        

        const g = d3.select(graph)
        .selectAll(`[data-panelid="${props.panelId}"] path`)
        .data(links)

        g
          .enter()
          .append('path')
          .attr('d', function (d, i) {
            const start = values[links[i].source]
            const end = values[links[i].target]

            const radiusX = Math.abs(start - end) / 2; // X-axis radius
            let radiusY = radiusX * props.graphOptions.arcHeight; // Y-axis radius, multiply with linkHeight to get elliptical shape
            if(props.graphOptions.hopMode) {
              if(links[i].isOverlap) { radiusY = radiusX * links[i].mapRadiusY }
            }
            const largeArcFlag = Math.abs(start - end) > Math.PI ? 1 : 0; // Determines whether the arc should be greater than or less than 180 degrees
            return [
              'M', start, height - offsetBottom - offsetFirstRender,
              'A', radiusX, ',', radiusY, 0, largeArcFlag, ',', start < end ? 1 : 0, end, ',', height - offsetBottom - offsetFirstRender
            ]
            .join(' ');
          })
          .style("fill", "none")
          .attr("stroke", (l: any) => { return  l?.color })
          .attr("id", (d, i) => links[i].id)
          .attr("stroke-width", (l: any) => { return  l?.strokeWidth })
          .style("opacity", props.graphOptions.arcOpacity)
          .attr("source", (d, i) => links[i].source)
          .attr("target", (d, i) => links[i].target)
          .attr("sum", (d, i) => links[i].sum)
          .attr("displayValue", (d, i) => links[i].displayValue)
          .attr("path", (d, i) => links[i].path)

          

          toolTip()

          highlighting()
      }, 100)
    }

  /* eslint-disable react-hooks/exhaustive-deps */
  }, [links, props.height, props.width, uniqueNodes]);

  if(document.querySelectorAll(`[data-panelid="${props.panelId}"] #canvas`)[0] !== undefined) {
    handleZoom(document.querySelectorAll(`[data-panelid="${props.panelId}"] #canvas`)[0] as HTMLElement, props.zoomState)
  }
  
  return (       
      <div style={styles.containerStyle}>
        <div id={"canvas"} style={styles.containerStyle} > 
          <svg style={styles.containerStyle} ref = {containerRef}>
            <g style={styles.containerStyle} ref = {gRef}></g>
            <svg style={styles.labelStyle} ref = {labelRef}></svg>
          </svg>

        </div> 
        {showTooltip && (
          <div ref={tooltipRef} style={styles.toolTipStyle.box} id='tooltip'>
            <p style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize)} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipSource}</b> {" "}{toolTip.source}</p>
            <br/>
            <div style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize)} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipTarget}</b>{toolTip.target}</div>
            <br/>
            <p style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize)} > {toolTip.field}</p>
          </div>
        )}
      </div>      
  );
}


export default Arc;


