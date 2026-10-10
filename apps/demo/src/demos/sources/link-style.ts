import type { DemoSources } from '../types'

export const linkStyleSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>连线样式与颜色 · d3-tree</title>
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
    <button id="switch">连线：直角折线</button>
    <span class="status" id="status"></span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const STYLES = ['orthogonal', 'straight', 'diagonal']
    const NAMES = { orthogonal: '直角折线', straight: '直线', diagonal: '贝塞尔曲线' }
    const status = document.getElementById('status')!

    const groupColors = new Map()
    const options = {
      data: industryData,
      linkStyle: STYLES[0],
      // linkColor 传回调：按目标节点分组着色，未分组回退默认灰
      linkColor: (l) => groupColors.get(l.target.data.group ?? '') ?? '#C0C4CC',
      onGroupsChange: (groups) => {
        for (const { name, color } of groups) groupColors.set(name, color)
      },
    }

    let tree = createBidirectionalTree(document.getElementById('tree')!, options)
    tree.zoomToFit()

    const btn = document.getElementById('switch')!
    let styleIdx = 0
    btn.onclick = () => {
      styleIdx = (styleIdx + 1) % STYLES.length
      options.linkStyle = STYLES[styleIdx]
      btn.textContent = \`连线：\${NAMES[STYLES[styleIdx]]}\`
      // linkStyle 不可热更：销毁重建（data 对象相同，折叠态在 core 内按 id 保留）
      tree.destroy()
      tree = createBidirectionalTree(document.getElementById('tree')!, options)
      tree.zoomToFit()
      status.textContent = \`当前连线：\${NAMES[STYLES[styleIdx]]}（颜色随分组）\`
    }
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, LinkStyle } from '@d3-tree/vue'
import type { LinkRenderContext } from '@d3-tree/core'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)
const status = ref('')

const STYLES: LinkStyle[] = ['orthogonal', 'straight', 'diagonal']
const NAMES: Record<LinkStyle, string> = {
  orthogonal: '直角折线', straight: '直线', diagonal: '贝塞尔曲线',
}
let styleIdx = 0
const style = ref<LinkStyle>(STYLES[0])

const groupColors = new Map<string, string>()
// linkColor 传回调：按目标节点分组着色，未分组回退默认灰
const linkColor = (l: LinkRenderContext): string =>
  groupColors.get(l.target.data.group ?? '') ?? '#C0C4CC'

function onGroupsChange(groups: Array<{ name: string; color: string }>): void {
  for (const { name, color } of groups) groupColors.set(name, color)
}

function switchStyle(): void {
  styleIdx = (styleIdx + 1) % STYLES.length
  style.value = STYLES[styleIdx]
  status.value = \`当前连线：\${NAMES[STYLES[styleIdx]]}（颜色随分组）\`
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <button @click="switchStyle">连线：{{ NAMES[style] }}</button>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <!-- linkStyle 变化时封装内部自动重建实例，无需手动 destroy -->
      <BidirectionalTree ref="tree" :data="industryData" :link-style="style"
        :link-color="linkColor" @groups-change="onGroupsChange" />
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
import type { BidirectionalTreeHandle, LinkStyle } from '@d3-tree/react'
import type { LinkRenderContext } from '@d3-tree/core'
import { industryData } from './data'

const STYLES: LinkStyle[] = ['orthogonal', 'straight', 'diagonal']
const NAMES: Record<LinkStyle, string> = {
  orthogonal: '直角折线', straight: '直线', diagonal: '贝塞尔曲线',
}

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  const [styleIdx, setStyleIdx] = useState(0)
  const style = STYLES[styleIdx]

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  // linkColor 传回调：按目标节点分组着色，未分组回退默认灰
  const groupColors = useRef(new Map<string, string>())
  const linkColor = (l: LinkRenderContext): string =>
    groupColors.current.get(l.target.data.group ?? '') ?? '#C0C4CC'

  function onGroupsChange(groups: Array<{ name: string; color: string }>): void {
    for (const { name, color } of groups) groupColors.current.set(name, color)
  }

  function switchStyle(): void {
    setStyleIdx(i => (i + 1) % STYLES.length)
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
    borderBottom: '1px solid #E4E7ED',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={toolbarStyle}>
        <button onClick={switchStyle}>{\`连线：\${NAMES[style]}\`}</button>
        <span style={{ color: '#909399', fontSize: 13 }}>
          当前连线：{NAMES[style]}（颜色随分组）
        </span>
      </div>
      <div style={{ flex: 1 }}>
        {/* linkStyle 变化时封装内部自动重建实例，无需手动 destroy */}
        <BidirectionalTree
          ref={tree}
          data={industryData}
          linkStyle={style}
          linkColor={linkColor}
          onGroupsChange={onGroupsChange}
        />
      </div>
    </div>
  )
}
`,
}
