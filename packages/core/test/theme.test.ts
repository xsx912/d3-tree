import { describe, expect, it } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      { id: 'a', name: '甲板块', side: 'left' },
      { id: 'b', name: '乙板块', side: 'right' },
    ],
  }
}

function mount(data: TreeNodeData, extra: Record<string, unknown> = {}): {
  container: HTMLElement
  tree: TreeInstance
} {
  const container = document.createElement('div')
  const tree = createBidirectionalTree(container, {
    data,
    measureText: fixedMeasure,
    duration: 0,
    ...extra,
  })
  return { container, tree }
}

describe('实例主题定制（options.theme）', () => {
  it('nodeColor 之外：nodeFill / nodeStroke / link 覆盖生效', () => {
    const { container } = mount(fixture(), {
      theme: { nodeFill: '#123456', nodeStroke: '#ABCDEF', link: '#0000FF' },
    })
    const rect = container.querySelector(`g[data-id="a"] rect`)!
    expect(rect.getAttribute('fill')).toBe('#123456')
    expect(rect.getAttribute('stroke')).toBe('#ABCDEF')
    const link = container.querySelector('path.d3t-link')!
    expect(link.getAttribute('stroke')).toBe('#0000FF')
  })

  it('画布背景随 theme.background', () => {
    const { container } = mount(fixture(), { theme: { background: '#000000' } })
    const svg = container.querySelector<SVGSVGElement>('svg.d3t-svg')!
    expect(svg.style.background).toMatch(/#000000|rgb\(0, 0, 0\)/)
  })

  it('搜索高亮色随 theme.hitStroke 注入样式表', () => {
    const { container } = mount(fixture(), { theme: { hitStroke: '#654321' } })
    const style = container.querySelector('style')!
    expect(style.textContent).toContain('#654321')
    expect(style.textContent).not.toContain('#1E6EFF')
  })
})
