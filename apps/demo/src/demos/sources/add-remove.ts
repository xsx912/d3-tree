import type { DemoSources } from '../types'

export const addRemoveSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>动态增删节点 · d3-tree</title>
  <!-- 在 Vite 等打包工程中运行：npm i @d3-tree/core，与 data.ts 放同一目录 -->
  <style>
    html, body { height: 100%; margin: 0; }
    body { display: flex; flex-direction: column; }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px;
      border-bottom: 1px solid #E4E7ED; }
    .toolbar button { padding: 4px 12px; cursor: pointer; }
    .toolbar input { padding: 4px 8px; }
    .status { color: #909399; font-size: 13px; }
    #tree { flex: 1; }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="add">追加子节点</button>
    <button id="remove">删除节点</button>
    <input id="name" placeholder="新节点名称" hidden />
    <button id="confirm" hidden>确认追加</button>
    <button id="cancel" hidden>取消</button>
    <span class="status" id="status"></span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'
    import { industryData } from './data'

    const $ = (id) => document.getElementById(id)!
    const status = $('status')
    const nameInput = $('name')

    // 本示例会改数据，拷贝一份避免污染原数据
    const options = { data: structuredClone(industryData), colorByGroup: true }
    const tree = createBidirectionalTree($('tree'), options)
    tree.zoomToFit()

    let mode = 'none' // 'none' | 'add' | 'remove'
    let picked = null
    let seq = 0

    const setMode = (next) => {
      mode = next
      picked = null
      // core 在点击时实时读该开关：选取模式下点击只回调、不折叠
      options.toggleOnNodeClick = next === 'none'
      nameInput.hidden = next !== 'add'
      $('confirm').hidden = next !== 'add'
      $('cancel').hidden = next === 'none'
      status.textContent = next === 'none' ? '选择模式后点击目标节点' : '选取模式：请点击目标节点'
    }

    options.onNodeSelect = (node) => {
      if (mode === 'none') return
      picked = node
      status.textContent = mode === 'add'
        ? \`已选父节点「\${node.name}」，输入名称后确认\`
        : \`已选节点「\${node.name}」，再次点击“删除节点”确认\`
    }

    $('add').onclick = () => setMode('add')
    $('remove').onclick = () => {
      if (mode === 'remove' && picked) {
        status.textContent = tree.removeChild(picked.id)
          ? \`已删除「\${picked.name}」\`
          : '该节点不可删除（根节点）'
        setMode('none')
        return
      }
      setMode('remove')
    }
    $('cancel').onclick = () => setMode('none')
    $('confirm').onclick = () => {
      const name = nameInput.value.trim()
      if (!picked || !name) {
        status.textContent = '请先选取父节点并输入名称'
        return
      }
      // addChild：折叠的父节点会自动展开，让新节点立即可见；根不可删（removeChild 返回 false）
      const ok = tree.addChild(picked.id, { id: \`custom-\${Date.now()}-\${seq++}\`, name })
      status.textContent = ok ? \`已在「\${picked.name}」下追加「\${name}」\` : '追加失败：父节点不存在'
      nameInput.value = ''
      setMode('none')
    }
    nameInput.addEventListener('keydown', (e) => e.key === 'Enter' && $('confirm').click())
    status.textContent = '选择模式后点击目标节点'
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
// 本示例会改数据，拷贝一份避免污染原数据
const data = structuredClone(industryData)

type Mode = 'none' | 'add' | 'remove'
const mode = ref<Mode>('none')
const newName = ref('')
const picked = ref<TreeNodeData | null>(null)
const status = ref('选择模式后点击目标节点')
let seq = 0

function setMode(next: Mode): void {
  mode.value = next
  picked.value = null
  status.value = next === 'none' ? '选择模式后点击目标节点' : '选取模式：请点击目标节点'
}

function onPick(node: TreeNodeData): void {
  if (mode.value === 'none') return
  picked.value = node
  status.value = mode.value === 'add'
    ? \`已选父节点「\${node.name}」，输入名称后确认\`
    : \`已选节点「\${node.name}」，再次点击“删除节点”确认\`
}

function confirmAdd(): void {
  const parent = picked.value
  const name = newName.value.trim()
  if (!parent || !name) {
    status.value = '请先选取父节点并输入名称'
    return
  }
  // addChild：折叠的父节点会自动展开；removeChild 根不可删（返回 false）
  const ok = tree.value?.addChild(parent.id, { id: \`custom-\${Date.now()}-\${seq++}\`, name })
  status.value = ok ? \`已在「\${parent.name}」下追加「\${name}」\` : '追加失败：父节点不存在'
  newName.value = ''
  setMode('none')
}

function remove(): void {
  if (mode.value === 'remove' && picked.value) {
    status.value = tree.value?.removeChild(picked.value.id)
      ? \`已删除「\${picked.value.name}」\`
      : '该节点不可删除（根节点）'
    setMode('none')
    return
  }
  setMode('remove')
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <button @click="setMode('add')">追加子节点</button>
      <button @click="remove">删除节点</button>
      <input v-if="mode === 'add'" v-model="newName" placeholder="新节点名称"
        @keyup.enter="confirmAdd" />
      <button v-if="mode !== 'none'" @click="setMode('none')">取消</button>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <!-- :toggle-on-node-click 随模式热更新（不重建实例）：选取模式下点击只回调 -->
      <BidirectionalTree ref="tree" :data="data" color-by-group
        :toggle-on-node-click="mode === 'none'" @node-select="onPick" />
    </div>
  </div>
</template>

<style scoped>
.demo { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px;
  border-bottom: 1px solid #E4E7ED; }
.toolbar input { padding: 4px 8px; }
.status { color: #909399; font-size: 13px; }
.tree { flex: 1; }
</style>
`,
  react: `import { useEffect, useRef, useState } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import { industryData } from './data'

type Mode = 'none' | 'add' | 'remove'

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  // 本示例会改数据：memoize 一份拷贝，避免每次渲染都触发 setData
  const [data] = useState(() => structuredClone(industryData))
  const [mode, setMode] = useState<Mode>('none')
  const [newName, setNewName] = useState('')
  const [status, setStatus] = useState('选择模式后点击目标节点')
  const picked = useRef<TreeNodeData | null>(null)
  const seq = useRef(0)

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  // 选取模式下点击只回调不折叠：热更新开关，避免重建实例丢折叠状态
  useEffect(() => {
    tree.current?.setToggleOnNodeClick(mode === 'none')
  }, [mode])

  function enterMode(next: Mode): void {
    setMode(next)
    picked.current = null
    setStatus(next === 'none' ? '选择模式后点击目标节点' : '选取模式：请点击目标节点')
  }

  function onPick(node: TreeNodeData): void {
    if (mode === 'none') return
    picked.current = node
    setStatus(
      mode === 'add'
        ? \`已选父节点「\${node.name}」，输入名称后确认\`
        : \`已选节点「\${node.name}」，再次点击“删除节点”确认\`,
    )
  }

  function confirmAdd(): void {
    const parent = picked.current
    const name = newName.trim()
    if (!parent || !name) {
      setStatus('请先选取父节点并输入名称')
      return
    }
    // addChild：折叠的父节点会自动展开；removeChild 根不可删（返回 false）
    const ok = tree.current?.addChild(parent.id, {
      id: \`custom-\${Date.now()}-\${seq.current++}\`,
      name,
    })
    setStatus(ok ? \`已在「\${parent.name}」下追加「\${name}」\` : '追加失败：父节点不存在')
    setNewName('')
    enterMode('none')
  }

  function remove(): void {
    if (mode === 'remove' && picked.current) {
      setStatus(
        tree.current?.removeChild(picked.current.id)
          ? \`已删除「\${picked.current.name}」\`
          : '该节点不可删除（根节点）',
      )
      enterMode('none')
      return
    }
    enterMode('remove')
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
    borderBottom: '1px solid #E4E7ED',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={toolbarStyle}>
        <button onClick={() => enterMode('add')}>追加子节点</button>
        <button onClick={remove}>删除节点</button>
        {mode === 'add' && (
          <input
            value={newName}
            placeholder="新节点名称"
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmAdd()}
          />
        )}
        {mode !== 'none' && <button onClick={() => enterMode('none')}>取消</button>}
        <span style={{ color: '#909399', fontSize: 13 }}>{status}</span>
      </div>
      <div style={{ flex: 1 }}>
        <BidirectionalTree
          ref={tree}
          data={data}
          colorByGroup
          onNodeSelect={onPick}
        />
      </div>
    </div>
  )
}
`,
}
