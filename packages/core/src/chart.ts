import { select } from 'd3'
import { computeLayout, linkPath } from './layout'
import type { LayoutLink, LayoutNode } from './layout'
import { createCanvasMeasurer } from './measure'
import { theme } from './theme'
import type {
  LinkStyle,
  Side,
  TextMeasurer,
  TreeInstance,
  TreeNodeData,
  TreeOptions,
} from './types'

/**
 * 创建双向树图谱实例。容器需要有确定的宽高（如通过 CSS 设定）。
 *
 * ```ts
 * const tree = createBidirectionalTree(el, { data })
 * tree.setData(nextData)
 * tree.destroy()
 * ```
 */
export function createBidirectionalTree(
  container: HTMLElement,
  options: TreeOptions,
): TreeInstance {
  const duration = options.duration ?? 250
  const rowHeight = options.rowHeight ?? 48
  const columnGap = options.columnGap ?? 48
  const linkStyle: LinkStyle = options.linkStyle ?? 'orthogonal'
  const measureText: TextMeasurer = options.measureText ?? createCanvasMeasurer()

  const svg = select(container)
    .append('svg')
    .attr('class', 'd3t-svg')
    .style('width', '100%')
    .style('height', '100%')
    .style('display', 'block')
    .style('background', '#FFFFFF')
  const gChart = svg.append('g').attr('class', 'd3t-chart')
  const gLink = gChart
    .append('g')
    .attr('class', 'd3t-links')
    .attr('fill', 'none')
    .attr('stroke', theme.link)
    .attr('stroke-width', theme.linkWidth)
  const gNode = gChart.append('g').attr('class', 'd3t-nodes')

  let currentData: TreeNodeData = options.data

  function rectFill(d: LayoutNode): string {
    if (d.variant === 'root') return theme.rootFill
    return options.nodeColor?.(d.data) ?? theme.nodeFill
  }

  function textColor(d: LayoutNode): string {
    if (d.variant === 'root') return theme.rootText
    return d.variant === 'aggregate' ? theme.aggregateText : theme.nodeText
  }

  function nodeClass(d: LayoutNode): string {
    return `d3t-node d3t-node--${d.variant} d3t-side--${d.side}`
  }

  function size(): { width: number; height: number } {
    return {
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
    }
  }

  function render(): void {
    const layout = computeLayout(currentData, { measureText, rowHeight, columnGap })
    const { width, height } = size()
    gChart.attr('transform', `translate(${width / 2},${height / 2})`)

    gLink
      .selectAll<SVGPathElement, LayoutLink>('path')
      .data(layout.links, d => d.id)
      .join(enter =>
        enter
          .append('path')
          .attr('class', 'd3t-link')
          .attr('d', d => linkPath(d, columnGap, linkStyle)),
      )

    gNode
      .selectAll<SVGGElement, LayoutNode>('g')
      .data(layout.nodes, d => d.key)
      .join(enter => {
        const g = enter
          .append('g')
          .attr('class', nodeClass)
          .attr('data-id', d => d.data.id)
          .attr('transform', d => `translate(${d.x},${d.y})`)
        g.append('rect')
          .attr('x', d => -d.width / 2)
          .attr('y', d => -d.height / 2)
          .attr('width', d => d.width)
          .attr('height', d => d.height)
          .attr('rx', theme.radius)
          .attr('ry', theme.radius)
          .attr('fill', rectFill)
          .attr('stroke', d => (d.variant === 'root' ? 'none' : theme.nodeStroke))
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-family', theme.font)
          .attr('font-size', d => (d.variant === 'root' ? theme.rootFontSize : theme.nodeFontSize))
          .attr('font-weight', d => (d.variant === 'root' ? 'bold' : 'normal'))
          .attr('fill', textColor)
          .text(d => d.name)
        return g
      })
      .attr('transform', d => `translate(${d.x},${d.y})`)
  }

  render()

  return {
    setData(data) {
      currentData = data
      render()
    },
    destroy() {
      svg.remove()
    },
  }
}
