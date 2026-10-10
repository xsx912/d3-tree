import { createBidirectionalTree } from '@d3-tree/core'
import type { TooltipContext, TreeNodeData, TreeInstance, TreeOptions } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

const SIDE_NAMES: Record<TooltipContext['side'], string> = {
  left: '左侧',
  right: '右侧',
  center: '中枢',
}

/** 元素模式：DOM 组装的自定义悬浮卡片（真实场景可换任意组件宿主） */
function buildCard(node: TreeNodeData, ctx: TooltipContext): HTMLElement {
  const card = document.createElement('div')
  card.style.cssText = 'min-width:200px;font-size:12px;line-height:1.9'
  const title = document.createElement('div')
  title.style.cssText =
    'font-weight:600;border-bottom:1px solid #EBEEF5;padding-bottom:4px;margin-bottom:6px'
  title.textContent = node.name
  const chips = document.createElement('div')
  chips.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px'
  const chip = (text: string, bg: string): HTMLElement => {
    const el = document.createElement('span')
    el.style.cssText = `background:${bg};color:#fff;border-radius:3px;padding:1px 6px;white-space:nowrap`
    el.textContent = text
    return el
  }
  chips.append(
    chip(`深度 L${ctx.depth}`, '#409EFF'),
    chip(SIDE_NAMES[ctx.side], ctx.side === 'left' ? '#E6A23C' : ctx.side === 'right' ? '#67C23A' : '#909399'),
  )
  if (ctx.collapsed) chips.append(chip(`已收起 ${node.children?.length ?? 0} 个子节点`, '#F56C6C'))
  const props = document.createElement('div')
  props.style.color = '#909399'
  props.textContent = node.properties
    ? Object.entries(node.properties)
        .map(([k, v]) => `${k}：${String(v)}`)
        .join('　')
    : '（无属性）'
  card.append(title, chips, props)
  return card
}

export const customTooltip: DemoItem = {
  id: 'custom-tooltip',
  title: '悬浮框内容自定义',
  desc: 'tooltip.formatter 返回字符串或 DOM 元素（元素模式可承载组件宿主）；ctx 提供深度/侧别/收起态；tooltip.className 追加样式挂载点（内置外壳保留，可用 !important 覆盖）。',
  setup({ canvas, overlay, setHint }) {
    let mode: 'element' | 'string' = 'element'
    const options: TreeOptions = {
      data: industryData,
      colorByGroup: true,
      tooltip: {
        className: 'biz-tip',
        // formatter 每次 mouseenter 调用：分支读闭包变量即可热切换，无需重建实例
        formatter: (node, ctx) =>
          mode === 'element'
            ? buildCard(node, ctx)
            : `<b>${node.name}</b><div style="color:#909399">深度 L${ctx.depth} · ${SIDE_NAMES[ctx.side]}</div>`,
      },
    }
    let tree: TreeInstance = createBidirectionalTree(canvas, options)
    tree.zoomToFit()

    // className 只是挂载点：覆盖内联外壳需 !important（如圆角/阴影）
    const styleEl = document.createElement('style')
    styleEl.textContent = '.biz-tip { border-radius: 10px !important; }'
    canvas.appendChild(styleEl)

    const btn = document.createElement('button')
    const sync = (): void => {
      btn.textContent = `内容：${mode === 'element' ? 'DOM 元素卡片' : 'HTML 字符串'}`
      setHint(`当前悬浮内容为${mode === 'element' ? 'DOM 元素（组件级自定义）' : 'HTML 字符串'}，悬停节点查看`)
    }
    btn.onclick = () => {
      mode = mode === 'element' ? 'string' : 'element'
      sync()
    }
    sync()
    overlay.appendChild(btn)
    return () => {
      tree.destroy()
      styleEl.remove()
    }
  },
}
