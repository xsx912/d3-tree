import type { DemoSources } from '../types'

export const horizontalSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>水平双向树 · d3-tree</title>
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

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
      onNodeToggle: (node, collapsed) =>
        console.log(\`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`),
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

function onToggle(node: TreeNodeData, collapsed: boolean): void {
  console.log(\`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`)
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="page">
    <BidirectionalTree ref="tree" :data="industryData" color-by-group
      @node-toggle="onToggle" />
  </div>
</template>

<style scoped>
.page { width: 100%; height: 100vh; }
</style>
`,
  react: `import { useEffect, useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import { industryData } from './data'

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  function onToggle(node: TreeNodeData, collapsed: boolean): void {
    console.log(\`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`)
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <BidirectionalTree
        ref={tree}
        data={industryData}
        colorByGroup
        onNodeToggle={onToggle}
      />
    </div>
  )
}
`,
}
