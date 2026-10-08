import { createBidirectionalTree } from '@d3-tree/core'
import type { NodeRenderContext, TreeNodeData, TreeInstance } from '@d3-tree/core'
import { industryData } from '../data'

const container = document.querySelector<HTMLDivElement>('#chart')
if (!container) throw new Error('#chart 容器不存在')

const SVG_NS = 'http://www.w3.org/2000/svg'

/** 分组主色（与 core 内置调色板首现顺序一致） */
const GROUP_COLORS: Record<string, string> = {
  建筑: '#5B8FF9',
  医疗: '#5AD8A6',
  汽车: '#F6BD16',
  装备: '#E8684A',
  金融: '#6DC8EC',
  硬件: '#9270CA',
  软件: '#FF9D4D',
}

function countChildren(node: TreeNodeData): number {
  return node.children?.length ?? 0
}

function esc(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/* ---------- 模式一：HTML 卡片（nodeTemplate + nodeSize）---------- */

const cardSize = (data: TreeNodeData, variant: 'root' | 'node' | 'aggregate') =>
  variant === 'root' ? { width: 236, height: 64 } : { width: 176, height: 52 }

const cardTemplate = (data: TreeNodeData, variant: 'root' | 'node' | 'aggregate'): string => {
  if (variant === 'root') {
    return `
      <div style="width:100%;height:100%;background:linear-gradient(135deg,#1E6EFF,#5B8FF9);
        border-radius:8px;color:#fff;padding:8px 14px;box-sizing:border-box;
        display:flex;flex-direction:column;justify-content:center;box-shadow:0 2px 6px rgba(30,110,255,.35);">
        <div style="font-size:16px;font-weight:700;">${esc(data.name)}</div>
        <div style="font-size:11px;opacity:.85;margin-top:2px;">${esc(String(data.properties?.['定位'] ?? '产业链图谱'))}</div>
      </div>`
  }
  const color = GROUP_COLORS[data.group ?? ''] ?? '#DCDFE6'
  const n = countChildren(data)
  return `
    <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;border-radius:8px;
      box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 12px 0 0;
      box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden;">
      <div style="width:6px;align-self:stretch;background:${color};flex:none;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;color:#303133;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(data.name)}</div>
        <div style="font-size:11px;color:#909399;margin-top:2px;">${esc(data.group ?? '未分组')}${n ? ` · ${n} 个子项` : ''}</div>
      </div>
    </div>`
}

/* ---------- 模式二：SVG 图标节点（nodeRenderer + nodeSize）---------- */

const iconSize = (data: TreeNodeData, variant: 'root' | 'node' | 'aggregate') =>
  variant === 'root' ? { width: 220, height: 60 } : { width: 150, height: 44 }

const iconRenderer = (ctx: NodeRenderContext): void => {
  const el = (tag: string, attrs: Record<string, string>): SVGElement => {
    const node = document.createElementNS(SVG_NS, tag)
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
    return node
  }
  if (ctx.variant === 'root') {
    ctx.group.appendChild(
      el('rect', {
        x: `${-ctx.width / 2}`,
        y: `${-ctx.height / 2}`,
        width: `${ctx.width}`,
        height: `${ctx.height}`,
        rx: '30',
        fill: '#1E6EFF',
      }),
    )
    const text = el('text', {
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      fill: '#FFFFFF',
      'font-size': '17',
      'font-weight': 'bold',
      'font-family': 'PingFang SC, Microsoft YaHei, sans-serif',
    })
    text.textContent = ctx.data.name
    ctx.group.appendChild(text)
    return
  }
  const color = GROUP_COLORS[ctx.data.group ?? ''] ?? '#C0C4CC'
  // 胶囊底板
  ctx.group.appendChild(
    el('rect', {
      x: `${-ctx.width / 2}`,
      y: `${-ctx.height / 2}`,
      width: `${ctx.width}`,
      height: `${ctx.height}`,
      rx: '22',
      fill: '#FFFFFF',
      stroke: '#E4E7ED',
    }),
  )
  // 左侧圆形图标（取名称首字）
  ctx.group.appendChild(el('circle', { cx: `${-ctx.width / 2 + 22}`, cy: '0', r: '14', fill: color }))
  const initial = el('text', {
    x: `${-ctx.width / 2 + 22}`,
    y: '0',
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    fill: '#FFFFFF',
    'font-size': '13',
    'font-weight': 'bold',
    'font-family': 'PingFang SC, Microsoft YaHei, sans-serif',
  })
  initial.textContent = ctx.data.name.slice(0, 1)
  ctx.group.appendChild(initial)
  // 名称
  const label = el('text', {
    x: `${-ctx.width / 2 + 44}`,
    y: '0',
    'dominant-baseline': 'central',
    fill: '#303133',
    'font-size': '13',
    'font-family': 'PingFang SC, Microsoft YaHei, sans-serif',
  })
  label.textContent = ctx.data.name
  ctx.group.appendChild(label)
}

/* ---------- 模式切换（重建实例）---------- */

type Mode = 'default' | 'card' | 'icon'

function build(mode: Mode): TreeInstance {
  const common = { data: industryData }
  if (mode === 'card') {
    return createBidirectionalTree(container, {
      ...common,
      nodeSize: cardSize,
      nodeTemplate: cardTemplate,
      rowHeight: 64,
    })
  }
  if (mode === 'icon') {
    return createBidirectionalTree(container, {
      ...common,
      nodeSize: iconSize,
      nodeRenderer: iconRenderer,
      rowHeight: 56,
    })
  }
  return createBidirectionalTree(container, { ...common, colorByGroup: true })
}

let chart = build('default')

function switchTo(mode: Mode): void {
  chart.destroy()
  chart = build(mode)
  // 卡片/图标模式行高更大，初始视图自动适配避免顶部裁切
  chart.zoomToFit()
}

document.querySelectorAll<HTMLButtonElement>('#mode-bar button').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode as Mode
    document
      .querySelectorAll<HTMLButtonElement>('#mode-bar button')
      .forEach(b => b.classList.toggle('active', b === btn))
    switchTo(mode)
  })
})
