import type { DemoSources } from '../types'

export const aggregateSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>子节点聚合 · d3-tree</title>
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

    // 每父节点最多 3 个可见子节点，超出聚合为「展开 (N)」，点击释放
    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      visibleChildrenLimit: 3,
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
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="page">
    <!-- 每父节点最多 3 个可见子节点，超出聚合为「展开 (N)」，点击释放 -->
    <BidirectionalTree ref="tree" :data="industryData" :visible-children-limit="3" />
  </div>
</template>

<style scoped>
.page { width: 100%; height: 100vh; }
</style>
`,
  react: `import { useEffect, useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle } from '@d3-tree/react'
import { industryData } from './data'

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {/* 每父节点最多 3 个可见子节点，超出聚合为「展开 (N)」，点击释放 */}
      <BidirectionalTree ref={tree} data={industryData} visibleChildrenLimit={3} />
    </div>
  )
}
`,
}
