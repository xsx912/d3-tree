import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const toggle: DemoItem = {
  id: 'toggle',
  title: '折叠与展开',
  desc: '点击节点本体或 +/− 徽标切换折叠态；也可用命令式 API：toggle(id) 切换单节点、expandAll/collapseAll 全量控制，onNodeToggle 广播每次变化。',
  setup({ canvas, overlay, setHint }) {
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      colorByGroup: true,
      onNodeToggle: (node, collapsed) =>
        setHint(`「${node.name}」已${collapsed ? '折叠' : '展开'}`),
    })
    tree.zoomToFit()

    const btn = (label: string, onClick: () => void) => {
      const el = document.createElement('button')
      el.textContent = label
      el.onclick = onClick
      overlay.appendChild(el)
    }
    btn('全展开', () => {
      tree.expandAll()
      tree.zoomToFit()
    })
    btn('全收起', () => {
      tree.collapseAll()
      tree.zoomToFit()
    })
    btn("toggle('r-hw')", () => tree.toggle('r-hw'))
    return () => tree.destroy()
  },
}
