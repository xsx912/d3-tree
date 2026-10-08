import { select, zoom, ZoomTransform } from 'd3'
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

/** 查找指定 id 的父节点（返回其直接持有者） */
function findParentOf(root: TreeNodeData, id: string): TreeNodeData | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root
    const hit = findParentOf(child, id)
    if (hit) return hit
  }
  return null
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
    .attr('cursor', 'grab')
  // 缩放层（承载 zoom 变换）与内容层（承载居中平移）分离，避免变换互相覆盖
  const gZoom = svg.append('g').attr('class', 'd3t-zoom')
  const gChart = gZoom.append('g').attr('class', 'd3t-chart')
  const gLink = gChart
    .append('g')
    .attr('class', 'd3t-links')
    .attr('fill', 'none')
    .attr('stroke', theme.link)
    .attr('stroke-width', theme.linkWidth)
  const gNode = gChart.append('g').attr('class', 'd3t-nodes')

  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .extent(() => [[0, 0], [container.clientWidth || 800, container.clientHeight || 600]])
    .on('zoom', event => {
      gZoom.attr('transform', event.transform.toString())
    })
  svg.call(zoomBehavior).on('dblclick.zoom', null) // 双击留给业务，不抢缩放

  // ---- tooltip（容器内绝对定位 div，框架无关）----
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative'
  }
  const tooltipEl = document.createElement('div')
  tooltipEl.className = 'd3t-tooltip'
  Object.assign(tooltipEl.style, {
    display: 'none',
    position: 'absolute',
    zIndex: '1000',
    pointerEvents: 'none',
    background: '#FFFFFF',
    border: '1px solid ' + theme.nodeStroke,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    padding: '8px 12px',
    fontSize: '12px',
    color: theme.nodeText,
    fontFamily: theme.font,
    lineHeight: '1.7',
    maxWidth: '280px',
  } satisfies Partial<CSSStyleDeclaration>)
  container.appendChild(tooltipEl)

  function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  function defaultTooltipHtml(node: TreeNodeData): string {
    const rows = Object.entries(node.properties ?? {})
      .map(([k, v]) => `<tr><td style="padding-right:12px;color:#909399">${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`)
      .join('')
    const title = `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(node.name)}</div>`
    return rows ? `${title}<table>${rows}</table>` : title
  }

  function showTooltip(event: MouseEvent, d: LayoutNode): void {
    if (d.variant === 'aggregate') return
    tooltipEl.innerHTML = options.tooltip?.formatter
      ? options.tooltip.formatter(d.data)
      : defaultTooltipHtml(d.data)
    tooltipEl.style.display = 'block'
    moveTooltip(event)
  }

  function moveTooltip(event: MouseEvent): void {
    if (tooltipEl.style.display === 'none') return
    const rect = container.getBoundingClientRect()
    const w = tooltipEl.offsetWidth
    const h = tooltipEl.offsetHeight
    let x = event.clientX - rect.left + 14
    let y = event.clientY - rect.top + 14
    if (x + w > rect.width) x = event.clientX - rect.left - w - 10
    if (y + h > rect.height) y = event.clientY - rect.top - h - 10
    tooltipEl.style.left = `${Math.max(x, 2)}px`
    tooltipEl.style.top = `${Math.max(y, 2)}px`
  }

  function hideTooltip(): void {
    tooltipEl.style.display = 'none'
  }

  let currentData: TreeNodeData = options.data
  let collapsedIds = seedCollapsed(currentData)
  /** 聚合释放状态：父 id → 已额外释放的子节点数（超出 visibleChildrenLimit 部分） */
  let revealed = new Map<string, number>()
  /** 分组过滤：null = 全部可见 */
  let visibleGroups: Set<string> | null = null
  /** 分组 → 调色板颜色（setData 时重算） */
  let groupColors = new Map<string, string>()
  /** 上一帧渲染的节点位置（key → 中心点），供 enter 过渡起点与 exit 收拢目标使用 */
  const positions = new Map<string, Position>()

  function computeGroupColors(data: TreeNodeData): Map<string, string> {
    const colors = new Map<string, string>()
    if (!options.colorByGroup) return colors
    const walk = (node: TreeNodeData): void => {
      if (node.group && !colors.has(node.group)) {
        colors.set(node.group, theme.groupPalette[colors.size % theme.groupPalette.length]!)
      }
      for (const child of node.children ?? []) walk(child)
    }
    walk(data)
    return colors
  }

  function rectFill(d: LayoutNode): string {
    if (d.variant === 'root') return theme.rootFill
    const custom = options.nodeColor?.(d.data)
    if (custom) return custom
    if (options.colorByGroup && d.data.group) {
      return groupColors.get(d.data.group) ?? theme.nodeFill
    }
    return theme.nodeFill
  }

  /** 分组着色或自定义着色时使用白字保证对比度 */
  function isColored(d: LayoutNode): boolean {
    if (d.variant === 'root') return false
    if (options.nodeColor?.(d.data)) return true
    return options.colorByGroup === true && !!d.data.group && groupColors.has(d.data.group)
  }

  function textColor(d: LayoutNode): string {
    if (d.variant === 'root') return theme.rootText
    if (d.variant === 'aggregate') return theme.aggregateText
    return isColored(d) ? '#FFFFFF' : theme.nodeText
  }

  function sanitizeGroupClass(group: string): string {
    return group.replace(/[^a-zA-Z0-9_-]+/g, '-')
  }

  function nodeClass(d: LayoutNode): string {
    const group = d.data.group && d.variant !== 'root' ? ` d3t-group--${sanitizeGroupClass(d.data.group)}` : ''
    return `d3t-node d3t-node--${d.variant} d3t-side--${d.side}${group}`
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
      visibleGroups,
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
        options.onNodeSelect?.(d.data)
        if (d.variant !== 'root' && options.toggleOnNodeClick !== false) toggleById(d.data.id)
      })
      .on('mouseenter', (event, d) => showTooltip(event as MouseEvent, d))
      .on('mousemove', (event) => moveTooltip(event as MouseEvent))
      .on('mouseleave', hideTooltip)

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

    // 颜色刷新（nodeColor 回调/分组调色板可能随 setData 变化）
    nodeMerged.select<SVGRectElement>('rect').attr('fill', rectFill)
    nodeMerged.select<SVGTextElement>('text.d3t-label').attr('fill', textColor)

    hideTooltip()

    positions.clear()
    for (const n of layout.nodes) positions.set(n.key, { x: n.x, y: n.y })
  }

  function emitGroups(): void {
    options.onGroupsChange?.([...groupColors.entries()].map(([name, color]) => ({ name, color })))
  }

  groupColors = computeGroupColors(currentData)
  render()
  emitGroups()

  return {
    setData(data) {
      const sourceKey = currentData.id
      currentData = data
      collapsedIds = seedCollapsed(data)
      revealed = new Map()
      visibleGroups = null
      groupColors = computeGroupColors(data)
      positions.clear()
      render(sourceKey)
      emitGroups()
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
    addChild(parentId, node, side) {
      const parent = findDataById(currentData, parentId)
      if (!parent) return false
      const child =
        side && parentId === currentData.id ? { ...node, side } : node
      parent.children = [...(parent.children ?? []), child]
      collapsedIds.delete(parentId)
      render(parentId)
      return true
    },
    removeChild(id) {
      if (id === currentData.id) return false
      const parent = findParentOf(currentData, id)
      if (!parent?.children?.some(c => c.id === id)) return false
      parent.children = parent.children.filter(c => c.id !== id)
      revealed.delete(id)
      render(parent.id)
      return true
    },
    zoomToFit() {
      const layout = computeLayout(
        currentData,
        { measureText, rowHeight, columnGap },
        collapsedIds,
        { limit: visibleChildrenLimit, revealed },
        visibleGroups,
      )
      const { minX, maxX, minY, maxY } = layout.bounds
      const { width, height } = size()
      const pad = 40
      const k = Math.min((width - pad) / Math.max(maxX - minX, 1), (height - pad) / Math.max(maxY - minY, 1), 1)
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const t = new ZoomTransform(k, width / 2 - k * cx, height / 2 - k * cy)
      if (duration > 0) {
        svg.transition().duration(duration).call(zoomBehavior.transform, t)
      } else {
        svg.call(zoomBehavior.transform, t)
      }
    },
    setVisibleGroups(groups) {
      visibleGroups = groups ? new Set(groups) : null
      render(currentData.id)
    },
    destroy() {
      svg.remove()
      tooltipEl.remove()
    },
  }
}
