<script setup lang="ts">
import { ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TreeNodeData } from '@d3-tree/vue'
import { industryData } from '../data'

const tree = ref<BidirectionalTreeExposed | null>(null)

type PickMode = 'none' | 'add' | 'remove'
const mode = ref<PickMode>('none')
const pickedName = ref('')
const pickedId = ref<string | null>(null)
const newName = ref('')
const hint = ref('点击节点可折叠/展开；滚轮缩放、拖拽平移')
const defaultHint = '点击节点可折叠/展开；滚轮缩放、拖拽平移'
const searchKw = ref('')
const groups = ref<Array<{ name: string; color: string }>>([])
const activeGroups = ref(new Set<string>())
let seq = 0

function setMode(next: PickMode): void {
  mode.value = next
  pickedId.value = null
  tree.value?.setToggleOnNodeClick(next === 'none')
  if (next === 'none') hint.value = defaultHint
  else hint.value = '选取模式：请点击目标节点'
}

function onNodeSelect(node: TreeNodeData): void {
  if (mode.value === 'none') return
  pickedId.value = node.id
  pickedName.value = node.name
  if (mode.value === 'add') hint.value = `已选父节点「${node.name}」，输入名称后确认`
  else hint.value = `已选节点「${node.name}」，再次点击“删除节点”确认删除`
}

function confirmAdd(): void {
  const name = newName.value.trim()
  if (!pickedId.value || !name) {
    hint.value = '请先选取父节点并输入名称'
    return
  }
  const ok = tree.value?.addChild(pickedId.value, { id: `custom-${Date.now()}-${seq++}`, name })
  hint.value = ok ? `已在「${pickedName.value}」下追加「${name}」` : '追加失败：父节点不存在'
  newName.value = ''
  setMode('none')
}

function onRemove(): void {
  if (mode.value === 'remove' && pickedId.value) {
    const ok = tree.value?.removeChild(pickedId.value)
    hint.value = ok ? `已删除「${pickedName.value}」` : '该节点不可删除（根节点）'
    setMode('none')
    return
  }
  setMode('remove')
}

function onSearch(): void {
  const kw = searchKw.value.trim()
  if (!kw) {
    tree.value?.clearSearch()
    hint.value = defaultHint
    return
  }
  const hits = tree.value?.search(kw) ?? 0
  hint.value = hits > 0 ? `「${kw}」命中 ${hits} 个节点` : `「${kw}」无命中`
}

function toggleGroup(name: string): void {
  if (activeGroups.value.has(name)) activeGroups.value.delete(name)
  else activeGroups.value.add(name)
  tree.value?.setVisibleGroups(activeGroups.value.size ? [...activeGroups.value] : null)
}

function onGroupsChange(gs: Array<{ name: string; color: string }>): void {
  groups.value = gs
  activeGroups.value = new Set(gs.map(g => g.name))
}
</script>

<template>
  <header>
    <h1>双向树图谱 · Vue 3 组件</h1>
    <nav>
      <a href="/index.html">原生</a>
      <a href="/vue.html">Vue</a>
      <a href="/react.html">React</a>
    </nav>
  </header>
  <div id="toolbar">
    <button @click="setMode('add')">追加子节点</button>
    <input v-if="mode === 'add'" v-model="newName" placeholder="新节点名称"
      @keydown.enter="confirmAdd" />
    <button v-if="mode === 'add'" class="primary" @click="confirmAdd">确认追加</button>
    <button v-if="mode !== 'none'" @click="setMode('none')">取消</button>
    <button :disabled="mode === 'add'" @click="onRemove">删除节点</button>
    <span class="divider"></span>
    <input v-model="searchKw" placeholder="搜索节点…" @input="onSearch" />
    <button @click="tree?.exportImage({ format: 'svg', filename: '产业链图谱-Vue' })">导出 SVG</button>
    <button @click="tree?.exportImage({ format: 'png', scale: 2, filename: '产业链图谱-Vue' })">导出 PNG</button>
    <span class="divider"></span>
    <button @click="tree?.expandAll(); tree?.zoomToFit()">全展开</button>
    <button @click="tree?.collapseAll(); tree?.zoomToFit()">全收起</button>
    <button @click="tree?.zoomToFit()">适配视窗</button>
    <span id="hint" :class="{ active: mode !== 'none' }">{{ hint }}</span>
    <div id="legend">
      <span v-for="g in groups" :key="g.name" class="chip"
        :class="{ off: !activeGroups.has(g.name) }" @click="toggleGroup(g.name)">
        <span class="dot" :style="{ background: g.color }"></span>{{ g.name }}
      </span>
    </div>
  </div>
  <div id="chart">
    <BidirectionalTree ref="tree" :data="industryData" color-by-group
      @node-select="onNodeSelect" @groups-change="onGroupsChange" />
  </div>
</template>

<style>
#app { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
#chart .d3t-host { width: 100%; height: 100%; }
</style>
