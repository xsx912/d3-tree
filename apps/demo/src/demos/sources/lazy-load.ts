import type { DemoSources } from '../types'

export const lazyLoadSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>接口懒加载 · d3-tree</title>
  <style>
    html, body { height: 100%; margin: 0; }
    body { display: flex; flex-direction: column; }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px;
      border-bottom: 1px solid #E4E7ED; font-size: 13px; color: #606266; }
    .status { color: #909399; }
    #tree { flex: 1; }
  </style>
</head>
<body>
  <div class="toolbar">
    <label><input type="checkbox" id="fail" /> 模拟接口失败</label>
    <span id="count">Mock 请求：0 次</span>
    <span class="status" id="status"></span>
  </div>
  <div id="tree"></div>
  <script type="module">
    import { createBidirectionalTree } from '@d3-tree/core'

    // —— 数据与 Mock 接口内联，粘贴即可运行；实际项目把 mockFetchChildren 换成真实请求 ——

    // 只有本地无 children、且标记 hasChildren 的节点，展开时才触发 loadChildren
    const lazyData = {
      id: 'hq',
      name: '集团总部',
      children: [
        {
          id: 'east', name: '华东分公司',
          children: [
            { id: 'east-1', name: '市场营销中心', hasChildren: true },
            { id: 'east-2', name: '客户成功部', hasChildren: true },
            { id: 'east-3', name: '解决方案部', hasChildren: true },
            { id: 'east-4', name: '交付实施部', hasChildren: true },
          ],
        },
        {
          id: 'south', name: '华南分公司',
          children: [
            { id: 'south-1', name: '市场拓展部', hasChildren: true },
            { id: 'south-2', name: '大客户部', hasChildren: true },
            { id: 'south-3', name: '售前技术部', hasChildren: true },
            { id: 'south-4', name: '实施交付部', hasChildren: true },
          ],
        },
        {
          id: 'lab', name: '创新研究院',
          children: [
            { id: 'lab-1', name: '架构研究组', hasChildren: true },
            { id: 'lab-2', name: '算法研究组', hasChildren: true },
            { id: 'lab-3', name: '数据平台组', hasChildren: true },
            { id: 'lab-4', name: '安全实验室', hasChildren: true },
          ],
        },
      ],
    }

    // 以 id 的路径深度模拟层级（hq → hq/1 → hq/1/2 …），到达 MAX_DEPTH 返回空数组 = 末级
    const MAX_DEPTH = 5
    const depthOf = (id) => id.split('/').length - 1

    function mockFetchChildren(parent) {
      const latency = 400 + Math.random() * 500
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (document.getElementById('fail').checked) {
            reject(new Error('模拟接口异常'))
            return
          }
          const depth = depthOf(parent.id)
          if (depth >= MAX_DEPTH) {
            resolve([]) // 空数组：视为末级，节点自动清除 hasChildren 标记
            return
          }
          resolve(
            Array.from({ length: 6 }, (_, i) => ({
              id: \`\${parent.id}/\${i + 1}\`,
              name: \`远程节点 L\${depth + 1}-\${i + 1}\`,
              hasChildren: depth + 1 < MAX_DEPTH,
            })),
          )
        }, latency)
      })
    }

    // —— 图谱 ——

    const count = document.getElementById('count')!
    const status = document.getElementById('status')!
    let requests = 0

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: lazyData,
      loadChildren: (parent) => {
        requests += 1
        count.textContent = \`Mock 请求：\${requests} 次\`
        status.textContent = \`正在拉取「\${parent.name}」的下一级…\`
        return mockFetchChildren(parent)
      },
      onLoadError: (_error, parent) => {
        status.textContent = \`「\${parent.name}」拉取失败，可重试\`
      },
      onNodeToggle: (node, collapsed) => {
        status.textContent = \`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`
      },
    })
    tree.zoomToFit()
  </script>
</body>
</html>
`,
  vue: `<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed, TreeNodeData } from '@d3-tree/vue'

const tree = ref<BidirectionalTreeExposed | null>(null)
const failMode = ref(false)
const requests = ref(0)
const status = ref('')

// —— 数据与 Mock 接口内联，粘贴即可运行；实际项目把 mockFetchChildren 换成真实请求 ——

// 只有本地无 children、且标记 hasChildren 的节点，展开时才触发 loadChildren
const lazyData: TreeNodeData = {
  id: 'hq',
  name: '集团总部',
  children: [
    {
      id: 'east', name: '华东分公司',
      children: [
        { id: 'east-1', name: '市场营销中心', hasChildren: true },
        { id: 'east-2', name: '客户成功部', hasChildren: true },
        { id: 'east-3', name: '解决方案部', hasChildren: true },
        { id: 'east-4', name: '交付实施部', hasChildren: true },
      ],
    },
    {
      id: 'south', name: '华南分公司',
      children: [
        { id: 'south-1', name: '市场拓展部', hasChildren: true },
        { id: 'south-2', name: '大客户部', hasChildren: true },
        { id: 'south-3', name: '售前技术部', hasChildren: true },
        { id: 'south-4', name: '实施交付部', hasChildren: true },
      ],
    },
    {
      id: 'lab', name: '创新研究院',
      children: [
        { id: 'lab-1', name: '架构研究组', hasChildren: true },
        { id: 'lab-2', name: '算法研究组', hasChildren: true },
        { id: 'lab-3', name: '数据平台组', hasChildren: true },
        { id: 'lab-4', name: '安全实验室', hasChildren: true },
      ],
    },
  ],
}

// 以 id 的路径深度模拟层级（hq → hq/1 → hq/1/2 …），到达 MAX_DEPTH 返回空数组 = 末级
const MAX_DEPTH = 5
const depthOf = (id: string): number => id.split('/').length - 1

function mockFetchChildren(parent: TreeNodeData): Promise<TreeNodeData[]> {
  const latency = 400 + Math.random() * 500
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failMode.value) {
        reject(new Error('模拟接口异常'))
        return
      }
      const depth = depthOf(parent.id)
      if (depth >= MAX_DEPTH) {
        resolve([]) // 空数组：视为末级，节点自动清除 hasChildren 标记
        return
      }
      resolve(
        Array.from({ length: 6 }, (_, i) => ({
          id: \`\${parent.id}/\${i + 1}\`,
          name: \`远程节点 L\${depth + 1}-\${i + 1}\`,
          hasChildren: depth + 1 < MAX_DEPTH,
        })),
      )
    }, latency)
  })
}

function loadChildren(parent: TreeNodeData): Promise<TreeNodeData[]> {
  requests.value += 1
  status.value = \`正在拉取「\${parent.name}」的下一级…\`
  return mockFetchChildren(parent)
}

function onLoadError(_error: unknown, parent: TreeNodeData): void {
  status.value = \`「\${parent.name}」拉取失败，可重试\`
}

function onToggle(node: TreeNodeData, collapsed: boolean): void {
  status.value = \`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <label><input v-model="failMode" type="checkbox" /> 模拟接口失败</label>
      <span>Mock 请求：{{ requests }} 次</span>
      <span class="status">{{ status }}</span>
    </div>
    <div class="tree">
      <BidirectionalTree ref="tree" :data="lazyData" :load-children="loadChildren"
        @load-error="onLoadError" @node-toggle="onToggle" />
    </div>
  </div>
</template>

<style scoped>
.demo { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; gap: 12px; align-items: center; padding: 10px 12px;
  border-bottom: 1px solid #E4E7ED; font-size: 13px; color: #606266; }
.status { color: #909399; }
.tree { flex: 1; }
</style>
`,
  react: `import { useEffect, useRef, useState } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'

// 以 id 的路径深度模拟层级（hq → hq/1 → hq/1/2 …），到达 MAX_DEPTH 返回空数组 = 末级
const MAX_DEPTH = 5
const depthOf = (id: string): number => id.split('/').length - 1

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  const [failMode, setFailMode] = useState(false)
  const [requests, setRequests] = useState(0)
  const [status, setStatus] = useState('')

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  // —— 数据与 Mock 接口内联，粘贴即可运行；实际项目把 mockFetchChildren 换成真实请求 ——

  // 只有本地无 children、且标记 hasChildren 的节点，展开时才触发 loadChildren
  const lazyData: TreeNodeData = {
    id: 'hq',
    name: '集团总部',
    children: [
      {
        id: 'east', name: '华东分公司',
        children: [
          { id: 'east-1', name: '市场营销中心', hasChildren: true },
          { id: 'east-2', name: '客户成功部', hasChildren: true },
          { id: 'east-3', name: '解决方案部', hasChildren: true },
          { id: 'east-4', name: '交付实施部', hasChildren: true },
        ],
      },
      {
        id: 'south', name: '华南分公司',
        children: [
          { id: 'south-1', name: '市场拓展部', hasChildren: true },
          { id: 'south-2', name: '大客户部', hasChildren: true },
          { id: 'south-3', name: '售前技术部', hasChildren: true },
          { id: 'south-4', name: '实施交付部', hasChildren: true },
        ],
      },
      {
        id: 'lab', name: '创新研究院',
        children: [
          { id: 'lab-1', name: '架构研究组', hasChildren: true },
          { id: 'lab-2', name: '算法研究组', hasChildren: true },
          { id: 'lab-3', name: '数据平台组', hasChildren: true },
          { id: 'lab-4', name: '安全实验室', hasChildren: true },
        ],
      },
    ],
  }

  function mockFetchChildren(parent: TreeNodeData): Promise<TreeNodeData[]> {
    const latency = 400 + Math.random() * 500
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (failMode) {
          reject(new Error('模拟接口异常'))
          return
        }
        const depth = depthOf(parent.id)
        if (depth >= MAX_DEPTH) {
          resolve([]) // 空数组：视为末级，节点自动清除 hasChildren 标记
          return
        }
        resolve(
          Array.from({ length: 6 }, (_, i) => ({
            id: \`\${parent.id}/\${i + 1}\`,
            name: \`远程节点 L\${depth + 1}-\${i + 1}\`,
            hasChildren: depth + 1 < MAX_DEPTH,
          })),
        )
      }, latency)
    })
  }

  function loadChildren(parent: TreeNodeData): Promise<TreeNodeData[]> {
    setRequests(n => n + 1)
    setStatus(\`正在拉取「\${parent.name}」的下一级…\`)
    return mockFetchChildren(parent)
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px',
    borderBottom: '1px solid #E4E7ED', fontSize: 13, color: '#606266',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={toolbarStyle}>
        <label>
          <input type="checkbox" checked={failMode} onChange={e => setFailMode(e.target.checked)} />
          模拟接口失败
        </label>
        <span>Mock 请求：{requests} 次</span>
        <span style={{ color: '#909399' }}>{status}</span>
      </div>
      <div style={{ flex: 1 }}>
        <BidirectionalTree
          ref={tree}
          data={lazyData}
          loadChildren={loadChildren}
          onLoadError={(_error, parent) => setStatus(\`「\${parent.name}」拉取失败，可重试\`)}
          onNodeToggle={(node, collapsed) =>
            setStatus(\`「\${node.name}」已\${collapsed ? '折叠' : '展开'}\`)}
        />
      </div>
    </div>
  )
}
`,
}
