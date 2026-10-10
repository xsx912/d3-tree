import type { DemoSources } from '../types'

export const toggleSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>折叠与展开 · d3-tree</title>
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
    <button id="expand-all">全展开</button>
    <button id="collapse-all">全收起</button>
    <button id="toggle-one">toggle('r-hw')</button>
    <span class="status" id="status"></span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const status = document.getElementById('status')!
    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
      onNodeToggle: (node, collapsed) => {
        status.textContent = \`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`
      },
    })
    tree.zoomToFit()

    document.getElementById('expand-all')!.onclick = () => {
      tree.expandAll()
      tree.zoomToFit()
    }
    document.getElementById('collapse-all')!.onclick = () => {
      tree.collapseAll()
      tree.zoomToFit()
    }
    document.getElementById('toggle-one')!.onclick = () => tree.toggle('r-hw')
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
const status = ref('')

function onToggle(node: TreeNodeData, collapsed: boolean): void {
  status.value = \`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`
}

function expandAll(): void {
  tree.value?.expandAll()
  tree.value?.zoomToFit()
}

function collapseAll(): void {
  tree.value?.collapseAll()
  tree.value?.zoomToFit()
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <button @click="expandAll">全展开</button>
      <button @click="collapseAll">全收起</button>
      <button @click="tree?.toggle('r-hw')">toggle('r-hw')</button>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <BidirectionalTree ref="tree" :data="industryData" color-by-group
        @node-toggle="onToggle" />
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
  react: `import { useEffect, useRef, useState } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import { industryData } from './data'

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  function onToggle(node: TreeNodeData, collapsed: boolean): void {
    setStatus(\`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`)
  }

  function expandAll(): void {
    tree.current?.expandAll()
    tree.current?.zoomToFit()
  }

  function collapseAll(): void {
    tree.current?.collapseAll()
    tree.current?.zoomToFit()
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
    borderBottom: '1px solid #E4E7ED',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={toolbarStyle}>
        <button onClick={expandAll}>全展开</button>
        <button onClick={collapseAll}>全收起</button>
        <button onClick={() => tree.current?.toggle('r-hw')}>toggle('r-hw')</button>
        <span style={{ color: '#909399', fontSize: 13 }}>{status}</span>
      </div>
      <div style={{ flex: 1 }}>
        <BidirectionalTree ref={tree} data={industryData} colorByGroup onNodeToggle={onToggle} />
      </div>
    </div>
  )
}
`,
}
