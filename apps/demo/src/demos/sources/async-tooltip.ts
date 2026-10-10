import type { DemoSources } from '../types'

export const asyncTooltipSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>异步数据悬浮卡（单实例） · d3-tree</title>
  <!-- 在 Vite 等打包工程中运行：npm i @d3-tree/core，与 data.ts 放同一目录 -->
  <style>
    html, body { height: 100%; margin: 0; }
    body { display: flex; flex-direction: column; }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px;
      border-bottom: 1px solid #E4E7ED; }
    .toolbar button { padding: 4px 12px; cursor: pointer; }
    .status { color: #909399; font-size: 13px; }
    #tree { flex: 1; }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="clear">清空详情缓存</button>
    <span class="status" id="status">悬停节点查看异步悬浮卡；同节点第二次悬停命中缓存秒出</span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const SIDE_NAMES = { left: '左侧', right: '右侧', center: '中枢' }
    const status = document.getElementById('status')!

    // ---- Mock 接口：延迟返回 + 按 id 缓存（真实业务换成 fetch/axios） ----
    const detailCache = new Map()
    function mockFetchNodeDetail(node) {
      const cached = detailCache.get(node.id)
      if (cached) return Promise.resolve(cached)
      return new Promise(resolve => {
        const latency = 300 + Math.random() * 500
        setTimeout(() => {
          const detail = {
            详情: '「' + node.name + '」的异步详情来自 Mock API',
            接口延迟: Math.round(latency) + 'ms',
            快照时间: new Date().toLocaleTimeString(),
          }
          detailCache.set(node.id, detail)
          resolve(detail)
        }, latency)
      })
    }

    // ---- 常驻单实例宿主：formatter 每次返回同一个 div，只更新内部内容 ----
    const host = document.createElement('div')
    host.style.cssText = 'min-width:220px;font-size:12px;line-height:1.9'
    // 过期守卫：慢请求回来时悬停已切到其他节点则丢弃（纯 core 无 AbortController 的等价手法）
    let seq = 0

    function renderSkeleton(name) {
      host.innerHTML =
        '<div style="font-weight:600;margin-bottom:6px">' + name + '</div>' +
        '<div style="color:#909399">详情加载中…</div>'
    }
    function renderDetail(name, side, depth, detail) {
      const rows = Object.entries(detail)
        .map(([k, v]) => '<div><span style="color:#909399">' + k + '：</span>' + v + '</div>')
        .join('')
      host.innerHTML =
        '<div style="font-weight:600;border-bottom:1px solid #EBEEF5;padding-bottom:4px;margin-bottom:6px">' + name + '</div>' +
        '<div style="color:#409EFF;margin-bottom:4px">L' + depth + ' · ' + side + '</div>' + rows
    }

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
      tooltip: {
        // 悬浮框已锚定节点（不跟光标）；移入换节点时 core 重调 formatter
        formatter: (node, ctx) => {
          const mySeq = ++seq
          renderSkeleton(node.name)
          mockFetchNodeDetail(node).then(detail => {
            if (mySeq !== seq) return  // 过期响应：丢弃
            renderDetail(node.name, SIDE_NAMES[ctx.side], ctx.depth, detail)
          })
          return host
        },
      },
    })
    tree.zoomToFit()

    document.getElementById('clear')!.onclick = () => {
      detailCache.clear()
      status.textContent = '缓存已清空：再次悬停节点将重新走异步接口'
    }
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { defineComponent, h, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TooltipContext } from '@d3-tree/vue'
import type { TreeNodeData } from '@d3-tree/core'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)
const status = ref('悬停节点查看异步悬浮卡；同节点第二次悬停命中缓存秒出')
const SIDE_NAMES: Record<string, string> = { left: '左侧', right: '右侧', center: '中枢' }

// ---- Mock 接口：延迟返回 + 按 id 缓存（真实业务换成 fetch/axios） ----
const detailCache = new Map<string, Record<string, string>>()
function mockFetchNodeDetail(node: TreeNodeData): Promise<Record<string, string>> {
  const cached = detailCache.get(node.id)
  if (cached) return Promise.resolve(cached)
  return new Promise(resolve => {
    const latency = 300 + Math.random() * 500
    setTimeout(() => {
      const detail = {
        详情: \`「\${node.name}」的异步详情来自 Mock API\`,
        接口延迟: \`\${Math.round(latency)}ms\`,
        快照时间: new Date().toLocaleTimeString(),
      }
      detailCache.set(node.id, detail)
      resolve(detail)
    }, latency)
  })
}

// ---- 插槽根组件（实例常驻）：watch 节点 → 拉取（过期丢弃）→ 命中缓存秒出 ----
const TooltipCard = defineComponent({
  name: 'TooltipCard',
  props: {
    node: { type: Object as PropType<TreeNodeData>, required: true },
    ctx: { type: Object as PropType<TooltipContext>, required: true },
  },
  setup(p) {
    const detail = ref<Record<string, string> | null>(null)
    // 过期守卫：悬停切到其他节点后回来的慢响应丢弃（真实业务可用 AbortController）
    let seq = 0
    watch(
      () => p.node.id,
      () => {
        const mySeq = ++seq
        detail.value = null
        mockFetchNodeDetail(p.node).then(d => {
          if (mySeq !== seq) return
          detail.value = d
        })
      },
      { immediate: true },
    )
    return () => {
      const frame = 'min-width:220px;font-size:12px;line-height:1.9'
      if (!detail.value) {
        return h('div', { style: frame }, [
          h('div', { style: 'font-weight:600;margin-bottom:6px' }, p.node.name),
          h('div', { style: 'color:#909399' }, '详情加载中…'),
        ])
      }
      return h('div', { style: frame }, [
        h('div', { style: 'font-weight:600;border-bottom:1px solid #EBEEF5;padding-bottom:4px;margin-bottom:6px' }, p.node.name),
        h('div', { style: 'color:#409EFF;margin-bottom:4px' }, \`L\${p.ctx.depth} · \${SIDE_NAMES[p.ctx.side]}\`),
        ...Object.entries(detail.value).map(([k, v]) =>
          h('div', [h('span', { style: 'color:#909399' }, \`\${k}：\`), v])),
      ])
    }
  },
})

function onClear(): void {
  detailCache.clear()
  status.value = '缓存已清空：再次悬停节点将重新走异步接口'
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <button @click="onClear">清空详情缓存</button>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <!-- #tooltip 作用域插槽：封装层托管单实例宿主（hover 只更新 props，移出仅隐藏） -->
      <BidirectionalTree ref="tree" :data="industryData" color-by-group>
        <template #tooltip="{ node, ctx }">
          <TooltipCard :node="node" :ctx="ctx" />
        </template>
      </BidirectionalTree>
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
`,
  react: `import { useCallback, useEffect, useRef, useState } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TooltipContext } from '@d3-tree/react'
import type { TreeNodeData } from '@d3-tree/core'
import { industryData } from './data'

const SIDE_NAMES: Record<string, string> = { left: '左侧', right: '右侧', center: '中枢' }

// ---- Mock 接口：延迟返回 + 按 id 缓存（真实业务换成 fetch/axios） ----
const detailCache = new Map<string, Record<string, string>>()
function mockFetchNodeDetail(node: TreeNodeData): Promise<Record<string, string>> {
  const cached = detailCache.get(node.id)
  if (cached) return Promise.resolve(cached)
  return new Promise(resolve => {
    const latency = 300 + Math.random() * 500
    setTimeout(() => {
      const detail = {
        详情: \`「\${node.name}」的异步详情来自 Mock API\`,
        接口延迟: \`\${Math.round(latency)}ms\`,
        快照时间: new Date().toLocaleTimeString(),
      }
      detailCache.set(node.id, detail)
      resolve(detail)
    }, latency)
  })
}

const cardStyle: React.CSSProperties = {
  minWidth: 220, fontSize: 12, lineHeight: 1.9,
}
const titleStyle: React.CSSProperties = {
  fontWeight: 600, borderBottom: '1px solid #EBEEF5', paddingBottom: 4, marginBottom: 6,
}

// 悬浮卡根组件（实例常驻）：useEffect 监听节点变化 → 拉取（stale 守卫）→ 命中缓存秒出
function TooltipCard({ node, ctx }: { node: TreeNodeData; ctx: TooltipContext }) {
  const [detail, setDetail] = useState<Record<string, string> | null>(null)
  useEffect(() => {
    let stale = false  // 真实业务可用 AbortController 取消请求
    setDetail(null)
    mockFetchNodeDetail(node).then(d => {
      if (!stale) setDetail(d)
    })
    return () => { stale = true }
  }, [node.id])
  return detail ? (
    <div style={cardStyle}>
      <div style={titleStyle}>{node.name}</div>
      <div style={{ color: '#409EFF', marginBottom: 4 }}>
        {sideName(ctx)} · L{ctx.depth}
      </div>
      {Object.entries(detail).map(([k, v]) => (
        <div key={k}>
          <span style={{ color: '#909399' }}>{k}：</span>{v}
        </div>
      ))}
    </div>
  ) : (
    <div style={cardStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{node.name}</div>
      <div style={{ color: '#909399' }}>详情加载中…</div>
    </div>
  )
}

function sideName(ctx: TooltipContext): string {
  return SIDE_NAMES[ctx.side] ?? ctx.side
}

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  const [status, setStatus] = useState('悬停节点查看异步悬浮卡；同节点第二次悬停命中缓存秒出')

  // renderTooltip 身份稳定（useCallback）：变化会销毁重建整树
  const renderTooltip = useCallback(
    (node: TreeNodeData, ctx: TooltipContext) => <TooltipCard node={node} ctx={ctx} />,
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
        <button onClick={() => {
          detailCache.clear()
          setStatus('缓存已清空：再次悬停节点将重新走异步接口')
        }}>清空详情缓存</button>
        <span style={{ color: '#909399', fontSize: 13 }}>{status}</span>
      </div>
      <div style={{ flex: 1 }}>
        {/* renderTooltip：封装层托管常驻 createRoot（单实例，hover 只重渲染） */}
        <BidirectionalTree
          ref={tree}
          data={industryData}
          colorByGroup
          renderTooltip={renderTooltip}
        />
      </div>
    </div>
  )
}
`,
}
