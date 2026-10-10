import type { DemoSources } from '../types'

export const exportImageSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>导出图片 · d3-tree</title>
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
    <button id="svg">导出 SVG</button>
    <button id="png">导出 PNG</button>
    <span class="status">点击上方按钮下载文件</span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
    })
    tree.zoomToFit()

    // exportImage：format 选 svg（矢量）或 png（scale 控制倍率，默认 2x）；
    // 导出内容包含主题与自定义节点
    document.getElementById('svg')!.onclick = () =>
      tree.exportImage({ format: 'svg', filename: '产业链图谱' })
    document.getElementById('png')!.onclick = () =>
      tree.exportImage({ format: 'png', scale: 2, filename: '产业链图谱' })
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

// exportImage：format 选 svg（矢量）或 png（scale 控制倍率，默认 2x）；
// 导出内容包含主题与自定义节点
function exportSvg(): void {
  tree.value?.exportImage({ format: 'svg', filename: '产业链图谱' })
}

function exportPng(): void {
  tree.value?.exportImage({ format: 'png', scale: 2, filename: '产业链图谱' })
}
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <button @click="exportSvg">导出 SVG</button>
      <button @click="exportPng">导出 PNG</button>
      <span class="status">点击上方按钮下载文件</span>
    </div>
    <div class="tree">
      <BidirectionalTree ref="tree" :data="industryData" color-by-group />
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
  react: `import { useEffect, useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle } from '@d3-tree/react'
import { industryData } from './data'

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)

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
        {/* exportImage：format 选 svg（矢量）或 png（scale 控制倍率，默认 2x） */}
        <button onClick={() => tree.current?.exportImage({ format: 'svg', filename: '产业链图谱' })}>
          导出 SVG
        </button>
        <button onClick={() => tree.current?.exportImage({ format: 'png', scale: 2, filename: '产业链图谱' })}>
          导出 PNG
        </button>
        <span style={{ color: '#909399', fontSize: 13 }}>点击上方按钮下载文件</span>
      </div>
      <div style={{ flex: 1 }}>
        <BidirectionalTree ref={tree} data={industryData} colorByGroup />
      </div>
    </div>
  )
}
`,
}
