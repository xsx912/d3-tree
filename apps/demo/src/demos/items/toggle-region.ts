import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeNodeData } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

const GROUP_COLORS: Record<string, string> = {
  建筑: '#5B8FF9',
  医疗: '#5AD8A6',
  汽车: '#F6BD16',
  装备: '#E8684A',
  金融: '#6DC8EC',
  硬件: '#9270CA',
  软件: '#FF9D4D',
}

/** 折叠态调用端自记：自定义模板只在节点进入时渲染一次，靠 onNodeToggle 手动同步 DOM */
const collapsedIds = new Set<string>()

function card(data: TreeNodeData, variant: 'root' | 'node' | 'aggregate'): string {
  if (variant === 'root') {
    return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1E6EFF,#5B8FF9);
      border-radius:8px;color:#fff;display:flex;align-items:center;padding:0 14px;
      box-sizing:border-box;font-size:15px;font-weight:600;">${data.name}</div>`
  }
  const n = data.children?.length ?? 0
  const color = GROUP_COLORS[data.group ?? ''] ?? '#DCDFE6'
  return `
    <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;border-radius:8px;
      box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 8px 0 0;overflow:hidden;">
      <div style="width:6px;align-self:stretch;background:${color};flex:none;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#303133;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.name}</div>
        <div style="font-size:11px;color:#909399;margin-top:2px;">${data.group ?? '未分组'}${n ? ` · ${n} 个子项` : ''}</div>
      </div>
      ${n ? `<span class="fold-chip" data-d3t-toggle title="展开/收起（仅此区域可折叠）"
        style="flex:none;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
        font-size:12px;color:#1E6EFF;background:#EDF3FF;border:1px solid #B8D0FF;border-radius:50%;
        cursor:pointer;user-select:none;">▾</span>` : ''}
    </div>`
}

export const toggleRegion: DemoItem = {
  id: 'toggle-region',
  title: '自定义折叠触发区域',
  desc: '自定义节点时由调用端决定哪里可折叠：内容中标记 data-d3t-toggle 的元素点击切换折叠态（配合 toggleOnNodeClick:false，整卡点击只触发回调）。模板只在节点进入时渲染一次，箭头方向用 onNodeToggle 手动同步。',
  setup({ canvas, setHint }) {
    collapsedIds.clear()
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      nodeTemplate: card,
      nodeSize: (_d, variant) =>
        variant === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 },
      rowHeight: 60,
      toggleOnNodeClick: false,
      onNodeToggle: (node, collapsed) => {
        collapsedIds[collapsed ? 'add' : 'delete'](node.id)
        const chip = canvas.querySelector<HTMLElement>(
          `g[data-id="${node.id}"] .fold-chip`,
        )
        if (chip) chip.textContent = collapsed ? '▸' : '▾'
        setHint(`「${node.name}」已${collapsed ? '折叠' : '展开'}（通过折叠按钮触发）`)
      },
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
