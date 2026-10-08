import { hierarchy, tree } from 'd3'
import { theme } from './theme'
import type { LinkStyle, Side, TextMeasurer, TreeNodeData } from './types'

/**
 * 双向树布局引擎（纯函数）。
 *
 * 坐标系：x 水平（右为正），y 垂直（下为正）；节点记录中心点坐标。
 * 算法：根的直接子节点按 side 分侧 → 每侧一棵 d3.tree 取纵向次序坐标 →
 * 横向按深度分列（列起点 = 前列起点 + 该列最大节点宽 + columnGap）→ 左侧取负镜像 → 两侧根对齐 (0,0)。
 */

/** 展示树包装：引用原始数据对象，children 为过滤后的可见子集（折叠的子树不进入） */
interface DisplayNode {
  original: TreeNodeData
  children?: DisplayNode[]
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
  measureText: TextMeasurer
  rowHeight: number
  columnGap: number
}

function buildDisplay(node: TreeNodeData): DisplayNode {
  if (!node.collapsed && node.children?.length) {
    return { original: node, children: node.children.map(buildDisplay) }
  }
  return { original: node }
}

/** 根的直接子节点分侧：显式 side 优先，缺省前一半 left、后一半 right */
export function splitSides(root: TreeNodeData): { left: TreeNodeData[]; right: TreeNodeData[] } {
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

export function computeLayout(rootData: TreeNodeData, config: LayoutConfig): LayoutResult {
  const { measureText, rowHeight, columnGap } = config
  const nodes: LayoutNode[] = []
  const links: LayoutLink[] = []
  const byId = new Map<string, LayoutNode>()

  const rootNode: LayoutNode = {
    key: rootData.id,
    data: rootData,
    variant: 'root',
    name: rootData.name,
    side: 'center',
    depth: 0,
    width: measureText(rootData.name, 'root'),
    height: theme.rootHeight,
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
      children: sideChildren.map(buildDisplay),
    }
    const h = hierarchy<DisplayNode>(synthetic, d => d.children)
    const laidOut = tree<DisplayNode>()
      .nodeSize([rowHeight, 1])
      .separation(() => 1)(h)

    // 各深度列的最大节点宽 → 列起点（距中心的绝对距离）
    const colMax = new Map<number, number>()
    laidOut.each(n => {
      if (n.depth === 0) return
      const w = measureText(n.data.original.name, 'node')
      colMax.set(n.depth, Math.max(colMax.get(n.depth) ?? 0, w))
    })
    const colEdge = new Map<number, number>()
    let edge = rootNode.width / 2 + columnGap
    for (const depth of [...colMax.keys()].sort((a, b) => a - b)) {
      colEdge.set(depth, edge)
      edge += (colMax.get(depth) ?? 0) + columnGap
    }

    laidOut.each(n => {
      if (n.depth === 0) return
      const d = n.data.original
      const width = measureText(d.name, 'node')
      const columnStart = colEdge.get(n.depth) ?? 0
      const center = side === 'right' ? columnStart + width / 2 : -(columnStart + width / 2)
      const parentId =
        n.parent && n.parent.depth === 0 ? rootData.id : (n.parent?.data.original.id ?? rootData.id)

      const node: LayoutNode = {
        key: d.id,
        data: d,
        variant: 'node',
        name: d.name,
        side,
        depth: n.depth,
        width,
        height: theme.nodeHeight,
        x: center,
        y: n.x,
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

/** 连线路径：直角折线（父边 → 公共竖线 → 子边）或贝塞尔对角线 */
export function linkPath(link: LayoutLink, columnGap: number, style: LinkStyle): string {
  const { source, target } = link
  const dir = target.side === 'left' ? -1 : 1
  const sx = source.x + (dir * source.width) / 2
  const tx = target.x - (dir * target.width) / 2
  if (style === 'diagonal') {
    const mx = (sx + tx) / 2
    return `M${sx},${source.y}C${mx},${source.y} ${mx},${target.y} ${tx},${target.y}`
  }
  const busX = tx - (dir * columnGap) / 2
  return `M${sx},${source.y}H${busX}V${target.y}H${tx}`
}
