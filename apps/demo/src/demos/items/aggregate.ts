import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const aggregate: DemoItem = {
  id: 'aggregate',
  title: '子节点聚合',
  desc: 'visibleChildrenLimit 控制每父节点最多可见的子节点数，超出部分聚合为「展开 (N)」虚拟节点，点击释放；expandAll 会释放全部聚合。',
  setup({ canvas }) {
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      visibleChildrenLimit: 3,
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
