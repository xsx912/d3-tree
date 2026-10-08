import { select } from 'd3'
import { computeLayout, degenerateLinkPath, linkPath } from './layout'
import type { LayoutLink, LayoutNode } from './layout'
import { createCanvasMeasurer } from './measure'
import { theme } from './theme'
import type {
  LinkStyle,
  TextMeasurer,
  TreeInstance,
  TreeNodeData,
  TreeOptions,
} from './types'

interface Position {
  x: number
  y: number
}

/** 深度优先查找指定 id 的数据节点 */
function findDataById(root: TreeNodeData, id: string): TreeNodeData | undefined {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const hit = findDataById(child, id)
    if (hit) return hit
  }
  return undefined
}

function countDescendants(node: TreeNodeData): number {
  return (node.children ?? []).reduce((sum, c) => sum + 1 + countDescendants(c), 0)
}

/** 从数据的 collapsed 标记收集初始折叠集 */
function seedCollapsed(root: TreeNodeData): Set<string> {
  const ids = new Set<string>()
  const walk = (node: TreeNodeData): void => {
    if (node.collapsed && node.id !== root.id) ids.add(node.id)
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return ids
}

/**
 * 创建双向树图谱实例。容器需要有确定的宽高（如通过 CSS 设定）。
 *
 * ```ts
 * const tree = createBidirectionalTree(el, { data })
 * tree.toggle('node-id')   // 折叠/展开
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
  const visibleChildrenLimit = options.visibleChildrenLimit ?? 5
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
  let collapsedIds = seedCollapsed(currentData)
  /** 聚合释放状态：父 id → 已额外释放的子节点数（超出 visibleChildrenLimit 部分） */
  let revealed = new Map<string, number>()
  /** 上一帧渲染的节点位置（key → 中心点），供 enter 过渡起点与 exit 收拢目标使用 */
  const positions = new Map<string, Position>()

  function rectFill(d: LayoutNode): string {
    if (d.variant === 'root') return theme.rootFill
    return options.nodeColor?.(d.data) ?? theme.nodeFill
  }

  function textColor(d: LayoutNode): string {
    if (d.variant === 'root') return theme.rootText
    return theme.nodeText
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

  function badgeCenterX(d: LayoutNode): number {
    const dir = d.side === 'left' ? -1 : 1
    return dir * (d.width / 2 + theme.badgeRadius + 3)
  }

  /** 官方 collapsible-tree 模式：翻转折叠态后以被点击节点为动画源重绘 */
  function toggleById(id: string): void {
    if (id === currentData.id) return
    const dataNode = findDataById(currentData, id)
    if (!dataNode || !dataNode.children?.length) return
    if (collapsedIds.has(id)) collapsedIds.delete(id)
    else collapsedIds.add(id)
    options.onNodeToggle?.(dataNode, collapsedIds.has(id))
    render(id)
  }

  function setAggLoading(aggKey: string, loading: boolean): void {
    gNode
      .selectAll<SVGGElement, LayoutNode>('g.d3t-node')
      .filter(n => n.key === aggKey)
      .classed('d3t-loading', loading)
  }

  /** 点击“展开 (N)”：本地数据分批释放；配置 loadChildren 时先异步拉取并入 */
  function revealByParent(parentId: string): void {
    const parent = findDataById(currentData, parentId)
    if (!parent) return
    const loader = options.loadChildren
    if (loader) {
      const aggKey = `__agg__${parentId}`
      setAggLoading(aggKey, true)
      loader(parent)
        .then(fetched => {
          const existing = new Set((parent.children ?? []).map(c => c.id))
          parent.children = [...(parent.children ?? [])]
          for (const child of fetched) {
            if (!existing.has(child.id)) parent.children!.push(child)
          }
          // 回调返回的子节点并入数据后全部可见
          revealed.set(
            parentId,
            Math.max(0, parent.children!.length - visibleChildrenLimit),
          )
          setAggLoading(aggKey, false)
          render(parentId)
        })
        .catch(() => setAggLoading(aggKey, false))
      return
    }
    revealed.set(parentId, (revealed.get(parentId) ?? 0) + visibleChildrenLimit)
    render(parentId)
  }

  function walkAll(node: TreeNodeData, fn: (n: TreeNodeData) => void): void {
    fn(node)
    for (const child of node.children ?? []) walkAll(child, fn)
  }

  function render(sourceKey?: string): void {
    const layout = computeLayout(
      currentData,
      { measureText, rowHeight, columnGap },
      collapsedIds,
      { limit: visibleChildrenLimit, revealed },
    )
    const { width, height } = size()
    gChart.attr('transform', `translate(${width / 2},${height / 2})`)

    const animate = duration > 0 && sourceKey !== undefined
    const sourceOld = sourceKey !== undefined ? positions.get(sourceKey) : undefined
    const sourceNew =
      sourceKey !== undefined ? layout.nodes.find(n => n.key === sourceKey) : undefined
    const start: Position = sourceOld ?? { x: 0, y: 0 }
    const end: Position = sourceNew ? { x: sourceNew.x, y: sourceNew.y } : start

    // ---- 连线 ----
    const link = gLink
      .selectAll<SVGPathElement, LayoutLink>('path')
      .data(layout.links, d => d.id)

    if (animate) {
      link
        .exit<LayoutLink>()
        .transition()
        .duration(duration)
        .attr('d', d => degenerateLinkPath(end, linkStyle))
        .remove()
    } else {
      link.exit<LayoutLink>().remove()
    }

    const linkEnter = link
      .enter()
      .append('path')
      .attr('class', 'd3t-link')
      .attr('d', () => (animate ? degenerateLinkPath(start, linkStyle) : ''))
    const linkMerged = linkEnter.merge(link)
    if (animate) {
      linkMerged
        .transition()
        .duration(duration)
        .attr('d', d => linkPath(d, columnGap, linkStyle))
    } else {
      linkMerged.attr('d', d => linkPath(d, columnGap, linkStyle))
    }

    // ---- 节点 ----
    // 选择器限定 g.d3t-node：避免把徽标分组 g.d3t-badge（携带同 key 的数据）卷进 join 而被误判为重复 key 移除
    const node = gNode
      .selectAll<SVGGElement, LayoutNode>('g.d3t-node')
      .data(layout.nodes, d => d.key)

    if (animate) {
      node
        .exit<LayoutNode>()
        .transition()
        .duration(duration)
        .attr('transform', `translate(${end.x},${end.y})`)
        .remove()
    } else {
      node.exit<LayoutNode>().remove()
    }

    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', nodeClass)
      .attr('data-id', d => d.data.id)
      .attr('transform', () => `translate(${start.x},${start.y})`)
      .attr('cursor', d => (d.variant === 'root' ? 'default' : 'pointer'))
      .on('click', (event, d) => {
        if (d.variant === 'aggregate') {
          revealByParent(d.parentId)
          return
        }
        options.onNodeClick?.(d.data)
        if (d.variant !== 'root') toggleById(d.data.id)
      })

    nodeEnter
      .append('rect')
      .attr('x', d => -d.width / 2)
      .attr('y', d => -d.height / 2)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('rx', theme.radius)
      .attr('ry', theme.radius)
      .attr('fill', rectFill)
      .attr('stroke', d => (d.variant === 'root' ? 'none' : theme.nodeStroke))
    nodeEnter
      .append('text')
      .attr('class', 'd3t-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', theme.font)
      .attr('font-size', d => (d.variant === 'root' ? theme.rootFontSize : theme.nodeFontSize))
      .attr('font-weight', d => (d.variant === 'root' ? 'bold' : 'normal'))
      .attr('fill', textColor)
      .text(d => d.name)

    // +/− 徽标（仅普通节点；根节点与聚合虚拟节点不展示）
    const badge = nodeEnter
      .filter(d => d.variant === 'node')
      .append('g')
      .attr('class', 'd3t-badge')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        toggleById(d.data.id)
      })
    badge
      .append('circle')
      .attr('class', 'd3t-badge-circle')
      .attr('r', theme.badgeRadius)
      .attr('cx', badgeCenterX)
      .attr('cy', 0)
      .attr('fill', theme.badgeFill)
      .attr('stroke', theme.badgeStroke)
      .attr('stroke-width', 1)
    badge
      .append('text')
      .attr('class', 'd3t-badge-symbol')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('x', badgeCenterX)
      .attr('y', 0)
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('fill', theme.badgeText)
    badge.append('title')

    const nodeMerged = nodeEnter.merge(node)
    if (animate) {
      nodeMerged
        .transition()
        .duration(duration)
        .attr('transform', d => `translate(${d.x},${d.y})`)
    } else {
      nodeMerged.attr('transform', d => `translate(${d.x},${d.y})`)
    }

    // 徽标状态刷新：可见性、+/− 符号、悬停提示（后代数）
    nodeMerged.select<SVGGElement>('g.d3t-badge').each(function (d) {
      const g = select(this)
      const hasChildren = !!d.data.children?.length
      g.style('display', hasChildren ? '' : 'none')
      g.select<SVGTextElement>('text.d3t-badge-symbol').text(collapsedIds.has(d.key) ? '+' : '−')
      const n = countDescendants(d.data)
      g.select('title').text(
        collapsedIds.has(d.key) ? `展开（含 ${n} 个后代节点）` : `收起（含 ${n} 个后代节点）`,
      )
    })

    positions.clear()
    for (const n of layout.nodes) positions.set(n.key, { x: n.x, y: n.y })
  }

  render()

  return {
    setData(data) {
      currentData = data
      collapsedIds = seedCollapsed(data)
      revealed = new Map()
      positions.clear()
      render()
    },
    toggle(id) {
      toggleById(id)
    },
    expandAll() {
      collapsedIds.clear()
      if (visibleChildrenLimit > 0) {
        walkAll(currentData, n => {
          if (n.children?.length) revealed.set(n.id, n.children.length)
        })
      }
      render(currentData.id)
    },
    collapseAll() {
      collapsedIds.clear()
      walkAll(currentData, n => {
        if (n.children?.length && n.id !== currentData.id) collapsedIds.add(n.id)
      })
      revealed.clear()
      render(currentData.id)
    },
    destroy() {
      svg.remove()
    },
  }
}
