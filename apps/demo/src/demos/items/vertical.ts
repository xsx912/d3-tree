import { createBidirectionalTree } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const vertical: DemoItem = {
  id: 'vertical',
  title: '垂直布局',
  desc: 'orientation 设为 vertical：根在上、子树向下生长（上下分侧），其余能力与水平模式一致。',
  setup({ canvas }) {
    const tree = createBidirectionalTree(canvas, {
      data: industryData,
      colorByGroup: true,
      orientation: 'vertical',
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
