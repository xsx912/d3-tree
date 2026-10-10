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

/** HTML 模板渲染进节点 foreignObject；nodeSize 完全接管几何，rowHeight 对应更大行距 */
function card(data: TreeNodeData, variant: 'root' | 'node' | 'aggregate'): string {
  if (variant === 'root') {
    return `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1E6EFF,#5B8FF9);
      border-radius:8px;color:#fff;display:flex;flex-direction:column;justify-content:center;
      padding:0 14px;box-sizing:border-box;box-shadow:0 2px 6px rgba(30,110,255,.35);">
      <div style="font-size:15px;font-weight:700;">${data.name}</div>
      <div style="font-size:11px;opacity:.85;margin-top:2px;">${data.properties?.['定位'] ?? ''}</div>
    </div>`
  }
  const n = data.children?.length ?? 0
  const color = GROUP_COLORS[data.group ?? ''] ?? '#DCDFE6'
  return `
    <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;border-radius:8px;
      box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 12px 0 0;overflow:hidden;">
      <div style="width:6px;align-self:stretch;background:${color};flex:none;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#303133;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.name}</div>
        <div style="font-size:11px;color:#909399;margin-top:2px;">${data.group ?? '未分组'}${n ? ` · ${n} 个子项` : ''}</div>
      </div>
    </div>`
}

export const nodeTemplate: DemoItem = {
  id: 'node-template',
  title: 'HTML 卡片节点',
  desc: 'nodeTemplate 返回 HTML 字符串（或元素）渲染进节点 foreignObject，图标/图片/富文本最便捷；nodeSize 接管几何。导出 PNG 需模板内联样式。',
  setup({ canvas }) {
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      nodeTemplate: card,
      nodeSize: (_d, variant) =>
        variant === 'root' ? { width: 220, height: 56 } : { width: 176, height: 48 },
      rowHeight: 60,
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
