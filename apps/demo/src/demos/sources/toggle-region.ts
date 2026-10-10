import type { DemoSources } from '../types'

export const toggleRegionSources: DemoSources = {
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>自定义折叠触发区域 · d3-tree</title>
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

    const GROUP_COLORS: Record<string, string> = {
      建筑: '#5B8FF9', 医疗: '#5AD8A6', 汽车: '#F6BD16', 装备: '#E8684A',
      金融: '#6DC8EC', 硬件: '#9270CA', 软件: '#FF9D4D',
    }

    // HTML 模板：标记 data-d3t-toggle 的元素（右侧圆形箭头）是唯一可折叠区域
    function card(data, variant) {
      if (variant === 'root') {
        return \`<div style="width:100%;height:100%;background:linear-gradient(135deg,#1E6EFF,#5B8FF9);
          border-radius:8px;color:#fff;display:flex;align-items:center;padding:0 14px;
          box-sizing:border-box;font-size:15px;font-weight:600;">\${data.name}</div>\`
      }
      const n = data.children?.length ?? 0
      const color = GROUP_COLORS[data.group ?? ''] ?? '#DCDFE6'
      return \`
        <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;border-radius:8px;
          box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 8px 0 0;overflow:hidden;">
          <div style="width:6px;align-self:stretch;background:\${color};flex:none;"></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;color:#303133;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${data.name}</div>
            <div style="font-size:11px;color:#909399;margin-top:2px;">\${data.group ?? '未分组'}\${n ? \` · \${n} 个子项\` : ''}</div>
          </div>
          \${n ? \`<span class="fold-chip" data-d3t-toggle title="展开/收起（仅此区域可折叠）"
            style="flex:none;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
            font-size:12px;color:#1E6EFF;background:#EDF3FF;border:1px solid #B8D0FF;border-radius:50%;
            cursor:pointer;user-select:none;">▾</span>\` : ''}
        </div>\`
    }

    // 折叠态自记：模板只在节点进入时渲染一次，箭头方向靠 onNodeToggle 手动同步
    const collapsedIds = new Set()

    const tree = createBidirectionalTree(document.getElementById('tree')!, {
      data: industryData,
      nodeTemplate: card,
      nodeSize: (_d, variant) =>
        variant === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 },
      rowHeight: 60,
      // 整卡点击只触发回调不折叠，仅 data-d3t-toggle 区域与徽标可切换
      toggleOnNodeClick: false,
      onNodeToggle: (node, collapsed) => {
        collapsedIds[collapsed ? 'add' : 'delete'](node.id)
        const chip = document.querySelector(\`#tree g[data-id="\${node.id}"] .fold-chip\`)
        if (chip) chip.textContent = collapsed ? '▸' : '▾'
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
import type { NodeTemplate } from '@d3-tree/core'
import { industryData } from './data'

const tree = ref<BidirectionalTreeExposed | null>(null)
// 需要拿到 DOM 同步自定义节点里的箭头方向，套一层宿主
const host = ref<HTMLDivElement | null>(null)

const GROUP_COLORS: Record<string, string> = {
  建筑: '#5B8FF9', 医疗: '#5AD8A6', 汽车: '#F6BD16', 装备: '#E8684A',
  金融: '#6DC8EC', 硬件: '#9270CA', 软件: '#FF9D4D',
}

// HTML 模板：标记 data-d3t-toggle 的元素（右侧圆形箭头）是唯一可折叠区域
const card: NodeTemplate = (data, variant) => {
  if (variant === 'root') {
    return \`<div style="width:100%;height:100%;background:linear-gradient(135deg,#1E6EFF,#5B8FF9);
      border-radius:8px;color:#fff;display:flex;align-items:center;padding:0 14px;
      box-sizing:border-box;font-size:15px;font-weight:600;">\${data.name}</div>\`
  }
  const n = data.children?.length ?? 0
  const color = GROUP_COLORS[data.group ?? ''] ?? '#DCDFE6'
  return \`
    <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;border-radius:8px;
      box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 8px 0 0;overflow:hidden;">
      <div style="width:6px;align-self:stretch;background:\${color};flex:none;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#303133;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${data.name}</div>
        <div style="font-size:11px;color:#909399;margin-top:2px;">\${data.group ?? '未分组'}\${n ? \` · \${n} 个子项\` : ''}</div>
      </div>
      \${n ? \`<span class="fold-chip" data-d3t-toggle title="展开/收起（仅此区域可折叠）"
        style="flex:none;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
        font-size:12px;color:#1E6EFF;background:#EDF3FF;border:1px solid #B8D0FF;border-radius:50%;
        cursor:pointer;user-select:none;">▾</span>\` : ''}
    </div>\`
}

// 折叠态自记：模板只在节点进入时渲染一次，箭头方向靠 onNodeToggle 手动同步
const collapsedIds = new Set<string>()

function onToggle(node: TreeNodeData, collapsed: boolean): void {
  collapsedIds[collapsed ? 'add' : 'delete'](node.id)
  const chip = host.value?.querySelector<HTMLElement>(\`g[data-id="\${node.id}"] .fold-chip\`)
  if (chip) chip.textContent = collapsed ? '▸' : '▾'
}

onMounted(() => tree.value?.zoomToFit())
</script>

<template>
  <div ref="host" class="page">
    <!-- toggle-on-node-click=false：整卡点击只回调，仅 data-d3t-toggle 区域与徽标可折叠 -->
    <BidirectionalTree ref="tree" :data="industryData" :node-template="card"
      :node-size="(_d, v) => (v === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 })"
      :row-height="60" :toggle-on-node-click="false" @node-toggle="onToggle" />
  </div>
</template>

<style scoped>
.page { width: 100%; height: 100vh; }
</style>
`,
  react: `import { useEffect, useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import type { NodeTemplate } from '@d3-tree/core'
import { industryData } from './data'

export default function BidirectionalTreeDemo() {
  const tree = useRef<BidirectionalTreeHandle>(null)
  // 需要拿到 DOM 同步自定义节点里的箭头方向，套一层宿主
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    tree.current?.zoomToFit()
  }, [])

  const GROUP_COLORS: Record<string, string> = {
    建筑: '#5B8FF9', 医疗: '#5AD8A6', 汽车: '#F6BD16', 装备: '#E8684A',
    金融: '#6DC8EC', 硬件: '#9270CA', 软件: '#FF9D4D',
  }

  // HTML 模板：标记 data-d3t-toggle 的元素（右侧圆形箭头）是唯一可折叠区域
  const card: NodeTemplate = (data, variant) => {
    if (variant === 'root') {
      return \`<div style="width:100%;height:100%;background:linear-gradient(135deg,#1E6EFF,#5B8FF9);
        border-radius:8px;color:#fff;display:flex;align-items:center;padding:0 14px;
        box-sizing:border-box;font-size:15px;font-weight:600;">\${data.name}</div>\`
    }
    const n = data.children?.length ?? 0
    const color = GROUP_COLORS[data.group ?? ''] ?? '#DCDFE6'
    return \`
      <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;border-radius:8px;
        box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 8px 0 0;overflow:hidden;">
        <div style="width:6px;align-self:stretch;background:\${color};flex:none;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;color:#303133;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${data.name}</div>
          <div style="font-size:11px;color:#909399;margin-top:2px;">\${data.group ?? '未分组'}\${n ? \` · \${n} 个子项\` : ''}</div>
        </div>
        \${n ? \`<span class="fold-chip" data-d3t-toggle title="展开/收起（仅此区域可折叠）"
          style="flex:none;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
          font-size:12px;color:#1E6EFF;background:#EDF3FF;border:1px solid #B8D0FF;border-radius:50%;
          cursor:pointer;user-select:none;">▾</span>\` : ''}
      </div>\`
  }

  // 折叠态自记：模板只在节点进入时渲染一次，箭头方向靠 onNodeToggle 手动同步
  const collapsedIds = new Set<string>()

  function onToggle(node: TreeNodeData, collapsed: boolean): void {
    collapsedIds[collapsed ? 'add' : 'delete'](node.id)
    const chip = host.current?.querySelector<HTMLElement>(\`g[data-id="\${node.id}"] .fold-chip\`)
    if (chip) chip.textContent = collapsed ? '▸' : '▾'
  }

  return (
    <div ref={host} style={{ width: '100%', height: '100vh' }}>
      {/* toggleOnNodeClick={false}：整卡点击只回调，仅 data-d3t-toggle 区域与徽标可折叠 */}
      <BidirectionalTree
        ref={tree}
        data={industryData}
        nodeTemplate={card}
        nodeSize={(_d, v) => (v === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 })}
        rowHeight={60}
        toggleOnNodeClick={false}
        onNodeToggle={onToggle}
      />
    </div>
  )
}
`,
}
