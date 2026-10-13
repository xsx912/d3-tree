import type { DemoSources } from '../types'

export const customTooltipSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>悬浮框内容自定义 · d3-tree</title>
  <!-- 在 Vite 等打包工程中运行：未发布时用 file: 接入本地 @d3-tree/core（见安装文档），与 data.ts 放同一目录 -->
  <style>
    html, body { height: 100%; margin: 0; }
    body { display: flex; flex-direction: column; }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px;
      border-bottom: 1px solid #E4E7ED; }
    .toolbar button { padding: 4px 12px; cursor: pointer; }
    .status { color: #909399; font-size: 13px; }
    #tree { flex: 1; }
    /* tooltip.className 只是挂载点：覆盖内联外壳需 !important（如圆角/阴影） */
    .biz-tip { border-radius: 10px !important; }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="switch"></button>
    <span class="status" id="status"></span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const SIDE_NAMES = { left: '左侧', right: '右侧', center: '中枢' }
    const status = document.getElementById('status')!

    // 元素模式：DOM 组装的自定义悬浮卡片（真实场景可换任意组件宿主）
    function buildCard(node, ctx) {
      const card = document.createElement('div')
      card.style.cssText = 'min-width:200px;font-size:12px;line-height:1.9'
      const title = document.createElement('div')
      title.style.cssText =
        'font-weight:600;border-bottom:1px solid #EBEEF5;padding-bottom:4px;margin-bottom:6px'
      title.textContent = node.name
      const chips = document.createElement('div')
      chips.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px'
      const chip = (text, bg) => {
        const el = document.createElement('span')
        el.style.cssText = 'background:' + bg + ';color:#fff;border-radius:3px;padding:1px 6px;white-space:nowrap'
        el.textContent = text
        return el
      }
      chips.append(
        chip('深度 L' + ctx.depth, '#409EFF'),
        chip(SIDE_NAMES[ctx.side], ctx.side === 'left' ? '#E6A23C' : ctx.side === 'right' ? '#67C23A' : '#909399'),
      )
      if (ctx.collapsed) chips.append(chip('已收起 ' + (node.children?.length ?? 0) + ' 个子节点', '#F56C6C'))
      const props = document.createElement('div')
      props.style.color = '#909399'
      props.textContent = node.properties
        ? Object.entries(node.properties).map(([k, v]) => k + '：' + v).join('　')
        : '（无属性）'
      card.append(title, chips, props)
      return card
    }

    let mode = 'element'
    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
      tooltip: {
        className: 'biz-tip',
        // formatter 每次 mouseenter 调用：分支读闭包变量即可热切换，无需重建实例
        formatter: (node, ctx) =>
          mode === 'element'
            ? buildCard(node, ctx)
            : '<b>' + node.name + '</b><div style="color:#909399">深度 L' + ctx.depth + ' · ' + SIDE_NAMES[ctx.side] + '</div>',
      },
    })
    tree.zoomToFit()

    const btn = document.getElementById('switch')!
    function sync() {
      btn.textContent = '内容：' + (mode === 'element' ? 'DOM 元素卡片' : 'HTML 字符串')
      status.textContent = '当前悬浮内容为' + (mode === 'element' ? 'DOM 元素（组件级自定义）' : 'HTML 字符串') + '，悬停节点查看'
    }
    btn.onclick = () => {
      mode = mode === 'element' ? 'string' : 'element'
      sync()
    }
    sync()

    // ---- 完全自接管：不想用内置悬浮框时，把上面 tooltip 配置换成 onNodeHover/onNodeHoverEnd ----
    // 配置即停用内置（外壳/锚定/防抖/淡入淡出全关），渲染定位全归调用端；
    // ctx.element 是节点 g 引用（getBoundingClientRect 实时，可直接 anchor 给 floating-ui）。
    // 完整可运行示例：
    //
    // const popover = document.createElement('div')
    // popover.style.cssText = 'position:fixed;display:none;z-index:2000;background:#fff;' +
    //   'border:2px solid #409EFF;border-radius:8px;padding:10px 14px;font-size:12px'
    // document.body.appendChild(popover)
    // const tree = createBidirectionalTree(el, {
    //   data: industryData,
    //   colorByGroup: true,
    //   onNodeHover: (node, ctx) => {
    //     const r = ctx.element.getBoundingClientRect() // 节点实时位置（缩放后自然跟随）
    //     popover.innerHTML = '<b>' + node.name + (ctx.aggregate ? '（聚合）' : '') + '</b>'
    //     popover.style.display = 'block'
    //     popover.style.left = (ctx.side === 'left' ? r.right + 12 : r.left - popover.offsetWidth - 12) + 'px'
    //     popover.style.top = (r.top + r.height / 2 - popover.offsetHeight / 2) + 'px'
    //   },
    //   onNodeHoverEnd: () => { popover.style.display = 'none' }, // 移出立即触发（要防抖自行实现）
    // })
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TooltipContext } from '@d3-tree/vue'
import type { TreeNodeData } from '@d3-tree/core'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)
const mode = ref<'element' | 'string'>('element')
const status = ref('')

const SIDE_NAMES: Record<TooltipContext['side'], string> = {
  left: '左侧', right: '右侧', center: '中枢',
}

// 元素模式：DOM 组装的自定义悬浮卡片（真实场景可换任意组件宿主）
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
    el.style.cssText = \`background:\${bg};color:#fff;border-radius:3px;padding:1px 6px;white-space:nowrap\`
    el.textContent = text
    return el
  }
  chips.append(
    chip(\`深度 L\${ctx.depth}\`, '#409EFF'),
    chip(SIDE_NAMES[ctx.side], ctx.side === 'left' ? '#E6A23C' : ctx.side === 'right' ? '#67C23A' : '#909399'),
  )
  if (ctx.collapsed) chips.append(chip(\`已收起 \${node.children?.length ?? 0} 个子节点\`, '#F56C6C'))
  const props = document.createElement('div')
  props.style.color = '#909399'
  props.textContent = node.properties
    ? Object.entries(node.properties).map(([k, v]) => \`\${k}：\${String(v)}\`).join('　')
    : '（无属性）'
  card.append(title, chips, props)
  return card
}

// setup 作用域内只定义一次，身份稳定：mode 热切换不触发重建
function tooltipFormatter(node: TreeNodeData, ctx: TooltipContext): string | HTMLElement {
  return mode.value === 'element'
    ? buildCard(node, ctx)
    : \`<b>\${node.name}</b><div style="color:#909399">深度 L\${ctx.depth} · \${SIDE_NAMES[ctx.side]}</div>\`
}

function switchMode(): void {
  mode.value = mode.value === 'element' ? 'string' : 'element'
  status.value = '当前悬浮内容为' + (mode.value === 'element' ? 'DOM 元素（组件级自定义）' : 'HTML 字符串') + '，悬停节点查看'
}
status.value = '当前悬浮内容为DOM 元素（组件级自定义），悬停节点查看'

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <button @click="switchMode">内容：{{ mode === 'element' ? 'DOM 元素卡片' : 'HTML 字符串' }}</button>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <BidirectionalTree ref="tree" :data="industryData" color-by-group
        :tooltip-formatter="tooltipFormatter" tooltip-class-name="biz-tip" />
    </div>
  </div>
</template>

<style scoped>
.demo { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px;
  border-bottom: 1px solid #E4E7ED; }
.status { color: #909399; font-size: 13px; }
.tree { flex: 1; }
</style>

<style>
/* tooltip.className 只是挂载点：覆盖内联外壳需 !important（如圆角/阴影）；非 scoped 才能命中悬浮层 */
.biz-tip { border-radius: 10px !important; }
</style>

<!--
  完全自接管：不想用内置悬浮框（含 #tooltip 插槽）时，去掉 tooltip 相关配置，
  换成悬停事件（配置即停用内置，渲染定位全归调用端）：

  <BidirectionalTree ref="tree" :data="industryData" color-by-group
    @node-hover="onHover" @node-hover-end="onHoverEnd" />

  const popover = ref<HTMLElement | null>(null) // 自己渲染的弹窗（如 Teleport 到 body）
  function onHover(node: TreeNodeData, ctx: TooltipContext) {
    const r = ctx.element.getBoundingClientRect() // 节点实时位置（缩放后自然跟随）
    popoverState.value = { name: node.name, aggregate: ctx.aggregate, x: r.right + 12, y: r.top }
  }
  function onHoverEnd(node: TreeNodeData) {
    popoverState.value = null // 移出立即触发（要防抖自行实现）
  }
-->
`,
  react: `import { useCallback, useEffect, useRef, useState } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TooltipContext } from '@d3-tree/react'
import type { TreeNodeData } from '@d3-tree/core'
import { industryData } from './data'

const SIDE_NAMES: Record<TooltipContext['side'], string> = {
  left: '左侧', right: '右侧', center: '中枢',
}

// 元素模式：DOM 组装的自定义悬浮卡片（真实场景可换任意组件宿主）
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
    el.style.cssText = \`background:\${bg};color:#fff;border-radius:3px;padding:1px 6px;white-space:nowrap\`
    el.textContent = text
    return el
  }
  chips.append(
    chip(\`深度 L\${ctx.depth}\`, '#409EFF'),
    chip(SIDE_NAMES[ctx.side], ctx.side === 'left' ? '#E6A23C' : ctx.side === 'right' ? '#67C23A' : '#909399'),
  )
  if (ctx.collapsed) chips.append(chip(\`已收起 \${node.children?.length ?? 0} 个子节点\`, '#F56C6C'))
  const props = document.createElement('div')
  props.style.color = '#909399'
  props.textContent = node.properties
    ? Object.entries(node.properties).map(([k, v]) => \`\${k}：\${String(v)}\`).join('　')
    : '（无属性）'
  card.append(title, chips, props)
  return card
}

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  const [mode, setMode] = useState<'element' | 'string'>('element')
  // 稳定 formatter 身份：mode 走 ref，切换内容不触发整树重建
  const modeRef = useRef(mode)
  modeRef.current = mode
  const tooltipFormatter = useCallback(
    (node: TreeNodeData, ctx: TooltipContext): string | HTMLElement =>
      modeRef.current === 'element'
        ? buildCard(node, ctx)
        : \`<b>\${node.name}</b><div style="color:#909399">深度 L\${ctx.depth} · \${SIDE_NAMES[ctx.side]}</div>\`,
    [],
  )

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
    borderBottom: '1px solid #E4E7ED',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={toolbarStyle}>
        <button onClick={() => setMode(m => (m === 'element' ? 'string' : 'element'))}>
          内容：{mode === 'element' ? 'DOM 元素卡片' : 'HTML 字符串'}
        </button>
        <span style={{ color: '#909399', fontSize: 13 }}>
          当前悬浮内容为{mode === 'element' ? 'DOM 元素（组件级自定义）' : 'HTML 字符串'}，悬停节点查看
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <BidirectionalTree
          ref={tree}
          data={industryData}
          colorByGroup
          tooltipFormatter={tooltipFormatter}
          tooltipClassName="biz-tip"
        />
      </div>
      <style>{\`.biz-tip { border-radius: 10px !important; }\`}</style>
    </div>
  )
}

// ---- 完全自接管：不想用内置悬浮框（含 renderTooltip）时，去掉 tooltip 相关配置，
// 换成悬停事件（配置即停用内置，渲染定位全归调用端）：
//
// function App() {
//   const [popover, setPopover] = useState<{ name: string; x: number; y: number } | null>(null)
//   const onNodeHover = useCallback((node: TreeNodeData, ctx: TooltipContext) => {
//     const r = ctx.element.getBoundingClientRect() // 节点实时位置（缩放后自然跟随）
//     setPopover({ name: node.name + (ctx.aggregate ? '（聚合）' : ''), x: r.right + 12, y: r.top })
//   }, [])
//   const onNodeHoverEnd = useCallback(() => setPopover(null), []) // 移出立即触发
//   return (
//     <>
//       <BidirectionalTree data={data} colorByGroup
//         onNodeHover={onNodeHover} onNodeHoverEnd={onNodeHoverEnd} />
//       {popover && (
//         <div style={{ position: 'fixed', left: popover.x, top: popover.y, zIndex: 2000 }}>
//           {popover.name}
//         </div>
//       )}
//     </>
//   )
// }
`,
}
