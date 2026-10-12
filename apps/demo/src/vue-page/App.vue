<script setup lang="ts">
import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import type { PropType } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TooltipContext, TreeNodeData } from '@d3-tree/vue'
import { industryData } from '../data'

const SIDE_NAMES: Record<string, string> = { left: '左侧', right: '右侧', center: '中枢' }

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

// ---- 悬浮框实例缓存验证（#tooltip 插槽 + tooltipCache 开关） ----
const tooltipCache = ref(true)
const tipShowDelay = ref(0)
const tipHideDelay = ref(150)
const tipFadeDuration = ref(150)
const tipMounts = ref(0)
const tipUnmounts = ref(0)
const tipLogs = ref<string[]>([])

function pushTipLog(msg: string): void {
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  tipLogs.value = [...tipLogs.value, `${t} ${msg}`].slice(-6)
}

function toggleTipCache(): void {
  tooltipCache.value = !tooltipCache.value
  pushTipLog(`实例缓存切换为「${tooltipCache.value ? '开' : '关'}」，整树按配置重建`)
}

/** 悬浮卡内容组件：内部计数器用于验证缓存模式下组件状态是否跨悬停留 */
const TooltipCard = defineComponent({
  name: 'TooltipCard',
  props: {
    node: { type: Object as PropType<TreeNodeData>, required: true },
    ctx: { type: Object as PropType<TooltipContext>, required: true },
  },
  setup(p) {
    const count = ref(0)
    onMounted(() => {
      tipMounts.value++
      pushTipLog(`挂载「${p.node.name}」`)
    })
    onUnmounted(() => {
      tipUnmounts.value++
      pushTipLog(`卸载「${p.node.name}」`)
    })
    return () =>
      h('div', { style: 'min-width:220px' }, [
        h('div', { style: 'font-weight:600;margin-bottom:4px' }, p.node.name),
        h(
          'div',
          { style: 'color:#409EFF;font-size:12px;margin-bottom:8px' },
          `L${p.ctx.depth} · ${SIDE_NAMES[p.ctx.side] ?? p.ctx.side} · ${p.ctx.collapsed ? '已收起' : '展开中'}`,
        ),
        h(
          'button',
          {
            style: 'font-size:12px;padding:2px 10px;cursor:pointer',
            onClick: () => {
              count.value++
            },
          },
          `内部状态：${count.value}（点我 +1）`,
        ),
      ])
  },
})
</script>

<template>
  <header>
    <h1>双向树图谱 · Vue 3 组件</h1>
    <nav>
      <a href="/index.html">示例中心</a>
      <a href="/vue.html" class="active" aria-current="page">Vue</a>
      <a href="/react.html">React</a>
    </nav>
  </header>
  <div id="toolbar">
    <div class="tb-group" role="group" aria-label="编辑">
      <span class="tb-label">编辑</span>
      <div class="tb-controls">
        <button @click="setMode('add')">追加子节点</button>
        <button :disabled="mode === 'add'" @click="onRemove">删除节点</button>
        <input v-if="mode === 'add'" v-model="newName" placeholder="新节点名称" aria-label="新节点名称"
          @keydown.enter="confirmAdd" />
        <button v-if="mode === 'add'" class="primary" @click="confirmAdd">确认追加</button>
        <button v-if="mode !== 'none'" @click="setMode('none')">取消</button>
      </div>
    </div>
    <span class="divider"></span>
    <div class="tb-group" role="group" aria-label="搜索">
      <span class="tb-label">搜索</span>
      <div class="tb-controls">
        <input v-model="searchKw" placeholder="关键词…" aria-label="搜索节点" @input="onSearch" />
      </div>
    </div>
    <span class="divider"></span>
    <div class="tb-group" role="group" aria-label="导出">
      <span class="tb-label">导出</span>
      <div class="tb-controls">
        <button @click="tree?.exportImage({ format: 'svg', filename: '产业链图谱-Vue' })">SVG</button>
        <button @click="tree?.exportImage({ format: 'png', scale: 2, filename: '产业链图谱-Vue' })">PNG</button>
      </div>
    </div>
    <span class="divider"></span>
    <div class="tb-group" role="group" aria-label="视图">
      <span class="tb-label">视图</span>
      <div class="tb-controls">
        <button @click="tree?.expandAll(); tree?.zoomToFit()">全展开</button>
        <button @click="tree?.collapseAll(); tree?.zoomToFit()">全收起</button>
        <button @click="tree?.zoomToFit()">适配视窗</button>
      </div>
    </div>
    <span class="divider"></span>
    <div class="tb-group" role="group" aria-label="悬浮框">
      <span class="tb-label">悬浮框</span>
      <div class="tb-controls">
        <button :class="{ primary: !tooltipCache }" @click="toggleTipCache">
          实例缓存：{{ tooltipCache ? '开' : '关' }}
        </button>
        <label class="tb-check">显示
          <input type="number" min="0" step="50" style="width: 56px" v-model.number="tipShowDelay"
            aria-label="移入显示延时（毫秒）" @change="tipShowDelay = Math.max(0, tipShowDelay || 0)">
        </label>
        <label class="tb-check">延时
          <input type="number" min="0" step="50" style="width: 56px" v-model.number="tipHideDelay"
            aria-label="隐藏防抖延时（毫秒）" @change="tipHideDelay = Math.max(0, tipHideDelay || 0)">
        </label>
        <label class="tb-check">时长
          <input type="number" min="0" step="50" style="width: 56px" v-model.number="tipFadeDuration"
            aria-label="淡入淡出时长（毫秒）" @change="tipFadeDuration = Math.max(0, tipFadeDuration || 0)">
        </label>
        <span class="tb-stat">挂载 {{ tipMounts }} · 卸载 {{ tipUnmounts }}</span>
      </div>
    </div>
    <span id="hint" :class="{ active: mode !== 'none' }">{{ hint }}</span>
    <div id="legend" aria-label="分组图例">
      <span v-for="g in groups" :key="g.name" class="chip"
        :class="{ off: !activeGroups.has(g.name) }" @click="toggleGroup(g.name)">
        <span class="dot" :style="{ background: g.color }"></span>{{ g.name }}
      </span>
    </div>
  </div>
  <div id="chart">
    <BidirectionalTree ref="tree" :data="industryData" color-by-group :tooltip-cache="tooltipCache"
      :tooltip-show-delay="tipShowDelay" :tooltip-hide-delay="tipHideDelay"
      :tooltip-fade-duration="tipFadeDuration"
      @node-select="onNodeSelect" @groups-change="onGroupsChange">
      <template #tooltip="{ node, ctx }">
        <TooltipCard :node="node" :ctx="ctx" />
      </template>
    </BidirectionalTree>
  </div>
  <div id="tip-log" aria-live="polite">
    <div v-for="(l, i) in tipLogs" :key="i">{{ l }}</div>
  </div>
</template>

<style>
#app { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
#chart .d3t-host { width: 100%; height: 100%; }
#tip-log {
  position: fixed; right: 12px; bottom: 12px; z-index: 30; max-width: 280px;
  padding: 8px 12px; background: rgba(255, 255, 255, 0.92);
  border: 1px solid #ebeef5; border-radius: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 12px; line-height: 1.8; color: #606266; pointer-events: none;
}
</style>
