import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  // idToName,
  getNodeTargets,
  linSpace,
  resetLabel,
  replaceEllipsis,
  evaluateQuery,
  handleZoom,
  getQueryMatches,
  calcBottomOffset,
} from 'utils';
import '../styles.css';
import { styles } from 'styles';
import { locationService } from '@grafana/runtime';
import { Tooltip } from './Tooltip';
import sanitizeHtml from 'sanitize-html';

// let toolTip = {
//   source: '',
//   target: (<p></p>) as ReactNode,
//   field: (<p></p>) as ReactNode,
//   pos: [0, 0],
// };

function Arc(props: any) {
  let panelId = props.panelId;
  let isEdit = locationService.getSearchObject().editPanel !== undefined;
  let firstRender = false;
  let tooltip;

  if (!isEdit) {
    localStorage.setItem('this', 'true');
  }

  if (localStorage.getItem('this') === 'true' && isEdit) {
    firstRender = true;
  }

  if (isEdit) {
    localStorage.setItem('this', 'false');
  }

  let uniqueNodes = props.parsedData.uniqueNodes;
  let links = props.parsedData.links;
  const containerRef = useRef(null),
    gRef = useRef(null),
    labelRef = useRef(null);

  useEffect(() => {
    // removes the graph if it exists in the dom so it gets rendered with updated dimensions
    d3.selectAll(
      `circle.node-panel-${panelId} , path.path-panel-${panelId}, text.text-panel-${panelId}`
    ).remove();

    const width = props.width,
      height = props.height;

    const container = containerRef.current,
      graph = gRef.current,
      labelBox = labelRef.current;

    // render labels
    const text = d3.select(labelBox).selectAll(`text.text-panel-${panelId}`).data(uniqueNodes);

    text
      .enter()
      .append('text')
      .attr('class', `text-panel-${panelId}`)
      // if node has large radius, offset the label for readability
      .attr('x', (d: any) => {
        return uniqueNodes.find((e: { id: any }) => e.id === d.id).radius >= 7
          ? -(uniqueNodes.find((e: { id: any }) => e.id === d.id).radius * 1.6)
          : -10;
      })
      .attr('y', (d: any) => {
        return uniqueNodes.find((e: { id: any }) => e.id === d.id).radius >= 7
          ? uniqueNodes.find((e: { id: any }) => e.id === d.id).radius * 0.8
          : 10;
      })
      .text((d, i) => sanitizeHtml(uniqueNodes[i].name))
      .style('text-anchor', 'end')
      .attr('fill', () => {
        return props.isDarkMode ? 'white' : 'black';
      })
      .attr('font-size', props.graphOptions.fontSize)
      .attr('transform', (d, i) => 'translate(' + 0 + ',' + height + ')rotate(-45)')
      .style('margin-right', '5px')
      .attr('name', (d, i) => {
        return uniqueNodes[i].name;
      })
      .attr('id', (d, i) => {
        return i;
      });

    // get array of equally spaced values for positioning of graph on x axis
    let values = linSpace(props.graphOptions.marginLeft, width - props.graphOptions.marginRight, uniqueNodes.length);

    let labelsAsHtml = document.querySelectorAll(`text.text-panel-${panelId}`);
    let offsetBottom = calcBottomOffset(labelsAsHtml);

    // Update the labels position
    d3.selectAll(`text.text-panel-${panelId}`).attr('transform', (d, i) => {
      return 'translate(' + values[i] + ',' + (height - offsetBottom) + ')rotate(-45)';
    });

    // check if label is out of bounds
    Array.from(labelsAsHtml).forEach((element) => {
      replaceEllipsis(element, false);
    });

    // render tooltip

    tooltip = d3
      .select(container)
      .append('div')
      .attr('class', `matrix-tooltip-${panelId}`)
      .style('opacity', 0);

    // render nodes
    const svg = d3.select(container).selectAll(`circle.node-panel-${panelId}`).data(uniqueNodes);

    svg
      .enter()
      .append('circle')
      .attr('class',`node-panel-${panelId}`)
      .attr('cx', (d, i) => {
        return values[i];
      })
      .attr('cy', height - offsetBottom)
      .attr('r', (n: any) => {
        return n?.radius;
      })
      .style('fill', (d, i) => uniqueNodes[i].color)
      .attr('id', (d, i) => uniqueNodes[i].id)
      .attr('name', (d, i) => uniqueNodes[i].name)
      .attr('radius', (d, i) => uniqueNodes[i].radius);

    // render links
    const g = d3.select(graph).selectAll(`path.path-panel-${panelId}`).data(links);

    g.enter()
      .append('path')
      .attr('class', `path-panel-${panelId}`)
      .attr('d', function (d, i) {
        const start = values[links[i].source];
        const end = values[links[i].target];

        const radiusX = Math.abs(start - end) / 2; // X-axis radius
        let radiusY = radiusX * props.graphOptions.arcHeight; // Y-axis radius, multiply with linkHeight to get elliptical shape
        if (props.graphOptions.hopMode) {
          if (links[i].isOverlap) {
            radiusY = radiusX * links[i].mapRadiusY;
          }
        }
        const largeArcFlag = Math.abs(start - end) > Math.PI ? 1 : 0; // Determines whether the arc should be greater than or less than 180 degrees
        return [
          'M',
          start,
          height - offsetBottom,
          'A',
          radiusX,
          ',',
          radiusY,
          0,
          largeArcFlag,
          ',',
          start < end ? 1 : 0,
          end,
          ',',
          height - offsetBottom,
        ].join(' ');
      })
      .style('fill', 'none')
      .attr('stroke', (l: any) => {
        return l?.color;
      })
      .attr('id', (d, i) => links[i].id)
      .attr('stroke-width', (l: any) => {
        return l?.strokeWidth;
      })
      .style('opacity', props.graphOptions.arcOpacity)
      .attr('source', (d, i) => links[i].source)
      .attr('target', (d, i) => links[i].target)
      .attr('sum', (d, i) => links[i].sum)
      .attr('displayValue', (d, i) => links[i].displayValue)
      .attr('path', (d, i) => links[i].path);

    let nodes = d3.selectAll(`circle.node-panel-${panelId}`);
    let paths = d3.selectAll(`path.path-panel-${panelId}`);
    let labels = d3.selectAll(`text.text-panel-${panelId}`);
    const duration = 200;

    const isQuery = props.query.length !== 0;
    const queryMatches = getQueryMatches(props.query, uniqueNodes);

    function highlighting() {
      /********************************** Highlighting **********************************/

      if (firstRender) {
        nodes = d3.selectAll(`circle.node-panel-${panelId}`);
        paths = d3.selectAll(`path.path-panel-${panelId}`);
        labels = d3.selectAll(`text.text-panel-${panelId}`);
      }
      // highlight node and all paths connected to that node
      nodes
        .on('mouseover', function (d) {
          const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links });
          // add ellipsis for node being hovered over & target nodes
          replaceEllipsis(labelsAsHtml[d.srcElement.id], true);
          nodeTargets.forEach((e) => {
            replaceEllipsis(labelsAsHtml[e], true);
          });
          nodes
            .style('opacity', (n: any) => {
              if (isQuery) {
                return queryMatches.has(n.id) ? 1 : 0.1;
              } else {
                return nodeTargets.includes(n.id) ? 1 : 0.1;
              }
            })
            .transition()
            .attr('r', (n: any) => {
              if (isQuery) {
                return uniqueNodes[n.id].radius;
              } else {
                return nodeTargets.includes(n.id) ? uniqueNodes[n.id].radius * 2 : uniqueNodes[n.id].radius;
              }
            })
            .duration(duration);
          d3.select(this)
            .style('opacity', 1)
            .transition()
            .duration(duration)
            .attr('r', uniqueNodes[d.srcElement.id].radius * 2);
          paths
            .transition()
            .style('opacity', (l: any) => {
              if (isQuery) {
                return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : 0.1;
              } else {
                /* eslint-disable eqeqeq */
                return d.srcElement.id == l?.source || d.srcElement.id == l?.target
                  ? props.graphOptions.arcOpacity
                  : 0.1;
              }
            })
            .attr('stroke-width', (l: any) => {
              /* eslint-disable eqeqeq */
              return d.srcElement.id == l?.source || d.srcElement.id == l?.target ? l?.strokeWidth * 2 : l?.strokeWidth;
            })
            .duration(duration);
          labels
            .transition()
            .duration(duration)
            .attr('font-size', (label_d: any) => {
              if (isQuery) {
                return label_d.name === d.srcElement.getAttribute('name')
                  ? props.graphOptions.fontSize * 1.6
                  : props.graphOptions.fontSize;
              } else {
                return label_d.name === d.srcElement.getAttribute('name') || nodeTargets.includes(label_d.id)
                  ? props.graphOptions.fontSize * 1.6
                  : props.graphOptions.fontSize;
              }
            })
            .style('opacity', (label_d: any) => {
              if (isQuery) {
                return label_d.name === d.srcElement.getAttribute('name') ? 1 : 0.1;
              } else {
                return label_d.name === d.srcElement.getAttribute('name') || nodeTargets.includes(label_d.id) ? 1 : 0.1;
              }
            });
        })
        .on('mouseout', function (d) {
          const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links });
          replaceEllipsis(labelsAsHtml[d.srcElement.id], false);
          resetLabel(labelsAsHtml[d.srcElement.id]);
          nodeTargets.forEach((e) => {
            resetLabel(labelsAsHtml[e]);
          });
          // handleToggleTooltip(false);
          nodes
            .transition()
            .duration(duration)
            .attr('r', (n: any) => {
              return uniqueNodes[n.id].radius;
            })
            .style('opacity', (n: any) => {
              if (isQuery) {
                return queryMatches.has(n.id) ? 1 : 0.1;
              } else {
                return 1;
              }
            });
          d3.select(this).transition().duration(duration).attr('r', uniqueNodes[d.srcElement.id].radius);
          paths
            .transition()
            .duration(duration)
            .style('opacity', (l: any) => {
              if (isQuery) {
                return queryMatches.has(l.source) || queryMatches.has(l.target) ? props.graphOptions.arcOpacity : 0.1;
              } else {
                return props.graphOptions.arcOpacity;
              }
            })
            .attr('stroke-width', (l: any) => {
              return l?.strokeWidth;
            });
          labels
            .transition()
            .duration(duration)
            .attr('font-size', props.graphOptions.fontSize)
            .style('opacity', (l: any) => {
              if (isQuery) {
                return queryMatches.has(l.id) ? 1 : 0.1;
              } else {
                return 1;
              }
            });
        });
      
      // highlight path
      paths
        .on('mouseover', function(d) {
          console.log(d)
          console.log('this')
          console.log(this)
          // console.log()
          paths.style('opacity',.1)
          d3.select(this).style('opacity', 1)
        })
            .on('mouseout', function (d) {
              paths.style('opacity', props.graphOptions.arcOpacity);
            });

  }
    highlighting();


    if (props.graphOptions.search && isQuery) {
      evaluateQuery(props.query, uniqueNodes, labels, paths, nodes, props.graphOptions.arcOpacity);
    }

    // edge case for rendering the graph on first render when editing editMode
    if (firstRender) {
      setTimeout(() => {
        let newValues = [...values, ...values];

        // render labels
        const text = d3.select(labelBox).selectAll(`text.text-panel-${panelId}`).data(uniqueNodes);

        text
          .enter()
          .append('text')
          // if node has large radius, offset the label for readability
          .attr('x', (d: any) => {
            return uniqueNodes.find((e: { id: any }) => e.id === d.id).radius >= 7
              ? -(uniqueNodes.find((e: { id: any }) => e.id === d.id).radius * 1.6)
              : -10;
          })
          .attr('y', (d: any) => {
            return uniqueNodes.find((e: { id: any }) => e.id === d.id).radius >= 7
              ? uniqueNodes.find((e: { id: any }) => e.id === d.id).radius * 0.8
              : 10;
          })
          .text((d, i) => uniqueNodes[i].name)
          .style('text-anchor', 'end')
          .attr('fill', () => {
            return props.isDarkMode ? 'white' : 'black';
          })
          .attr('font-size', props.graphOptions.fontSize)
          .attr('transform', (d, i) => 'translate(' + 0 + ',' + height + ')rotate(-45)')
          .style('margin-right', '5px')
          .attr('name', (d, i) => {
            return uniqueNodes[i].name;
          })
          .attr('id', (d, i) => {
            return i;
          });

        labelsAsHtml = document.querySelectorAll(`text.text-panel-${panelId}`);
        offsetBottom = calcBottomOffset(labelsAsHtml);
        const offsetFirstRender = 40;

        // Update the labels position
        d3.selectAll(`text.text-panel-${panelId}`).attr('transform', (d, i) => {
          return 'translate(' + newValues[i] + ',' + (height - offsetBottom - offsetFirstRender) + ')rotate(-45)';
        });

        // check if label is out of bounds
        Array.from(labelsAsHtml).forEach((element) => {
          replaceEllipsis(element, false);
        });

        // render nodes
        const svg = d3.select(container).selectAll(`circle.node-panel-${panelId}`).data(uniqueNodes);

        svg
          .enter()
          .append('circle')
          .attr('cx', (d, i) => {
            return values[i];
          })
          .attr('cy', height - offsetBottom - offsetFirstRender)
          .attr('r', (n: any) => {
            return n?.radius;
          })
          .style('fill', (d, i) => uniqueNodes[i].color)
          .attr('id', (d, i) => uniqueNodes[i].id)
          .attr('name', (d, i) => uniqueNodes[i].name)
          .attr('radius', (d, i) => uniqueNodes[i].radius);

        const g = d3.select(graph).selectAll(`path.path-panel-${panelId}`).data(links);

        g.enter()
          .append('path')
          .attr('d', function (d, i) {
            const start = values[links[i].source];
            const end = values[links[i].target];

            const radiusX = Math.abs(start - end) / 2; // X-axis radius
            let radiusY = radiusX * props.graphOptions.arcHeight; // Y-axis radius, multiply with linkHeight to get elliptical shape
            if (props.graphOptions.hopMode) {
              if (links[i].isOverlap) {
                radiusY = radiusX * links[i].mapRadiusY;
              }
            }
            const largeArcFlag = Math.abs(start - end) > Math.PI ? 1 : 0; // Determines whether the arc should be greater than or less than 180 degrees
            return [
              'M',
              start,
              height - offsetBottom - offsetFirstRender,
              'A',
              radiusX,
              ',',
              radiusY,
              0,
              largeArcFlag,
              ',',
              start < end ? 1 : 0,
              end,
              ',',
              height - offsetBottom - offsetFirstRender,
            ].join(' ');
          })
          .style('fill', 'none')
          .attr('stroke', (l: any) => {
            return l?.color;
          })
          .attr('id', (d, i) => links[i].id)
          .attr('stroke-width', (l: any) => {
            return l?.strokeWidth;
          })
          .style('opacity', props.graphOptions.arcOpacity)
          .attr('source', (d, i) => links[i].source)
          .attr('target', (d, i) => links[i].target)
          .attr('sum', (d, i) => links[i].sum)
          .attr('displayValue', (d, i) => links[i].displayValue)
          .attr('path', (d, i) => links[i].path);

        // toolTip();

        highlighting();
      }, 100);
    }

    /* eslint-disable react-hooks/exhaustive-deps */
  }, [links, props.height, props.width, uniqueNodes]);

  if (
    document.querySelectorAll(
      `[data-viz-panel-key="panel-${panelId}"],[data-panelid="${panelId}"] #canvas`
    )[0] !== undefined
  ) {
    handleZoom(
      document.querySelectorAll(
        `[data-viz-panel-key="panel-${panelId}"],[data-panelid="${panelId}"] #canvas`
      )[0] as HTMLElement,
      props.zoomState
    );
  }

  return (
    <div style={styles.containerStyle}>
      <div id={'canvas'} style={styles.containerStyle}>
        <svg style={styles.containerStyle} ref={containerRef}>
          <g style={styles.containerStyle} ref={gRef}></g>
          <svg style={styles.labelStyle} ref={labelRef}></svg>
        </svg>
      </div>
      <Tooltip rowNames={['test','1']} field={'test'} panelId={panelId} showTooltip={props.tooltip} tooltip={tooltip} container={containerRef.current}/>
      
    </div>
  );
}

export default Arc;

