import { hierarchy, tree } from 'd3-hierarchy'
import type {
  LinkStyle,
  NodeSizeFn,
  NodeVariant,
  Orientation,
  Side,
  TreeNodeData,
} from './types'

/**
 * 双向树布局引擎（纯函数）。
 *
 * 坐标系：x 水平（右为正），y 垂直（下为正）；节点记录中心点坐标。
 * 算法：根的直接子节点按 side 分侧 → 每侧一棵 d3.tree 取纵向次序坐标 →
 * 横向按深度分列（列起点 = 前列起点 + 该列最大节点宽 + columnGap）→ 左侧取负镜像 → 两侧根对齐 (0,0)。
 */

/** 展示树包装：引用原始数据对象，children 为过滤后的可见子集（折叠子树不进入） */
interface DisplayNode {
  original: TreeNodeData
  children?: DisplayNode[]
  /** 聚合虚拟节点标记（“展开 (N)”） */
  aggregate?: true
}

export interface AggregateConfig {
  /** 每父节点默认可见子节点上限；0 = 不聚合 */
  limit: number
  /** 每父节点已额外释放的数量（超出 limit 的部分） */
  revealed: Map<string, number>
}

export interface LayoutNode {
  /** d3.join 的 key：数据 id（聚合虚拟节点用合成 key） */
  key: string
  data: TreeNodeData
  variant: 'root' | 'node' | 'aggregate'
  name: string
  side: Side | 'center'
  depth: number
  width: number
  height: number
  /** 中心点水平坐标 */
  x: number
  /** 中心点垂直坐标 */
  y: number
  parentId: string
}

export interface LayoutLink {
  id: string
  source: LayoutNode
  target: LayoutNode
}

export interface LayoutBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface LayoutResult {
  nodes: LayoutNode[]
  links: LayoutLink[]
  bounds: LayoutBounds
}

export interface LayoutConfig {
  rowHeight: number
  columnGap: number
  /** 节点几何来源（chart 层默认：文字度量宽 + 内置高度） */
  nodeSize: NodeSizeFn
  /** 布局方向：垂直 = 水平的坐标转置（上下分侧） */
  orientation: Orientation
}

function buildDisplay(
  node: TreeNodeData,
  collapsedIds: Set<string>,
  agg: AggregateConfig,
  side: 'left' | 'right',
  visibleGroups: Set<string> | null,
  orientation: Orientation,
): DisplayNode | null {
  // 分组过滤：未命中分组的节点连同其整棵子树一并隐藏（未分组节点不受影响）
  if (visibleGroups && node.group && !visibleGroups.has(node.group)) return null
  const children = node.children ?? []
  if (!collapsedIds.has(node.id) && children.length) {
    let visible = children
    let aggregate: DisplayNode | undefined
    if (agg.limit > 0 && children.length > agg.limit) {
      const take = Math.min(agg.limit + (agg.revealed.get(node.id) ?? 0), children.length)
      visible = children.slice(0, take)
      const remaining = children.length - visible.length
      if (remaining > 0) {
        const name =
          orientation === 'vertical'
            ? side === 'left'
              ? `↑ 展开 (${remaining})`
              : `展开 (${remaining}) ↓`
            : side === 'left'
              ? `< 展开 (${remaining})`
              : `展开 (${remaining}) >`
        aggregate = { original: { id: `__agg__${node.id}`, name } }
      }
    }
    const childNodes = visible
      .map(c => buildDisplay(c, collapsedIds, agg, side, visibleGroups, orientation))
      .filter((n): n is DisplayNode => n !== null)
    return {
      original: node,
      children: [...childNodes, ...(aggregate ? [{ ...aggregate, aggregate: true as const }] : [])],
    }
  }
  return { original: node }
}

/** 相邻兄弟在兄弟轴上的最小附加间隙 */
const SIBLING_MIN_GAP = 12

/** 兄弟轴上的节点尺寸：水平模式兄弟沿 y（用高度），垂直模式兄弟沿 x（用宽度） */
function siblingAxisSpan(
  node: DisplayNode,
  nodeSize: NodeSizeFn,
  vertical: boolean,
): number {
  const variant: NodeVariant = node.aggregate === true ? 'aggregate' : 'node'
  const s = nodeSize(node.original, variant)
  return vertical ? s.width : s.height
}

/** 根的直接子节点分侧：显式 side 优先，缺省前一半 left、后一半 right */
function splitSides(root: TreeNodeData): { left: TreeNodeData[]; right: TreeNodeData[] } {
  const left: TreeNodeData[] = []
  const right: TreeNodeData[] = []
  const list = root.children ?? []
  const half = Math.ceil(list.length / 2)
  list.forEach((child, i) => {
    const side = child.side ?? (i < half ? 'left' : 'right')
    ;(side === 'left' ? left : right).push(child)
  })
  return { left, right }
}

export function computeLayout(
  rootData: TreeNodeData,
  config: LayoutConfig,
  collapsedIds: Set<string> = new Set(),
  agg: AggregateConfig = { limit: 0, revealed: new Map() },
  visibleGroups: Set<string> | null = null,
): LayoutResult {
  const { nodeSize, rowHeight, columnGap, orientation } = config
  const vertical = orientation === 'vertical'
  const nodes: LayoutNode[] = []
  const links: LayoutLink[] = []
  const byId = new Map<string, LayoutNode>()

  const rootSize = nodeSize(rootData, 'root')
  const rootNode: LayoutNode = {
    key: rootData.id,
    data: rootData,
    variant: 'root',
    name: rootData.name,
    side: 'center',
    depth: 0,
    width: rootSize.width,
    height: rootSize.height,
    x: 0,
    y: 0,
    parentId: '',
  }
  nodes.push(rootNode)
  byId.set(rootNode.key, rootNode)

  const { left, right } = splitSides(rootData)

  for (const side of ['left', 'right'] as const) {
    const sideChildren = side === 'left' ? left : right
    if (!sideChildren.length) continue

    // 合成侧根：不可渲染，仅用于让 d3.tree 以根为 (0,0) 展开一侧子树
    const synthetic: DisplayNode = {
      original: rootData,
      children: sideChildren
        .map(c => buildDisplay(c, collapsedIds, agg, side, visibleGroups, orientation))
        .filter((n): n is DisplayNode => n !== null),
    }
    const h = hierarchy<DisplayNode>(synthetic, d => d.children)
    const laidOut = tree<DisplayNode>()
      .nodeSize([rowHeight, 1])
      // 相邻中心距需覆盖两节点在兄弟轴上的半尺寸和 + 最小间隙；不足 rowHeight 时钳回 1
      // （水平模式节点高 34 < 48 → 恒为 1，既有布局零变化；垂直模式按宽度自动撑开防叠边）
      .separation((a, b) =>
        Math.max(
          1,
          (siblingAxisSpan(a.data, nodeSize, vertical) / 2 +
            siblingAxisSpan(b.data, nodeSize, vertical) / 2 +
            SIBLING_MIN_GAP) /
            rowHeight,
        ),
      )(h)

    // 深度轴尺寸：水平=节点宽（列宽），垂直=节点高（行高）→ 累计出各深度列/行起点
    const depthAxis = (d: TreeNodeData, variant: LayoutNode['variant']): number => {
      const s = nodeSize(d, variant)
      return vertical ? s.height : s.width
    }
    const colMax = new Map<number, number>()
    laidOut.each(n => {
      if (n.depth === 0) return
      const variant: LayoutNode['variant'] = n.data.aggregate === true ? 'aggregate' : 'node'
      const size = depthAxis(n.data.original, variant)
      colMax.set(n.depth, Math.max(colMax.get(n.depth) ?? 0, size))
    })
    const colEdge = new Map<number, number>()
    let edge = (vertical ? rootNode.height : rootNode.width) / 2 + columnGap
    for (const depth of [...colMax.keys()].sort((a, b) => a - b)) {
      colEdge.set(depth, edge)
      edge += (colMax.get(depth) ?? 0) + columnGap
    }

    laidOut.each(n => {
      if (n.depth === 0) return
      const d = n.data.original
      const variant: LayoutNode['variant'] = n.data.aggregate === true ? 'aggregate' : 'node'
      const size = nodeSize(d, variant)
      const depthSpan = depthAxis(d, variant)
      const columnStart = colEdge.get(n.depth) ?? 0
      const center = side === 'right' ? columnStart + depthSpan / 2 : -(columnStart + depthSpan / 2)
      const parentId =
        n.parent && n.parent.depth === 0 ? rootData.id : (n.parent?.data.original.id ?? rootData.id)

      const node: LayoutNode = {
        key: d.id,
        data: d,
        variant,
        name: d.name,
        side,
        depth: n.depth,
        width: size.width,
        height: size.height,
        // 水平：深度沿 x（分侧取号）、兄弟沿 y；垂直：坐标转置（left=上半区 y 取负）
        x: vertical ? n.x : center,
        y: vertical ? center : n.x,
        parentId,
      }
      nodes.push(node)
      byId.set(node.key, node)

      const parent = byId.get(parentId)
      if (parent) links.push({ id: `${parent.key}->${node.key}`, source: parent, target: node })
    })
  }

  let minX = -rootNode.width / 2
  let maxX = rootNode.width / 2
  let minY = -rootNode.height / 2
  let maxY = rootNode.height / 2
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.width / 2)
    maxX = Math.max(maxX, n.x + n.width / 2)
    minY = Math.min(minY, n.y - n.height / 2)
    maxY = Math.max(maxY, n.y + n.height / 2)
  }

  return { nodes, links, bounds: { minX, maxX, minY, maxY } }
}

/** 连线路径：直角折线 / 贝塞尔对角线 / 直线；方向随 orientation 转置 */
export function linkPath(
  link: LayoutLink,
  columnGap: number,
  style: LinkStyle,
  orientation: Orientation = 'horizontal',
): string {
  const { source, target } = link
  const dir = target.side === 'left' ? -1 : 1
  if (orientation === 'vertical') {
    const sy = source.y + (dir * source.height) / 2
    const ty = target.y - (dir * target.height) / 2
    if (style === 'diagonal') {
      const my = (sy + ty) / 2
      return `M${source.x},${sy}C${source.x},${my} ${target.x},${my} ${target.x},${ty}`
    }
    if (style === 'straight') {
      return `M${source.x},${sy}L${target.x},${ty}`
    }
    const busY = ty - (dir * columnGap) / 2
    return `M${source.x},${sy}V${busY}H${target.x}V${ty}`
  }
  const sx = source.x + (dir * source.width) / 2
  const tx = target.x - (dir * target.width) / 2
  if (style === 'diagonal') {
    const mx = (sx + tx) / 2
    return `M${sx},${source.y}C${mx},${source.y} ${mx},${target.y} ${tx},${target.y}`
  }
  if (style === 'straight') {
    return `M${sx},${source.y}L${tx},${target.y}`
  }
  const busX = tx - (dir * columnGap) / 2
  return `M${sx},${source.y}H${busX}V${target.y}H${tx}`
}

/** 退化为一点的连线路径（enter 自源点长出 / exit 收拢回源点）。命令结构与 linkPath 一致，保证过渡可数值插值 */
export function degenerateLinkPath(
  at: { x: number; y: number },
  style: LinkStyle,
  orientation: Orientation = 'horizontal',
): string {
  if (style === 'diagonal') {
    return `M${at.x},${at.y}C${at.x},${at.y} ${at.x},${at.y} ${at.x},${at.y}`
  }
  if (style === 'straight') {
    return `M${at.x},${at.y}L${at.x},${at.y}`
  }
  return orientation === 'vertical'
    ? `M${at.x},${at.y}V${at.y}H${at.x}V${at.y}`
    : `M${at.x},${at.y}H${at.x}V${at.y}H${at.x}`
}
