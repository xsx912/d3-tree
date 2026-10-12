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
  desc: 'tooltip.formatter 返回字符串或 DOM 元素（元素模式可承载组件宿主）；ctx 提供深度/侧别/收起态/节点元素引用；tooltip.className 追加样式挂载点。配置 onNodeHover/onNodeHoverEnd 则完全自接管：内置悬浮框停用，悬停/移出由事件通知，弹窗渲染定位全归调用端。',
  setup({ canvas, overlay, setHint }) {
    type TipMode = 'element' | 'string' | 'self'
    let mode: TipMode = 'element'
    const builtInOptions = (): TreeOptions => ({
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
    })
    // 自接管模式：页面级独立弹窗（挂 body、fixed 定位贴节点元素），演示脱离库容器的完全接管
    const popover = document.createElement('div')
    popover.style.cssText =
      'position:fixed;display:none;z-index:2000;background:#fff;border:2px solid #409EFF;' +
      'border-radius:8px;padding:10px 14px;font-size:12px;line-height:1.8;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.16);pointer-events:none;max-width:260px'
    document.body.appendChild(popover)
    const selfOptions = (): TreeOptions => ({
      data: industryData,
      colorByGroup: true,
      // 配置即停用内置悬浮框：只有事件，定位/防抖/显隐全由这里自己实现
      onNodeHover: (node, ctx) => {
        const r = ctx.element.getBoundingClientRect()
        popover.innerHTML =
          `<div style="font-weight:600;margin-bottom:4px">${node.name}${ctx.aggregate ? '（聚合节点）' : ''}</div>` +
          `<div style="color:#409EFF">L${ctx.depth} · ${SIDE_NAMES[ctx.side]} · 完全自接管</div>`
        popover.style.display = 'block'
        const { offsetWidth: pw, offsetHeight: ph } = popover
        // 左侧节点弹右侧、右侧/根弹左侧（element 实时 rect，缩放后自然跟随）
        const left = ctx.side === 'left' ? r.right + 12 : r.left - pw - 12
        popover.style.left = `${Math.max(8, left)}px`
        popover.style.top = `${r.top + r.height / 2 - ph / 2}px`
      },
      onNodeHoverEnd: () => {
        popover.style.display = 'none'
      },
    })

    let tree: TreeInstance = createBidirectionalTree(canvas, builtInOptions())
    tree.zoomToFit()

    // className 只是挂载点：覆盖内联外壳需 !important（如圆角/阴影）
    const styleEl = document.createElement('style')
    styleEl.textContent = '.biz-tip { border-radius: 10px !important; }'
    canvas.appendChild(styleEl)

    const MODE_NAMES: Record<TipMode, string> = {
      element: 'DOM 元素卡片',
      string: 'HTML 字符串',
      self: '完全自接管',
    }
    const btn = document.createElement('button')
    const sync = (): void => {
      btn.textContent = `内容：${MODE_NAMES[mode]}`
      setHint(
        mode === 'self'
          ? 'onNodeHover 已配置：内置悬浮框停用，蓝色弹窗完全由页面渲染定位（悬停聚合节点也照发事件）'
          : `当前悬浮内容为${mode === 'element' ? 'DOM 元素（组件级自定义）' : 'HTML 字符串'}，悬停节点查看`,
      )
    }
    const rebuild = (): void => {
      tree.destroy()
      // 自接管与内置互斥（core 以 onNodeHover 是否配置判定），切换需重建实例
      tree = createBidirectionalTree(canvas, mode === 'self' ? selfOptions() : builtInOptions())
      tree.zoomToFit()
    }
    btn.onclick = () => {
      const prev = mode
      mode = mode === 'element' ? 'string' : mode === 'string' ? 'self' : 'element'
      // 内置两态热切换无需重建；进出自接管态必须重建（互斥配置在创建时生效）
      if (mode === 'self' || prev === 'self') rebuild()
      sync()
    }
    sync()
    overlay.appendChild(btn)
    return () => {
      tree.destroy()
      popover.remove()
      styleEl.remove()
    }
  },
}
