<script setup lang="ts">
import { ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed } from '@d3-tree/vue'
import { industryData } from '../../demo/src/data'

const tree = ref<BidirectionalTreeExposed | null>(null)
const searchKw = ref('')
const hint = ref('点击节点可折叠/展开；滚轮缩放、拖拽平移')
const orientation = ref<'horizontal' | 'vertical'>('horizontal')
const linkStyle = ref<'orthogonal' | 'straight' | 'diagonal'>('orthogonal')
const groups = ref<Array<{ name: string; color: string }>>([])
const activeGroups = ref(new Set<string>())

function onSearch(): void {
  const kw = searchKw.value.trim()
  if (!kw) {
    tree.value?.clearSearch()
    hint.value = '点击节点可折叠/展开；滚轮缩放、拖拽平移'
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

const palette = new Map<string, string>()
function linkColor(link: { target: { data: { group?: string } } }): string {
  return palette.get(link.target.data.group ?? '') ?? '#C0C4CC'
}
function onGroupsForLinks(gs: Array<{ name: string; color: string }>): void {
  palette.clear()
  for (const g of gs) palette.set(g.name, g.color)
  onGroupsChange(gs)
}
</script>

<template>
  <div class="playground">
    <div class="bar">
      <input v-model="searchKw" placeholder="搜索节点…" @input="onSearch" />
      <button @click="tree?.expandAll()">全展开</button>
      <button @click="tree?.collapseAll()">全收起</button>
      <button @click="tree?.zoomToFit()">适配视窗</button>
      <button @click="tree?.exportImage({ format: 'png', scale: 2, filename: 'd3-tree' })">
        导出 PNG
      </button>
      <button
        @click="orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal'"
      >
        {{ orientation === 'horizontal' ? '垂直布局' : '水平布局' }}
      </button>
      <button
        @click="
          linkStyle =
            linkStyle === 'orthogonal' ? 'straight' : linkStyle === 'straight' ? 'diagonal' : 'orthogonal'
        "
      >
        连线：{{ linkStyle === 'orthogonal' ? '折线' : linkStyle === 'straight' ? '直线' : '曲线' }}
      </button>
      <span class="hint">{{ hint }}</span>
      <div class="legend">
        <span
          v-for="g in groups"
          :key="g.name"
          class="chip"
          :class="{ off: !activeGroups.has(g.name) }"
          @click="toggleGroup(g.name)"
        >
          <i class="dot" :style="{ background: g.color }" />{{ g.name }}
        </span>
      </div>
    </div>
    <div class="chart">
      <BidirectionalTree
        ref="tree"
        :data="industryData"
        color-by-group
        :orientation="orientation"
        :link-style="linkStyle"
        :link-color="linkColor"
        @groups-change="onGroupsForLinks"
      />
    </div>
  </div>
</template>

<style scoped>
.playground {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--vp-c-border);
}
.bar input {
  padding: 5px 10px;
  font-size: 13px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  outline: none;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  width: 150px;
}
.bar button {
  padding: 5px 12px;
  font-size: 13px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.bar button:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}
.hint {
  font-size: 12px;
  opacity: 0.65;
}
.legend {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  padding: 2px 9px;
  cursor: pointer;
  user-select: none;
}
.chip.off {
  opacity: 0.35;
  text-decoration: line-through;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.chart {
  height: 520px;
}
.chart :deep(.d3t-host) {
  width: 100%;
  height: 100%;
}
</style>
