// [refactor] Substantial changes in this file during the modernization refactor:
//  - props are typed via the `ArcProps` interface (was `props: any`);
//  - the module-level mutable `toolTip` singleton was replaced with component `useState`
//    (it previously leaked across every panel instance on the page);
//  - the global `localStorage("this")` first-render flag was replaced with a per-instance
//    `wasInViewRef` and moved into the effect (see comments below);
//  - the `==` highlighting comparisons were fixed to `Number(...) === ...` (a DOM id string
//    vs a numeric source — see comments at those sites);
//  - the tooltip inner lines now use `tooltipFontSize` instead of an undefined `props.zoom`.
// D3 selection callbacks (d/l/n) are intentionally left `any` (the D3 interop boundary).
import React, { useEffect, useRef, useState, ReactNode } from 'react';
import * as d3 from 'd3';
import { PanelData } from '@grafana/data';
import { idToName, getNodeTargets, linSpace, resetLabel, replaceEllipsis, evaluateQuery, handleZoom, getQueryMatches, calcBottomOffset } from 'utils';
import { styles } from 'styles'
import { Link, Node, ParsedData, SimpleOptions } from 'types';
import { locationService } from '@grafana/runtime';
import { Portal, VizTooltipContainer } from '@grafana/ui';

interface ArcProps {
  textColor: string;
  parsedData: ParsedData;
  graphOptions: SimpleOptions;
  width: number;
  height: number;
  query: string;
  isDarkMode: boolean;
  panelId: number;
  zoomState: number;
  data: PanelData;
}

interface ToolTipState {
  source: string;
  target: ReactNode;
  field: ReactNode;
  pos: number[];
}

function Arc(props: ArcProps) {
  // [refactor] Tracks whether the previous render was in view mode, so the effect can detect the
  // first render after switching into edit mode. Scoped to this instance via a ref (previously a
  // global localStorage("this") flag that leaked state across panels/tabs). It is only
  // read/written inside the effect, never during render.
  const wasInViewRef = useRef(true);

  const uniqueNodes: Node[] = props.parsedData.uniqueNodes;
  const links: Link[] = props.parsedData.links;
  const containerRef = useRef(null),
  gRef = useRef(null),
  labelRef = useRef(null),
  // [refactor] Replaces a `document.querySelectorAll('#arc-<id> #canvas')` lookup — see the zoom
  // effect below.
  canvasRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false)

  // [refactor] Tooltip content, scoped to this component instance via state (previously a
  // module-level singleton shared across every panel on the page).
  const [toolTip, setToolTip] = useState<ToolTipState>({
    source: "",
    target: <div></div>,
    field: <div></div>,
    pos: [0, 0]
  });

  const handleToggleTooltip = (isActive: boolean) => {
    setShowTooltip(isActive);
  }

  // [refactor] Stylistic: dropped the unused `displayValue` and `linkId` params.
  // `hoverLink` is the hovered path's own bound datum — see the comment at its use below.
  function updateTooltip(pos: number[], isActive: boolean, sourceId: number,  targetId?: number, hoverLink?: Link): void {
    const toolTip: ToolTipState = {
      source: "",
      target: <div></div>,
      field: <div></div>,
      pos
    };

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
                          // [refactor] Bug fix: was `props.zoom` (an undefined prop) -> tooltipFontSize
                          // [refactor] Tooltip fix: <div> (block) instead of <p>; these render
                          // inside another block below, and nesting <p> in <p> is invalid HTML
                          // (browsers auto-close the outer <p>, breaking the tooltip layout).
                          <div style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize, props.textColor)} key={index}>
                            {string}
                            <br />
                          </div>
                        ))
      } else if (nodeTargets.length === 1) {
        toolTip.target = idToName(nodeTargets[0], uniqueNodes)
      } else {
        toolTip.target = "";
      }
      if(props.graphOptions.isCluster) {
        toolTip.field = <div><b style={styles.toolTipStyle.preface}>Cluster: </b> {uniqueNodes[sourceId].cluster}</div>
      } else {
        toolTip.field = <div><b style={styles.toolTipStyle.preface}>Weight: </b>{uniqueNodes[sourceId].sum}</div>
      }
    } else {
      toolTip.source = idToName(sourceId,uniqueNodes)
      toolTip.target = idToName(targetId,uniqueNodes)

      // [refactor] Bug fix: prefer the hovered path's own bound datum over looking the link up by
      // source+target. `pathDataParser` deliberately creates several links for the same
      // source->target pair (that is what `isOverlap`/`mapRadiusY` render as stacked ellipses), so
      // `.find()` always returned the *first* of them and hovering the 2nd or 3rd stacked arc in
      // hop mode showed the wrong arc's values. The `.find()` remains as a fallback for callers
      // without a datum, and the lookups below are optional-chained so a miss renders nothing
      // instead of throwing (this was previously a `hoverLink!` non-null assertion).
      const link = hoverLink ?? links.find((item) => item.source === sourceId && item.target === targetId)
      // [refactor] Tooltip fix: build each field block with <div>/<span> instead of nesting a
      // <p> (the per-value lines) inside another <p> (the field row). Nested <p> is invalid HTML —
      // the browser implicitly closes the outer <p>, which was causing the broken tooltip
      // formatting Katrina/Copilot flagged. Same content, valid block structure.
      toolTip.field = props.parsedData.fields.map((field, index: number) => (
                        <div key={index}><b style={styles.toolTipStyle.preface}>{field.displayName}:</b>
                        {link?.[`${field.field}Display`]?.map((string: string, valueIndex: number) => (
                              <span style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize, props.textColor)} key={valueIndex}>
                                {string}
                                <br />
                              </span>
                            ))
                          }
                        </div>
                      ))
    }

    // [refactor] commit content + cursor position and toggle the tooltip. Positioning (including
    // viewport edge-collision) is now handled by Grafana's <VizTooltipContainer> in the render
    // below, so the previous manual #tooltip getBoundingClientRect math was removed.
    setToolTip(toolTip)
    handleToggleTooltip(isActive)
  };

  useEffect(() => {

    // [refactor] Holds the edit-mode first-render ResizeObserver (created below) so the effect
    // cleanup can disconnect it if the component unmounts before it fires.
    let firstRenderObserver: ResizeObserver | undefined;

    // [refactor] Detect the first render after switching from view mode into edit mode. Mutating
    // the ref here (inside the effect) is safe; the effect re-runs on the view->edit transition
    // because the panel's width/height change when it enters the editor.
    const isEdit = locationService.getSearchObject().editPanel !== undefined;
    let firstRender = false;
    if (!isEdit) {
      wasInViewRef.current = true;
    }
    if (wasInViewRef.current && isEdit) {
      firstRender = true;
    }
    if (isEdit) {
      wasInViewRef.current = false;
    }

    // removes the graph if it exists in the dom so it gets rendered with updated dimensions
    d3.selectAll(`#arc-${props.panelId} circle, #arc-${props.panelId} path, #arc-${props.panelId} text`).remove();


    const width = props.width,
    height = props.height

    const container = containerRef.current,
    graph = gRef.current,
    labelBox = labelRef.current;

    // render labels
    const text = d3.select(labelBox)
      .selectAll(`#arc-${props.panelId} text`)
      .data(uniqueNodes)

    text
      .enter()
      .append("text")
      // if node has large radius, offset the label for readability
      .attr("x", (d) => { return uniqueNodes.find((e) => e.id === d.id)!.radius >= 7 ? -(uniqueNodes.find((e) => e.id === d.id)!.radius*1.6) : -10 })
      .attr("y", (d) => { return uniqueNodes.find((e) => e.id === d.id)!.radius >= 7 ? (uniqueNodes.find((e) => e.id === d.id)!.radius*0.8) : 10 })
      .text((d, i) => uniqueNodes[i].name as string)
      .style("text-anchor", "end")
      .attr('fill', () => {return props.isDarkMode ? "white" : "black"})
      .attr('font-size', props.graphOptions.fontSize)
      .attr('transform', (d, i) => ("translate(" + 0 + "," + (height) + ")rotate(-45)"))
      .style("margin-right", "5px")
      .attr('name', (d, i) => { return uniqueNodes[i].name as string })
      .attr('id', (d, i) => { return i })


    // get array of equally spaced values for positioning of graph on x axis
    let values = linSpace(props.graphOptions.marginLeft, width-props.graphOptions.marginRight, uniqueNodes.length);

    // [refactor] Build the SVG path for one link at baseline `y`. Shared by the main render and
    // the edit-mode re-layout (they only differ by `y`). Self-loops (source === target) would
    // otherwise be a zero-radius (invisible) arc, so they get a small loop drawn above the node.
    const arcPathFor = (i: number, y: number): string => {
      const start = values[links[i].source!]
      const end = values[links[i].target!]
      if (links[i].source === links[i].target) {
        // vertical-oval loop sitting above the node, tangent to it at the node point (start, y).
        // The vertical radius is larger than the horizontal one so the loop reads as a tall oval.
        const loopRy = Math.max((uniqueNodes[links[i].source!]?.radius ?? 5) * 2.5, 12)
        const loopRx = loopRy * 0.55
        return [
          'M', start, y,
          'A', loopRx, ',', loopRy, 0, 1, ',', 1, start, ',', y - 2 * loopRy,
          'A', loopRx, ',', loopRy, 0, 1, ',', 1, start, ',', y
        ].join(' ')
      }
      const radiusX = Math.abs(start - end) / 2; // X-axis radius
      let radiusY = radiusX * props.graphOptions.arcHeight; // Y-axis radius, multiply with linkHeight to get elliptical shape
      if(props.graphOptions.hopMode) {
        if(links[i].isOverlap) { radiusY = radiusX * links[i].mapRadiusY! }
      }
      const largeArcFlag = Math.abs(start - end) > Math.PI ? 1 : 0; // Determines whether the arc should be greater than or less than 180 degrees
      return [
        'M', start, y,
        'A', radiusX, ',', radiusY, 0, largeArcFlag, ',', start < end ? 1 : 0, end, ',', y
      ].join(' ')
    }

    let labelsAsHtml = document.querySelectorAll(`#arc-${props.panelId} text`)

    let offsetBottom = calcBottomOffset(labelsAsHtml, props.graphOptions.fontSize * 2)

      // Update the labels position
        d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} text`)
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
    .selectAll(`#arc-${props.panelId} circle`)
    .data(uniqueNodes)

    svg
      .enter()
      .append("circle")
      .attr("cx", (d, i) => {
        return values[i]
      })
      .attr("cy", height-offsetBottom)
      .attr("r", (n) => { return  n?.radius })
      .style("fill", (d, i) => uniqueNodes[i].color)
      .attr("id", (d, i) => uniqueNodes[i].id)
      .attr("name", (d, i) => uniqueNodes[i].name as string)
      .attr("radius", (d, i) => uniqueNodes[i].radius);

    // render links
    const g = d3.select(graph)
      .selectAll(`#arc-${props.panelId} path`)
      .data(links)

    g
      .enter()
      .append('path')
      .attr('d', (d, i) => arcPathFor(i, height - offsetBottom))
      .style("fill", "none")
      .attr("stroke", (l) => { return  l?.color })
      .attr("id", (d, i) => links[i].id!)
      .attr("stroke-width", (l) => { return  l?.strokeWidth })
      .style("opacity", props.graphOptions.arcOpacity)
      .attr("source", (d, i) => links[i].source!)
      .attr("target", (d, i) => links[i].target!)
      .attr("sum", (d, i) => links[i].sum!)
      .attr("displayValue", (d, i) => links[i].displayValue!)
      .attr("path", (d, i) => links[i].pathIndex!)

    let nodes = d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} circle`)
    let paths = d3.selectAll<d3.BaseType, Link>(`#arc-${props.panelId} path`)
    let labels = d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} text`)
    const duration = 200;

    const isQuery = props.query.length !==0
    const queryMatches = getQueryMatches(props.query, uniqueNodes)

    function highlighting() {
      /********************************** Highlighting **********************************/

      if(firstRender) {
        nodes = d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} circle`)
        paths = d3.selectAll<d3.BaseType, Link>(`#arc-${props.panelId} path`)
        labels = d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} text`)
      }

      nodes
        .on("mouseover", function (d) {
          // Tooltip
          updateTooltip([d.clientX,d.clientY], true, Number(d.srcElement.id));
          // [refactor] Bug fix: a `setAttribute("name", …innerHTML)` used to sit here. The `name`
          // attribute is what `resetLabel()` restores from on mouseout, and by this point
          // `innerHTML` may already be the ellipsized text (see the replaceEllipsis pass after the
          // labels are positioned). Snapshotting it therefore made `name` progressively shorter on
          // every hover, permanently truncating long labels. `name` is set to the pristine node
          // name when the label is appended and must stay that way.
          const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links })
          // add ellipsis for node being hovered over & target nodes
          replaceEllipsis(labelsAsHtml[d.srcElement.id],true)
          nodeTargets.forEach(e => {
            replaceEllipsis(labelsAsHtml[e],true)
          })
          nodes
            .style("opacity", ( n) => {
              if(isQuery) {
                return queryMatches.has(n.id) ? 1 : 0.1
              } else {
                return nodeTargets.includes(n.id) ? 1 : 0.1
              }

            })
            .transition()
            .attr("r", (n) => {
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
            // [refactor] eqeqeq fix: the DOM id is a string and l.source is a number, so the
            // old `d.srcElement.id == l?.source` relied on loose equality. Wrapped in Number()
            // so strict `===` preserves the original matching behavior.
            .style('opacity', (l) => {
              if(isQuery) {
                return queryMatches.has(l.source!) || queryMatches.has(l.target!) ? props.graphOptions.arcOpacity : .1
              } else {
                return Number(d.srcElement.id) === l?.source || Number(d.srcElement.id) === l?.target ? props.graphOptions.arcOpacity : .1
              }
            })
            .attr('stroke-width', (l) => {
              return Number(d.srcElement.id) === l?.source || Number(d.srcElement.id) === l?.target ? l?.strokeWidth*2 : l?.strokeWidth
            })
            .duration(duration)
          labels
            .transition()
            .duration(duration)
            .attr("font-size", (label_d) => {
              if(isQuery) {
                return label_d.name === d.srcElement.getAttribute("name") ? props.graphOptions.fontSize*1.6 : props.graphOptions.fontSize
              } else {
                return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? props.graphOptions.fontSize*1.6 : props.graphOptions.fontSize
              }
            })
            .style("opacity", (label_d) => {
              if(isQuery) {
                return label_d.name === d.srcElement.getAttribute("name") ? 1 : .1
              } else {
                return label_d.name === d.srcElement.getAttribute("name") || nodeTargets.includes(label_d.id) ? 1 : .1
              }
            })
        })
        .on('mouseout', function (d) {
          const nodeTargets = getNodeTargets({ id: Number(d.srcElement.id), links })
          // [refactor] Dropped a `replaceEllipsis(…, false)` that ran here: `resetLabel` below
          // unconditionally overwrites `innerHTML`, so its mutation was always discarded.
          resetLabel(labelsAsHtml[d.srcElement.id])
          nodeTargets.forEach(e => {
            resetLabel(labelsAsHtml[e])
          })
          handleToggleTooltip(false);
          nodes
            .transition()
            .duration(duration)
            .attr("r", (n) => {
              return uniqueNodes[n.id].radius
            })
            .style("opacity",(n) => {
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
            .style("opacity",(l) => {
              if(isQuery) {
                return queryMatches.has(l.source!) || queryMatches.has(l.target!) ? props.graphOptions.arcOpacity : .1
              } else {
                return props.graphOptions.arcOpacity
              }
            })
            .attr('stroke-width', (l) => {
              return l?.strokeWidth
            })
          labels
            .transition()
            .duration(duration)
            .attr("font-size", props.graphOptions.fontSize)
            .style("opacity",(l) => {
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
        nodes = d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} circle`)
        paths = d3.selectAll<d3.BaseType, Link>(`#arc-${props.panelId} path`)
        labels = d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} text`)
      }

      paths
      // [refactor] D3 v7 calls listeners as (event, datum), so `hoverLink` is this path's own
      // `Link`. Reading it directly replaces re-deriving the link from the `source`/`target`/`path`
      // DOM attributes, which could not distinguish stacked arcs sharing a source->target pair.
      .on("mouseover", function (event, hoverLink) {
        updateTooltip([event.clientX,event.clientY], true, hoverLink.source!, hoverLink.target!, hoverLink);
        paths
          .style("opacity",(l) => {
            if(isQuery) {
              return queryMatches.has(l.source!) || queryMatches.has(l.target!) ? props.graphOptions.arcOpacity : .1
            } else if (props.graphOptions.hopMode) {
              return hoverLink.pathIndex === l.pathIndex ? props.graphOptions.arcOpacity : .1
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
          .style("opacity",(l) => {
            if(isQuery) {
              return queryMatches.has(l.source!) || queryMatches.has(l.target!) ? props.graphOptions.arcOpacity : .1
            } else {
              return props.graphOptions.arcOpacity
            }
          })
          .attr('stroke-width', (l) => {
            return l?.strokeWidth
          })
        d3.select<SVGPathElement, Link>(this as SVGPathElement)
          .transition()
          .style("opacity",(l) => {
            if(isQuery) {
              return queryMatches.has(l.source!) || queryMatches.has(l.target!) ? props.graphOptions.arcOpacity : .1
            } else {
              return props.graphOptions.arcOpacity
            }
          })
          .duration(duration)
          .attr('stroke-width', (l) => {
            return l?.strokeWidth
          })
      })
    }

    toolTip()


    if(props.graphOptions.search && isQuery) {evaluateQuery(props.query,uniqueNodes, labels, paths, nodes, props.graphOptions.arcOpacity)}

    // edge case for rendering the graph on first render when editing editMode
    if(firstRender) {
      // [refactor] Re-run the layout once the panel-editor dimensions have actually settled.
      // This was previously a fragile fixed `setTimeout(…, 100)`; a ResizeObserver fires on its
      // first observation (after the container is laid out), which is the signal we actually
      // want. The re-layout body below — including the load-bearing `offsetFirstRender = 40`
      // vertical adjustment — is unchanged, so the rendered result is the same.
      const reRender = () => {

        let newValues = [...values, ...values]

        // render labels
        const text = d3.select(labelBox)
        .selectAll(`#arc-${props.panelId} text`)
        .data(uniqueNodes)

        text
          .enter()
          .append("text")
          // if node has large radius, offset the label for readability
          .attr("x", (d) => { return uniqueNodes.find((e) => e.id === d.id)!.radius >= 7 ? -(uniqueNodes.find((e) => e.id === d.id)!.radius*1.6) : -10 })
          .attr("y", (d) => { return uniqueNodes.find((e) => e.id === d.id)!.radius >= 7 ? (uniqueNodes.find((e) => e.id === d.id)!.radius*0.8) : 10 })
          .text((d, i) => uniqueNodes[i].name as string)
          .style("text-anchor", "end")
          .attr('fill', () => {return props.isDarkMode ? "white" : "black"})
          .attr('font-size', props.graphOptions.fontSize)
          .attr('transform', (d, i) => ("translate(" + 0 + "," + (height) + ")rotate(-45)"))
          .style("margin-right", "5px")
          .attr('name', (d, i) => { return uniqueNodes[i].name as string })
          .attr('id', (d, i) => { return i })

        labelsAsHtml = document.querySelectorAll(`#arc-${props.panelId} text`)
        offsetBottom = calcBottomOffset(labelsAsHtml, props.graphOptions.fontSize * 2)
        const offsetFirstRender = 40


        // Update the labels position
        d3.selectAll<d3.BaseType, Node>(`#arc-${props.panelId} text`)
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
        .selectAll(`#arc-${props.panelId} circle`)
        .data(uniqueNodes)

        svg
          .enter()
          .append("circle")
          .attr("cx", (d, i) => {
            return values[i]
          })
          .attr("cy", height-offsetBottom-offsetFirstRender)
          .attr("r", (n) => { return  n?.radius })
          .style("fill", (d, i) => uniqueNodes[i].color)
          .attr("id", (d, i) => uniqueNodes[i].id)
          .attr("name", (d, i) => uniqueNodes[i].name as string)
          .attr("radius", (d, i) => uniqueNodes[i].radius);



        const g = d3.select(graph)
        .selectAll(`#arc-${props.panelId} path`)
        .data(links)

        g
          .enter()
          .append('path')
          .attr('d', (d, i) => arcPathFor(i, height - offsetBottom - offsetFirstRender))
          .style("fill", "none")
          .attr("stroke", (l) => { return  l?.color })
          .attr("id", (d, i) => links[i].id!)
          .attr("stroke-width", (l) => { return  l?.strokeWidth })
          .style("opacity", props.graphOptions.arcOpacity)
          .attr("source", (d, i) => links[i].source!)
          .attr("target", (d, i) => links[i].target!)
          .attr("sum", (d, i) => links[i].sum!)
          .attr("displayValue", (d, i) => links[i].displayValue!)
          .attr("path", (d, i) => links[i].pathIndex!)



          toolTip()

          highlighting()
      }

      const observeTarget = container as Element | null;
      if (observeTarget) {
        firstRenderObserver = new ResizeObserver(() => {
          // only need the first (post-layout) observation
          firstRenderObserver?.disconnect();
          firstRenderObserver = undefined;
          reRender();
        });
        firstRenderObserver.observe(observeTarget);
      } else {
        reRender();
      }
    }

    // [refactor] Disconnect the first-render observer if the effect re-runs or the component
    // unmounts before it has fired.
    return () => {
      firstRenderObserver?.disconnect();
    };

  // [refactor] Every prop the effect body reads is now listed. It previously declared only
  // [links, height, width, uniqueNodes] while reading `graphOptions`, `panelId`, `query`,
  // `isDarkMode` and `textColor`, and only stayed correct because SimplePanel rebuilds
  // `parsedData` unmemoized on every render, so `links`/`uniqueNodes` change identity every time
  // and the effect always re-ran. Memoizing `parsedData` — an obvious future optimization — would
  // otherwise have silently frozen the diagram against option changes like font size or the
  // search query. Behavior is unchanged today (`graphOptions` is also a fresh object per render).
  //
  // The eslint-disable stays because `updateTooltip` is re-created every render and is
  // deliberately not memoized, so exhaustive-deps would demand it as a dependency.
  /* eslint-disable react-hooks/exhaustive-deps */
  }, [links, uniqueNodes, props.width, props.height, props.panelId,
      props.query, props.graphOptions, props.isDarkMode, props.textColor]);

  // [refactor] The zoom transform used to be applied straight from the component body, which is a
  // side effect during render: React may render without committing (StrictMode, concurrent
  // interruption), so the transform could be written for a discarded render. Applying it in an
  // effect keyed on `zoomState` also means it no longer runs on every unrelated re-render, and the
  // ref replaces a `document.querySelectorAll` that reached across the whole page.
  //
  // Safe to own the inline `transform` imperatively: `styles.canvasStyle` does not set it, so
  // React's style diffing never clobbers the value, and this div is never remounted.
  useEffect(() => {
    if (canvasRef.current) {
      handleZoom(canvasRef.current, props.zoomState);
    }
  }, [props.zoomState]);

  return (
      // [refactor] Scope this panel instance with an id we control (`arc-<panelId>`) instead of
      // Grafana's `data-panelid` attribute, which existed in Grafana 9 but was removed in
      // Grafana 13. Every D3 selection above targets `#arc-${props.panelId} <tag>`, so the
      // diagram now finds its own circles/paths/labels (and measures them) on any Grafana
      // version. Without this the label measurement returned -Infinity and the whole diagram
      // rendered at y=Infinity (off-screen).
      <div id={`arc-${props.panelId}`} style={styles.containerStyle}>
        {/* [refactor] Dropped `id="canvas"`: it was a bare id duplicated across every arc panel on
            a dashboard, and the zoom effect now reaches this element through `canvasRef`. */}
        <div ref={canvasRef} style={styles.canvasStyle} >
          <svg style={styles.containerStyle} ref = {containerRef}>
            <g style={styles.containerStyle} ref = {gRef}></g>
            <svg style={styles.labelStyle} ref = {labelRef}></svg>
          </svg>

        </div>
        {/* [refactor] Tooltip now renders through Grafana's <VizTooltipContainer> (in a <Portal>
            so it is not clipped by the panel's scroll box). The container handles cursor
            positioning and viewport edge-collision that the old hand-rolled #tooltip div did
            manually; we just feed it the cursor position captured in `toolTip.pos`. */}
        {showTooltip && (
          <Portal>
            <VizTooltipContainer position={{ x: toolTip.pos[0], y: toolTip.pos[1] }} offset={{ x: 10, y: 10 }}>
              <div style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize, props.textColor)} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipSource}</b> {" "}{toolTip.source}</div>
              <br/>
              <div style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize, props.textColor)} ><b style={styles.toolTipStyle.preface}>{props.graphOptions.toolTipTarget}</b>{toolTip.target}</div>
              <br/>
              {/* [refactor] Tooltip fix: outer container is a <div>, not a <p>. `toolTip.field`
                  contains block elements, and wrapping them in a <p> produced invalid nested-<p>
                  markup that the browser auto-closed, breaking the layout. */}
              <div style={styles.toolTipStyle.text(props.graphOptions.tooltipFontSize, props.textColor)} > {toolTip.field}</div>
            </VizTooltipContainer>
          </Portal>
        )}
      </div>
  );
}


export default Arc;
