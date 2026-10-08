import { describe, expect, it } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData } from '../src'

/** 固定宽度度量：文本长度 × 系数 + 内边距，保证布局断言确定性 */
const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      {
        id: 'a',
        name: '甲板块',
        side: 'left',
        children: [
          { id: 'a1', name: '甲一' },
          { id: 'a2', name: '甲二' },
        ],
      },
      {
        id: 'b',
        name: '乙板块',
        side: 'right',
        children: [{ id: 'b1', name: '乙一' }],
      },
    ],
  }
}

function mount(extra: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  const tree = createBidirectionalTree(container, {
    data: fixture(),
    measureText: fixedMeasure,
    ...extra,
  })
  return { container, tree }
}

describe('fadeOpacity 淡入淡出（同步状态）', () => {
  it('未配置时初始渲染不引入任何 opacity 属性（向后兼容）', () => {
    const { container } = mount({ duration: 250 })
    expect(container.querySelectorAll('g.d3t-node[opacity]')).toHaveLength(0)
    expect(container.querySelectorAll('path.d3t-link[opacity]')).toHaveLength(0)
  })

  it('未配置时折叠再展开（update 路径）不引入 opacity 属性', () => {
    const { container, tree } = mount({ duration: 0 })
    tree.toggle('a')
    tree.toggle('a')
    expect(container.querySelectorAll('g.d3t-node[opacity]')).toHaveLength(0)
    expect(container.querySelectorAll('path.d3t-link[opacity]')).toHaveLength(0)
  })

  it('duration 为 0（无动画）时 fadeOpacity 不生效', () => {
    const { container, tree } = mount({ duration: 0, fadeOpacity: 0.3 })
    tree.toggle('a')
    tree.toggle('a')
    expect(container.querySelectorAll('g.d3t-node[opacity]')).toHaveLength(0)
    expect(container.querySelectorAll('path.d3t-link[opacity]')).toHaveLength(0)
  })

  it('配置了 fadeOpacity 的初始渲染（无动画源）也不引入 opacity 属性', () => {
    // duration 250 但初始 render 无动画源（首帧全量直出），不调度任何过渡
    const { container } = mount({ duration: 250, fadeOpacity: 0.3 })
    expect(container.querySelectorAll('g.d3t-node[opacity]')).toHaveLength(0)
    expect(container.querySelectorAll('path.d3t-link[opacity]')).toHaveLength(0)
  })
})
