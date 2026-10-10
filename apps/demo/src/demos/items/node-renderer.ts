import { createBidirectionalTree } from '@d3-tree/core'
import type { NodeRenderContext } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

const SVG_NS = 'http://www.w3.org/2000/svg'
const GROUP_COLORS: Record<string, string> = {
  建筑: '#5B8FF9',
  医疗: '#5AD8A6',
  汽车: '#F6BD16',
  装备: '#E8684A',
  金融: '#6DC8EC',
  硬件: '#9270CA',
  软件: '#FF9D4D',
}

const el = (tag: string, attrs: Record<string, string>): SVGElement => {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

/** SVG 渲染器：ctx.group 已定位在节点中心，append 任意 SVG 内容即可（导出无损） */
function iconRenderer(ctx: NodeRenderContext): void {
  if (ctx.variant === 'root') {
    ctx.group.appendChild(
      el('rect', {
        x: `${-ctx.width / 2}`, y: `${-ctx.height / 2}`,
        width: `${ctx.width}`, height: `${ctx.height}`, rx: '28', fill: '#1E6EFF',
      }),
    )
    const text = el('text', {
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#fff', 'font-size': '16', 'font-weight': 'bold',
      'font-family': 'PingFang SC, Microsoft YaHei, sans-serif',
    })
    text.textContent = ctx.data.name
    ctx.group.appendChild(text)
    return
  }
  const color = GROUP_COLORS[ctx.data.group ?? ''] ?? '#C0C4CC'
  ctx.group.appendChild(
    el('rect', {
      x: `${-ctx.width / 2}`, y: `${-ctx.height / 2}`,
      width: `${ctx.width}`, height: `${ctx.height}`, rx: '22',
      fill: '#fff', stroke: '#E4E7ED',
    }),
  )
  ctx.group.appendChild(el('circle', { cx: `${-ctx.width / 2 + 20}`, cy: '0', r: '13', fill: color }))
  const initial = el('text', {
    x: `${-ctx.width / 2 + 20}`, y: '0', 'text-anchor': 'middle',
    'dominant-baseline': 'central', fill: '#fff', 'font-size': '12', 'font-weight': 'bold',
  })
  initial.textContent = ctx.data.name.slice(0, 1)
  ctx.group.appendChild(initial)
  const label = el('text', {
    x: `${-ctx.width / 2 + 40}`, y: '0', 'dominant-baseline': 'central',
    fill: '#303133', 'font-size': '13',
  })
  label.textContent = ctx.data.name
  ctx.group.appendChild(label)
}

export const nodeRenderer: DemoItem = {
  id: 'node-renderer',
  title: 'SVG 图标节点',
  desc: 'nodeRenderer 直接向 ctx.group 绘制 SVG（优先级高于 nodeTemplate），导出 PNG/SVG 无损；ctx 提供 data/variant/side/depth/width/height。',
  setup({ canvas }) {
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      nodeRenderer: iconRenderer,
      nodeSize: (_d, variant) =>
        variant === 'root' ? { width: 200, height: 52 } : { width: 150, height: 44 },
      rowHeight: 56,
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
