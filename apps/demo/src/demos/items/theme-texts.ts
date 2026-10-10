import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const themeTexts: DemoItem = {
  id: 'theme-texts',
  title: '主题与国际化',
  desc: 'theme 对内置主题做浅合并，任意字段可覆盖（背景/节点/连线/徽标/调色板…）；texts 替换内置文案（聚合节点、徽标悬停提示），两者都作用于实例内所有渲染与导出。',
  setup({ canvas, setHint }) {
    canvas.style.background = '#0F172A'
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      theme: {
        background: '#0F172A',
        rootFill: '#38BDF8',
        rootText: '#0F172A',
        nodeFill: '#1E293B',
        nodeStroke: '#334155',
        nodeText: '#E2E8F0',
        aggregateText: '#94A3B8',
        link: '#475569',
        badgeFill: '#1E293B',
        badgeStroke: '#64748B',
        badgeText: '#94A3B8',
        hitStroke: '#38BDF8',
      },
      texts: {
        aggregateLabel: remaining => `Expand (${remaining})`,
        badgeExpandTitle: n => `Expand (${n} descendants)`,
        badgeCollapseTitle: n => `Collapse (${n} descendants)`,
      },
      onNodeToggle: (node, collapsed) =>
        setHint(`「${node.name}」${collapsed ? 'collapsed' : 'expanded'}`),
    })
    tree.zoomToFit()
    return () => {
      canvas.style.background = ''
      tree.destroy()
    }
  },
}
