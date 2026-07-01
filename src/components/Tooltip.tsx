import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface TooltipProps {
  rowNames: any;
  field: any;
  panelId: any;
  showTooltip: boolean;
  tooltip: any;
  container: any;
}

export const Tooltip: React.FC<TooltipProps> = ({ rowNames, field, panelId, showTooltip, tooltip, container }) => {
  // helper
  function moveTooltip(event, elem, tooltip) {
    const scrollRect = elem.parentElement.getBoundingClientRect();
    const tooltipRect = tooltip.node().getBoundingClientRect();

    // Distance to place tooltip from mouse
    const mouseDistance = 10;

    const xMin = 0;
    const yMin = 0;
    const xMax = scrollRect.width + elem.parentElement.scrollLeft - tooltipRect.width;
    const yMax = scrollRect.height + elem.parentElement.scrollTop - tooltipRect.height;

    let xPos = 0;
    let yPos = 0;

    if (event.offsetX - mouseDistance >= xMin && event.offsetX + mouseDistance >= xMax) {
      // Draw tooltip left of the mouse
      xPos = Math.max(event.offsetX - tooltipRect.width - mouseDistance, xMin);
    } else {
      // Draw tooltip right of the mouse
      xPos = Math.min(event.offsetX + mouseDistance, xMax);
    }

    if (event.offsetY - mouseDistance >= yMin && event.offsetY + mouseDistance >= yMax) {
      // Draw tooltip above the mouse
      yPos = Math.max(event.offsetY - tooltipRect.height - mouseDistance, yMin);
    } else {
      // Draw tooltip below the mouse
      yPos = Math.min(event.offsetY + mouseDistance, yMax);
    }

    tooltip.style('left', `${xPos}px`).style('top', `${yPos}px`);
  }

  useEffect(() => {
    const pathClass = `path-panel-${panelId}`;

    // Links Tooltip
    // Tooltip
    if (showTooltip) {

      d3.selectAll(pathClass)
        .on('mouseover', function (event: any, d: any) {
          console.log(d);
          let id = d3.select(this).attr('id');
          let row = id.split('-');
          let name = rowNames.find((e: any) => e.name === row[1]).display;

          // paths: selected opacity -> 1, all else -> 0.2
          d3.selectAll(pathClass).each(function (d) {
            let thisId = d3.select(this).attr('id');
            let dark = id === thisId;
            d3.select(this).attr('opacity', dark ? 1 : 0.4);
          });
          // let thisId = d3.select(this).attr('id');
          tooltip
            .html(() => {
              let textVal = d3.select(this).attr('display');
              let text = `${name} <br> <b>${textVal}</b>`;
              return text;
            })
            .style('padding', '10px 15px')
            .style('background', '#19191A')
            .style('color', 'white')
            .style('border', '#A8A8A8 solid 2px')
            .style('border-radius', '4px')
            .style('left', event.pageX + 'px')
            .style('top', event.pageY + 'px')
            .style('opacity', 0)
            .style('z-index', '1')
            .style('position', 'absolute');
          tooltip.transition().duration(100).style('opacity', 1);
        })
        .on('mousemove', function (event) {
          moveTooltip(event, container, tooltip);
        })
        .on('mouseout', function (d) {
          // let thisId = d3.select(this).attr('id');
          tooltip.transition().duration(100).style('opacity', '0');
          d3.selectAll(pathClass).attr('opacity', 0.7);
        });
    }

    // Nodes Tooltip
    const nodeClass = `node-panel-${panelId}`;
    d3.selectAll(nodeClass)
      .on('mouseover', function (event: any, d: any) {
        let id = d3.select(this).attr('id').split(',');
        let panelId = id[0];
        let rowList: string[] = [];
        id.forEach((e) => {
          rowList.push(`${panelId}-${e}`);
        });
        d3.selectAll(pathClass).each(function (d) {
          let thisId = d3.select(this).attr('id');
          let found = rowList.find((e) => e === thisId);
          d3.select(this).attr('opacity', found ? 1 : 0.2);
        });

        let thisNode = d3.select(this).attr('data-index');
        let div = d3
          .select('body')
          .append('div')
          .attr('class', `tooltip-node${thisNode}`)
          .html(() => {
            let textVal = field.display(d3.select(this).attr('d'));
            let name = d3.select(this).attr('name');
            let text;
            if (textVal.suffix) {
              text = `${name}: <b>${textVal.text} ${textVal.suffix}</b>`;
            } else {
              text = `${name}: <b>${textVal.text}</b>`;
            }
            return text;
          })
          .style('padding', '10px 15px')
          .style('background', '#19191A')
          .style('color', 'white')
          .style('border', '#A8A8A8 solid 2px')
          .style('border-radius', '4px')
          .style('left', event.pageX + 'px')
          .style('top', event.pageY + 'px')
          .style('opacity', 0)
          .style('z-index', '1')
          .style('position', 'absolute');
        div.transition().duration(100).style('opacity', 0.8);
      })
      .on('mouseout', function (d) {
        let thisNode = d3.select(this).attr('data-index');
        d3.selectAll(`.tooltip-node${thisNode}`).transition().duration(100).remove();
        d3.selectAll(pathClass).attr('opacity', 0.7);
      });

    return () => {};
  });
  return null;
};

