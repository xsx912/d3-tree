import type { DemoSources } from '../types'

export const verticalSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>垂直布局 · d3-tree</title>
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

    // orientation: 'vertical' —— 根在上、子树向下生长（上下分侧）
    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
      orientation: 'vertical',
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
    <!-- orientation: 'vertical' —— 根在上、子树向下生长（上下分侧） -->
    <BidirectionalTree ref="tree" :data="industryData" color-by-group
      orientation="vertical" />
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
      {/* orientation="vertical" —— 根在上、子树向下生长（上下分侧） */}
      <BidirectionalTree ref={tree} data={industryData} colorByGroup orientation="vertical" />
    </div>
  )
}
`,
}
