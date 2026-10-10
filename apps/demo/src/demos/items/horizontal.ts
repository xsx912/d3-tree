import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const horizontal: DemoItem = {
  id: 'horizontal',
  title: '水平双向树',
  desc: '最简用法：一个容器加一份 TreeNodeData 即可创建左右分侧的双向树。点击节点折叠/展开，滚轮缩放、拖拽平移。',
  setup({ canvas, setHint }) {
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      colorByGroup: true,
      onNodeToggle: (node, collapsed) =>
        setHint(`「${node.name}」已${collapsed ? '折叠' : '展开'}`),
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
