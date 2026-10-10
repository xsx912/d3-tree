/**
 * 每个示例对应的 Vue / React 封装写法。
 * 片段只保留该示例教学点的关键 prop/方法，均可在 Vue/React 页直接运行。
 */
export interface WrapperSnippet {
  vue: string
  react: string
}

export const wrapperSnippets: Record<string, WrapperSnippet> = {
  horizontal: {
    vue: `<script setup lang="ts">
import { BidirectionalTree } from '@d3-tree/vue'
import { industryData } from './data'
</script>

<template>
  <BidirectionalTree :data="industryData" color-by-group
    @node-toggle="(node, collapsed) => console.log(node.name, collapsed)" />
</template>`,
    react: `import { BidirectionalTree } from '@d3-tree/react'
import { industryData } from './data'

export function App() {
  return (
    <BidirectionalTree
      data={industryData}
      colorByGroup
      onNodeToggle={(node, collapsed) => console.log(node.name, collapsed)}
    />
  )
}`,
  },
  vertical: {
    vue: `<template>
  <BidirectionalTree :data="data" orientation="vertical" />
</template>`,
    react: `<BidirectionalTree data={data} orientation="vertical" />`,
  },
  aggregate: {
    vue: `<template>
  <!-- 每父节点最多 3 个可见子节点，超出聚合为「展开 (N)」 -->
  <BidirectionalTree :data="data" :visible-children-limit="3" />
</template>`,
    react: `{/* 每父节点最多 3 个可见子节点，超出聚合为「展开 (N)」 */}
<BidirectionalTree data={data} visibleChildrenLimit={3} />`,
  },
  toggle: {
    vue: `<script setup lang="ts">
import { ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed } from '@d3-tree/vue'

const tree = ref<BidirectionalTreeExposed>()
</script>

<template>
  <BidirectionalTree ref="tree" :data="data" @node-toggle="onToggle" />
  <button @click="tree?.expandAll()">全展开</button>
  <button @click="tree?.collapseAll()">全收起</button>
  <button @click="tree?.toggle('r-hw')">toggle('r-hw')</button>
</template>`,
    react: `const tree = useRef<BidirectionalTreeHandle>(null)

<BidirectionalTree ref={tree} data={data} onNodeToggle={onToggle} />
<button onClick={() => tree.current?.expandAll()}>全展开</button>
<button onClick={() => tree.current?.collapseAll()}>全收起</button>
<button onClick={() => tree.current?.toggle('r-hw')}>toggle('r-hw')</button>`,
  },
  'toggle-region': {
    vue: `<script setup lang="ts">
// 模板字符串里含 data-d3t-toggle 标记的元素点击即切换折叠态
const card = (data, variant) => \`
  <div>
    <b>\${data.name}</b>
    \${data.children?.length
      ? '<span data-d3t-toggle style="cursor:pointer">▾</span>'
      : ''}
  </div>\`
</script>

<template>
  <!-- toggle-on-node-click:false：整卡点击只回调，仅标记区域与徽标可折叠 -->
  <BidirectionalTree :data="data" :node-template="card"
    :node-size="(_d, v) => (v === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 })"
    :toggle-on-node-click="false" @node-toggle="onToggle" />
</template>`,
    react: `// 模板字符串里含 data-d3t-toggle 标记的元素点击即切换折叠态
const card = (data, variant) => \`
  <div>
    <b>\${data.name}</b>
    \${data.children?.length
      ? '<span data-d3t-toggle style="cursor:pointer">▾</span>'
      : ''}
  </div>\`

// toggleOnNodeClick={false}：整卡点击只回调，仅标记区域与徽标可折叠
<BidirectionalTree
  data={data}
  nodeTemplate={card}
  nodeSize={(_d, v) => (v === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 })}
  toggleOnNodeClick={false}
  onNodeToggle={onToggle}
/>`,
  },
  'add-remove': {
    vue: `<script setup lang="ts">
const tree = ref<BidirectionalTreeExposed>()

function confirmAdd(parent, name) {
  tree.value?.addChild(parent.id, { id: crypto.randomUUID(), name })
}
function remove(node) {
  tree.value?.removeChild(node.id) // 根节点不可删
}
</script>

<template>
  <!-- 选取模式下点击只回调不折叠 -->
  <BidirectionalTree ref="tree" :data="data"
    :toggle-on-node-click="false" @node-select="onPick" />
</template>`,
    react: `const tree = useRef<BidirectionalTreeHandle>(null)

tree.current?.addChild(parent.id, { id: crypto.randomUUID(), name })
tree.current?.removeChild(node.id) // 根节点不可删

// 选取模式下点击只回调不折叠
<BidirectionalTree ref={tree} data={data}
  toggleOnNodeClick={false} onNodeSelect={onPick} />`,
  },
  'lazy-load': {
    vue: `<script setup lang="ts">
async function loadChildren(parent) {
  const res = await fetch(\`/api/children?\${parent.id}\`)
  return res.json() // 空数组 = 末级，节点自动清除 hasChildren
}
</script>

<template>
  <BidirectionalTree :data="data" :load-children="loadChildren"
    @load-error="(err, parent) => retry(parent)" />
</template>`,
    react: `async function loadChildren(parent) {
  const res = await fetch(\`/api/children?\${parent.id}\`)
  return res.json() // 空数组 = 末级，节点自动清除 hasChildren
}

<BidirectionalTree data={data} loadChildren={loadChildren}
  onLoadError={(err, parent) => retry(parent)} />`,
  },
  'search-legend': {
    vue: `<script setup lang="ts">
const tree = ref<BidirectionalTreeExposed>()
const active = ref([])

function onSearch(kw) {
  const hits = tree.value?.search(kw)
  if (!kw || !hits) tree.value?.clearSearch()
}
function toggleGroup(name) {
  active.value = active.value.includes(name)
    ? active.value.filter(g => g !== name)
    : [...active.value, name]
  tree.value?.setVisibleGroups(active.value.length ? active.value : null)
}
</script>

<template>
  <BidirectionalTree ref="tree" :data="data" color-by-group
    @groups-change="buildLegend" />
</template>`,
    react: `const tree = useRef<BidirectionalTreeHandle>(null)

function onSearch(kw) {
  const hits = tree.current?.search(kw)
  if (!kw || !hits) tree.current?.clearSearch()
}
function toggleGroup(name) {
  const next = /* toggle in set */
  tree.current?.setVisibleGroups(next.length ? next : null)
}

<BidirectionalTree ref={tree} data={data} colorByGroup
  onGroupsChange={buildLegend} />`,
  },
  'node-template': {
    vue: `<script setup lang="ts">
// 返回 HTML 字符串（或元素），渲染进节点 foreignObject；导出 PNG 需内联样式
const card = (data, variant) => \`
  <div style="display:flex;align-items:center;">
    <b>\${data.name}</b>
    <span>\${data.children?.length ?? 0} 个子项</span>
  </div>\`
</script>

<template>
  <BidirectionalTree :data="data" :node-template="card"
    :node-size="(_d, v) => (v === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 })" />
</template>`,
    react: `// 返回 HTML 字符串（或元素），渲染进节点 foreignObject；导出 PNG 需内联样式
const card = (data, variant) => \`
  <div style="display:flex;align-items:center;">
    <b>\${data.name}</b>
    <span>\${data.children?.length ?? 0} 个子项</span>
  </div>\`

<BidirectionalTree data={data} nodeTemplate={card}
  nodeSize={(_d, v) => (v === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 })} />`,
  },
  'node-renderer': {
    vue: `<script setup lang="ts">
// ctx.group 已定位在节点中心，直接 append SVG；导出无损
function iconRenderer(ctx) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', String(-ctx.width / 2))
  rect.setAttribute('width', String(ctx.width))
  ctx.group.appendChild(rect)
}
</script>

<template>
  <BidirectionalTree :data="data" :node-renderer="iconRenderer"
    :node-size="(_d, v) => (v === 'root' ? { width: 200, height: 52 } : { width: 150, height: 44 })" />
</template>`,
    react: `// ctx.group 已定位在节点中心，直接 append SVG；导出无损
function iconRenderer(ctx) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', String(-ctx.width / 2))
  rect.setAttribute('width', String(ctx.width))
  ctx.group.appendChild(rect)
}

<BidirectionalTree data={data} nodeRenderer={iconRenderer}
  nodeSize={(_d, v) => (v === 'root' ? { width: 200, height: 52 } : { width: 150, height: 44 })} />`,
  },
  'link-style': {
    vue: `<script setup lang="ts">
const style = ref('orthogonal') // orthogonal | straight | diagonal
</script>

<template>
  <BidirectionalTree :data="data" :link-style="style"
    :link-color="l => groupColors.get(l.target.data.group) ?? '#C0C4CC'" />
</template>`,
    react: `const [style, setStyle] = useState('orthogonal') // orthogonal | straight | diagonal

<BidirectionalTree data={data} linkStyle={style}
  linkColor={l => groupColors.get(l.target.data.group) ?? '#C0C4CC'} />`,
  },
  'theme-texts': {
    vue: `<script setup lang="ts">
const darkTheme = {
  background: '#0F172A', rootFill: '#38BDF8', nodeFill: '#1E293B',
  nodeText: '#E2E8F0', link: '#475569',
}
const texts = {
  aggregateLabel: n => \`Expand (\${n})\`,
  badgeExpandTitle: n => \`Expand (\${n} descendants)\`,
}
</script>

<template>
  <BidirectionalTree :data="data" :theme="darkTheme" :texts="texts" />
</template>`,
    react: `const darkTheme = {
  background: '#0F172A', rootFill: '#38BDF8', nodeFill: '#1E293B',
  nodeText: '#E2E8F0', link: '#475569',
}
const texts = {
  aggregateLabel: n => \`Expand (\${n})\`,
  badgeExpandTitle: n => \`Expand (\${n} descendants)\`,
}

<BidirectionalTree data={data} theme={darkTheme} texts={texts} />`,
  },
  'export-image': {
    vue: `<script setup lang="ts">
const tree = ref<BidirectionalTreeExposed>()
</script>

<template>
  <BidirectionalTree ref="tree" :data="data" />
  <button @click="tree?.exportImage({ format: 'svg', filename: '图谱' })">导出 SVG</button>
  <button @click="tree?.exportImage({ format: 'png', scale: 2, filename: '图谱' })">导出 PNG</button>
</template>`,
    react: `const tree = useRef<BidirectionalTreeHandle>(null)

<BidirectionalTree ref={tree} data={data} />
<button onClick={() => tree.current?.exportImage({ format: 'svg', filename: '图谱' })}>导出 SVG</button>
<button onClick={() => tree.current?.exportImage({ format: 'png', scale: 2, filename: '图谱' })}>导出 PNG</button>`,
  },
}
