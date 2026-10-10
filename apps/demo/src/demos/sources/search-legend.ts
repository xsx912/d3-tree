import type { DemoSources } from '../types'

export const searchLegendSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>搜索与图例过滤 · d3-tree</title>
  <!-- 在 Vite 等打包工程中运行：npm i @d3-tree/core，与 data.ts 放同一目录 -->
  <style>
    html, body { height: 100%; margin: 0; }
    body { display: flex; flex-direction: column; }
    .toolbar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; padding: 10px 12px;
      border-bottom: 1px solid #E4E7ED; }
    .toolbar input { padding: 4px 8px; }
    .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px;
      border: 1px solid #E4E7ED; border-radius: 12px; font-size: 12px; cursor: pointer;
      user-select: none; }
    .chip.off { opacity: .35; }
    .chip .dot { width: 8px; height: 8px; border-radius: 50%; }
    .status { color: #909399; font-size: 13px; }
    #tree { flex: 1; }
  </style>
</head>
<body>
  <div class="toolbar">
    <input id="search" placeholder="搜索节点…" />
    <div id="legend" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
    <span class="status" id="status"></span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const groupColors = new Map()
    const activeGroups = new Set()
    const legend = document.getElementById('legend')!
    const status = document.getElementById('status')!

    // 图例 chips：onGroupsChange 在首帧前提供分组与调色板颜色
    function renderLegend(groups) {
      legend.innerHTML = ''
      for (const { name, color } of groups) {
        activeGroups.add(name)
        const chip = document.createElement('span')
        chip.className = 'chip'
        chip.innerHTML = \`<span class="dot" style="background:\${color}"></span>\${name}\`
        chip.onclick = () => {
          if (activeGroups.has(name)) activeGroups.delete(name)
          else activeGroups.add(name)
          chip.classList.toggle('off', !activeGroups.has(name))
          // 空数组 = 不过滤，传 null 同义
          tree.setVisibleGroups(activeGroups.size ? [...activeGroups] : null)
        }
        legend.appendChild(chip)
      }
    }

    document.getElementById('search')!.addEventListener('input', (e) => {
      const kw = e.target.value.trim()
      if (!kw) {
        tree.clearSearch()
        status.textContent = ''
        return
      }
      // search：高亮命中及其祖先链，其余淡化并定位首个命中；返回命中数
      const hits = tree.search(kw)
      status.textContent = hits > 0 ? \`「\${kw}」命中 \${hits} 个节点\` : \`「\${kw}」无命中\`
    })

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      colorByGroup: true,
      // 连线按目标节点分组着色（渲染期惰性读表，未分组回退默认灰）
      linkColor: (l) => groupColors.get(l.target.data.group ?? '') ?? '#C0C4CC',
      onGroupsChange: (groups) => {
        for (const { name, color } of groups) groupColors.set(name, color)
        renderLegend(groups)
      },
    })
    tree.zoomToFit()
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TreeNodeData } from '@d3-tree/vue'
import type { LinkRenderContext } from '@d3-tree/core'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)
const keyword = ref('')
const status = ref('')
const groups = ref<Array<{ name: string; color: string }>>([])
const active = reactive(new Set<string>())
const groupColors = new Map<string, string>()

// onGroupsChange 在首帧前提供分组与调色板颜色，用来构建图例
function onGroupsChange(list: Array<{ name: string; color: string }>): void {
  groups.value = list
  for (const { name, color } of list) {
    active.add(name)
    groupColors.set(name, color)
  }
}

function onSearch(): void {
  const kw = keyword.value.trim()
  if (!kw) {
    tree.value?.clearSearch()
    status.value = ''
    return
  }
  // search：高亮命中及其祖先链，其余淡化并定位首个命中；返回命中数
  const hits = tree.value?.search(kw) ?? 0
  status.value = hits > 0 ? \`「\${kw}」命中 \${hits} 个节点\` : \`「\${kw}」无命中\`
}

function toggleGroup(name: string): void {
  if (active.has(name)) active.delete(name)
  else active.add(name)
  // 空集合 = 不过滤，传 null 同义
  tree.value?.setVisibleGroups(active.size ? [...active] : null)
}

// 连线按目标节点分组着色（渲染期惰性读表，未分组回退默认灰）
const linkColor = (l: LinkRenderContext): string =>
  groupColors.get(l.target.data.group ?? '') ?? '#C0C4CC'

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <input v-model="keyword" placeholder="搜索节点…" @input="onSearch" />
      <span v-for="g in groups" :key="g.name" class="chip"
        :class="{ off: !active.has(g.name) }" @click="toggleGroup(g.name)">
        <i class="dot" :style="{ background: g.color }" />{{ g.name }}
      </span>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <BidirectionalTree ref="tree" :data="industryData" color-by-group :link-color="linkColor"
        @groups-change="onGroupsChange" />
    </div>
  </div>
</template>

<style scoped>
.demo { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; padding: 10px 12px;
  border-bottom: 1px solid #E4E7ED; }
.toolbar input { padding: 4px 8px; }
.chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px;
  border: 1px solid #E4E7ED; border-radius: 12px; font-size: 12px; cursor: pointer;
  user-select: none; }
.chip.off { opacity: .35; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.status { color: #909399; font-size: 13px; }
.tree { flex: 1; }
</style>
`,
  react: `import { useEffect, useRef, useState } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import type { LinkRenderContext } from '@d3-tree/core'
import { industryData } from './data'

interface GroupColor {
  name: string
  color: string
}

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [groups, setGroups] = useState<GroupColor[]>([])
  const [active, setActive] = useState<Set<string>>(new Set())
  // 渲染期惰性读取的分组调色板（不放 state：linkColor 回调要读最新值）
  const groupColors = useRef(new Map<string, string>())

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  // onGroupsChange 在首帧前提供分组与调色板颜色，用来构建图例
  function onGroupsChange(list: GroupColor[]): void {
    setGroups(list)
    setActive(new Set(list.map(g => g.name)))
    for (const { name, color } of list) groupColors.current.set(name, color)
  }

  function onSearch(value: string): void {
    setKeyword(value)
    const kw = value.trim()
    if (!kw) {
      tree.current?.clearSearch()
      setStatus('')
      return
    }
    // search：高亮命中及其祖先链，其余淡化并定位首个命中；返回命中数
    const hits = tree.current?.search(kw) ?? 0
    setStatus(hits > 0 ? \`「\${kw}」命中 \${hits} 个节点\` : \`「\${kw}」无命中\`)
  }

  function toggleGroup(name: string): void {
    const next = new Set(active)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setActive(next)
    // 空集合 = 不过滤，传 null 同义
    tree.current?.setVisibleGroups(next.size ? [...next] : null)
  }

  // 连线按目标节点分组着色（渲染期惰性读表，未分组回退默认灰）
  const linkColor = (l: LinkRenderContext): string =>
    groupColors.current.get(l.target.data.group ?? '') ?? '#C0C4CC'

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', padding: '10px 12px',
    borderBottom: '1px solid #E4E7ED',
  }
  const chipStyle = (off: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px',
    border: '1px solid #E4E7ED', borderRadius: 12, fontSize: 12, cursor: 'pointer',
    userSelect: 'none', opacity: off ? 0.35 : 1,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={toolbarStyle}>
        <input
          value={keyword}
          placeholder="搜索节点…"
          onChange={e => onSearch(e.target.value)}
        />
        {groups.map(g => (
          <span key={g.name} style={chipStyle(!active.has(g.name))}
            onClick={() => toggleGroup(g.name)}>
            <i style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
            {g.name}
          </span>
        ))}
        <span style={{ color: '#909399', fontSize: 13 }}>{status}</span>
      </div>
      <div style={{ flex: 1 }}>
        <BidirectionalTree
          ref={tree}
          data={industryData}
          colorByGroup
          linkColor={linkColor}
          onGroupsChange={onGroupsChange}
        />
      </div>
    </div>
  )
}
`,
}
