import type { DemoSources } from '../types'

export const themeTextsSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>主题与国际化 · d3-tree</title>
  <!-- 在 Vite 等打包工程中运行：npm i @d3-tree/core，与 data.ts 放同一目录 -->
  <style>
    html, body { height: 100%; margin: 0; }
    #tree { width: 100%; height: 100%; background: #0F172A; }
  </style>
</head>
<body>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      // theme 对内置主题做浅合并，任意字段可覆盖（背景/节点/连线/徽标/调色板…）
      theme: {
        background: '#0F172A',
        rootFill: '#38BDF8',
        rootText: '#0F172A',
        nodeFill: '#1E293B',
        nodeStroke: '#334155',
        nodeText: '#E2E8F0',
        aggregateText: '#94A3B8',
        link: '#475569',
        badgeFill: '#1E293B',
        badgeStroke: '#64748B',
        badgeText: '#94A3B8',
        hitStroke: '#38BDF8',
      },
      // texts 替换内置文案（聚合节点、徽标悬停提示），作用于渲染与导出
      texts: {
        aggregateLabel: (remaining) => \`Expand (\${remaining})\`,
        badgeExpandTitle: (n) => \`Expand (\${n} descendants)\`,
        badgeCollapseTitle: (n) => \`Collapse (\${n} descendants)\`,
      },
      onNodeToggle: (node, collapsed) =>
        console.log(\`「\${node.name}」\${collapsed ? 'collapsed' : 'expanded'}\`),
    })
    tree.zoomToFit()
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TreeNodeData } from '@d3-tree/vue'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)

// theme 对内置主题做浅合并，任意字段可覆盖（背景/节点/连线/徽标/调色板…）
const darkTheme = {
  background: '#0F172A',
  rootFill: '#38BDF8',
  rootText: '#0F172A',
  nodeFill: '#1E293B',
  nodeStroke: '#334155',
  nodeText: '#E2E8F0',
  aggregateText: '#94A3B8',
  link: '#475569',
  badgeFill: '#1E293B',
  badgeStroke: '#64748B',
  badgeText: '#94A3B8',
  hitStroke: '#38BDF8',
}

// texts 替换内置文案（聚合节点、徽标悬停提示），作用于渲染与导出
const texts = {
  aggregateLabel: (remaining: number) => \`Expand (\${remaining})\`,
  badgeExpandTitle: (n: number) => \`Expand (\${n} descendants)\`,
  badgeCollapseTitle: (n: number) => \`Collapse (\${n} descendants)\`,
}

function onToggle(node: TreeNodeData, collapsed: boolean): void {
  console.log(\`「\${node.name}」\${collapsed ? 'collapsed' : 'expanded'}\`)
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="page">
    <BidirectionalTree ref="tree" class="tree" :data="industryData"
      :theme="darkTheme" :texts="texts" @node-toggle="onToggle" />
  </div>
</template>

<style scoped>
.page { width: 100%; height: 100vh; }
.tree { background: #0F172A; }
</style>
`,
  react: `import { useEffect, useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import { industryData } from './data'

// theme 对内置主题做浅合并，任意字段可覆盖（背景/节点/连线/徽标/调色板…）
const darkTheme = {
  background: '#0F172A',
  rootFill: '#38BDF8',
  rootText: '#0F172A',
  nodeFill: '#1E293B',
  nodeStroke: '#334155',
  nodeText: '#E2E8F0',
  aggregateText: '#94A3B8',
  link: '#475569',
  badgeFill: '#1E293B',
  badgeStroke: '#64748B',
  badgeText: '#94A3B8',
  hitStroke: '#38BDF8',
}

// texts 替换内置文案（聚合节点、徽标悬停提示），作用于渲染与导出
const texts = {
  aggregateLabel: (remaining: number) => \`Expand (\${remaining})\`,
  badgeExpandTitle: (n: number) => \`Expand (\${n} descendants)\`,
  badgeCollapseTitle: (n: number) => \`Collapse (\${n} descendants)\`,
}

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0F172A' }}>
      <BidirectionalTree
        ref={tree}
        data={industryData}
        theme={darkTheme}
        texts={texts}
        onNodeToggle={(node: TreeNodeData, collapsed: boolean) =>
          console.log(\`「\${node.name}」\${collapsed ? 'collapsed' : 'expanded'}\`)}
      />
    </div>
  )
}
`,
}
