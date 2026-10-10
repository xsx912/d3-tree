import type { DemoSources } from '../types'

export const nodeRendererSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>SVG 图标节点 · d3-tree</title>
  <!-- 在 Vite 等打包工程中运行：npm i @d3-tree/core，与 data.ts 放同一目录 -->
  <style>
    html, body { height: 100%; margin: 0; }
    #tree { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const GROUP_COLORS: Record<string, string> = {
      建筑: '#5B8FF9', 医疗: '#5AD8A6', 汽车: '#F6BD16', 装备: '#E8684A',
      金融: '#6DC8EC', 硬件: '#9270CA', 软件: '#FF9D4D',
    }

    const el = (tag, attrs) => {
      const node = document.createElementNS(SVG_NS, tag)
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
      return node
    }

    // nodeRenderer：ctx.group 已定位在节点中心，append 任意 SVG 内容即可（导出 PNG/SVG 无损）
    function iconRenderer(ctx) {
      if (ctx.variant === 'root') {
        ctx.group.appendChild(el('rect', {
          x: \`\${-ctx.width / 2}\`, y: \`\${-ctx.height / 2}\`,
          width: \`\${ctx.width}\`, height: \`\${ctx.height}\`, rx: '28', fill: '#1E6EFF',
        }))
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
      ctx.group.appendChild(el('rect', {
        x: \`\${-ctx.width / 2}\`, y: \`\${-ctx.height / 2}\`,
        width: \`\${ctx.width}\`, height: \`\${ctx.height}\`, rx: '22',
        fill: '#fff', stroke: '#E4E7ED',
      }))
      ctx.group.appendChild(el('circle', { cx: \`\${-ctx.width / 2 + 20}\`, cy: '0', r: '13', fill: color }))
      const initial = el('text', {
        x: \`\${-ctx.width / 2 + 20}\`, y: '0', 'text-anchor': 'middle',
        'dominant-baseline': 'central', fill: '#fff', 'font-size': '12', 'font-weight': 'bold',
      })
      initial.textContent = ctx.data.name.slice(0, 1)
      ctx.group.appendChild(initial)
      const label = el('text', {
        x: \`\${-ctx.width / 2 + 40}\`, y: '0', 'dominant-baseline': 'central',
        fill: '#303133', 'font-size': '13',
      })
      label.textContent = ctx.data.name
      ctx.group.appendChild(label)
    }

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      nodeRenderer: iconRenderer,
      nodeSize: (_d, variant) =>
        variant === 'root' ? { width: 200, height: 52 } : { width: 150, height: 44 },
      rowHeight: 56,
    })
    tree.zoomToFit()
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed } from '@d3-tree/vue'
import type { NodeRenderer } from '@d3-tree/core'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)

const SVG_NS = 'http://www.w3.org/2000/svg'
const GROUP_COLORS: Record<string, string> = {
  建筑: '#5B8FF9', 医疗: '#5AD8A6', 汽车: '#F6BD16', 装备: '#E8684A',
  金融: '#6DC8EC', 硬件: '#9270CA', 软件: '#FF9D4D',
}

const el = (tag: string, attrs: Record<string, string]): SVGElement => {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

// nodeRenderer：ctx.group 已定位在节点中心，append 任意 SVG 内容即可（导出 PNG/SVG 无损）
const iconRenderer: NodeRenderer = (ctx) => {
  if (ctx.variant === 'root') {
    ctx.group.appendChild(el('rect', {
      x: \`\${-ctx.width / 2}\`, y: \`\${-ctx.height / 2}\`,
      width: \`\${ctx.width}\`, height: \`\${ctx.height}\`, rx: '28', fill: '#1E6EFF',
    }))
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
  ctx.group.appendChild(el('rect', {
    x: \`\${-ctx.width / 2}\`, y: \`\${-ctx.height / 2}\`,
    width: \`\${ctx.width}\`, height: \`\${ctx.height}\`, rx: '22',
    fill: '#fff', stroke: '#E4E7ED',
  }))
  ctx.group.appendChild(el('circle', { cx: \`\${-ctx.width / 2 + 20}\`, cy: '0', r: '13', fill: color }))
  const initial = el('text', {
    x: \`\${-ctx.width / 2 + 20}\`, y: '0', 'text-anchor': 'middle',
    'dominant-baseline': 'central', fill: '#fff', 'font-size': '12', 'font-weight': 'bold',
  })
  initial.textContent = ctx.data.name.slice(0, 1)
  ctx.group.appendChild(initial)
  const label = el('text', {
    x: \`\${-ctx.width / 2 + 40}\`, y: '0', 'dominant-baseline': 'central',
    fill: '#303133', 'font-size': '13',
  })
  label.textContent = ctx.data.name
  ctx.group.appendChild(label)
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="page">
    <BidirectionalTree ref="tree" :data="industryData" :node-renderer="iconRenderer"
      :node-size="(_d, v) => (v === 'root' ? { width: 200, height: 52 } : { width: 150, height: 44 })"
      :row-height="56" />
  </div>
</template>

<style scoped>
.page { width: 100%; height: 100vh; }
</style>
`,
  react: `import { useEffect, useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle } from '@d3-tree/react'
import type { NodeRenderer } from '@d3-tree/core'
import { industryData } from './data'

const SVG_NS = 'http://www.w3.org/2000/svg'
const GROUP_COLORS: Record<string, string> = {
  建筑: '#5B8FF9', 医疗: '#5AD8A6', 汽车: '#F6BD16', 装备: '#E8684A',
  金融: '#6DC8EC', 硬件: '#9270CA', 软件: '#FF9D4D',
}

const el = (tag: string, attrs: Record<string, string>): SVGElement => {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

// nodeRenderer：ctx.group 已定位在节点中心，append 任意 SVG 内容即可（导出 PNG/SVG 无损）
const iconRenderer: NodeRenderer = (ctx) => {
  if (ctx.variant === 'root') {
    ctx.group.appendChild(el('rect', {
      x: \`\${-ctx.width / 2}\`, y: \`\${-ctx.height / 2}\`,
      width: \`\${ctx.width}\`, height: \`\${ctx.height}\`, rx: '28', fill: '#1E6EFF',
    }))
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
  ctx.group.appendChild(el('rect', {
    x: \`\${-ctx.width / 2}\`, y: \`\${-ctx.height / 2}\`,
    width: \`\${ctx.width}\`, height: \`\${ctx.height}\`, rx: '22',
    fill: '#fff', stroke: '#E4E7ED',
  }))
  ctx.group.appendChild(el('circle', { cx: \`\${-ctx.width / 2 + 20}\`, cy: '0', r: '13', fill: color }))
  const initial = el('text', {
    x: \`\${-ctx.width / 2 + 20}\`, y: '0', 'text-anchor': 'middle',
    'dominant-baseline': 'central', fill: '#fff', 'font-size': '12', 'font-weight': 'bold',
  })
  initial.textContent = ctx.data.name.slice(0, 1)
  ctx.group.appendChild(initial)
  const label = el('text', {
    x: \`\${-ctx.width / 2 + 40}\`, y: '0', 'dominant-baseline': 'central',
    fill: '#303133', 'font-size': '13',
  })
  label.textContent = ctx.data.name
  ctx.group.appendChild(label)
}

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <BidirectionalTree
        ref={tree}
        data={industryData}
        nodeRenderer={iconRenderer}
        nodeSize={(_d, v) => (v === 'root' ? { width: 200, height: 52 } : { width: 150, height: 44 })}
        rowHeight={56}
      />
    </div>
  )
}
`,
}
