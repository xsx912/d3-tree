import { describe, expect, it } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function child(id: string): TreeNodeData {
  return { id, name: `子${id}` }
}

function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      {
        id: 'a',
        name: '甲板块',
        side: 'left',
        children: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'].map(child),
      },
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

function node(container: HTMLElement, id: string): SVGGElement {
  const el = container.querySelector<SVGGElement>(`g[data-id="${id}"]`)
  expect(el, `节点 ${id} 应存在`).toBeTruthy()
  return el!
}

function pressKey(el: Element, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('可访问性基线（ARIA + 键盘）', () => {
  it('普通节点为 treeitem 且可聚焦，带 aria-label 与 aria-expanded', () => {
    const { container } = mount(fixture())
    const a = node(container, 'a')
    expect(a.getAttribute('role')).toBe('treeitem')
    expect(a.getAttribute('tabindex')).toBe('0')
    expect(a.getAttribute('aria-label')).toBe('甲板块')
    expect(a.getAttribute('aria-expanded')).toBe('true')
    const leaf = node(container, 'b')
    expect(leaf.getAttribute('aria-expanded')).toBeNull()
  })

  it('聚合节点为 button；徽标 aria-hidden 避免重复 Tab 停留', () => {
    const { container } = mount(fixture())
    expect(node(container, '__agg__a').getAttribute('role')).toBe('button')
    expect(node(container, 'a').querySelector('g.d3t-badge')!.getAttribute('aria-hidden')).toBe(
      'true',
    )
  })

  it('aria-expanded 随折叠切换刷新', () => {
    const { container, tree } = mount(fixture())
    tree.toggle('a')
    expect(node(container, 'a').getAttribute('aria-expanded')).toBe('false')
    tree.toggle('a')
    expect(node(container, 'a').getAttribute('aria-expanded')).toBe('true')
  })

  it('键盘 Enter 触发节点折叠切换', () => {
    const { container } = mount(fixture())
    pressKey(node(container, 'a'), 'Enter')
    // a 收起：子树连同聚合一起隐藏 → root + a + b = 3
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(3)
    expect(node(container, 'a').getAttribute('aria-expanded')).toBe('false')
  })

  it('键盘 Space 触发聚合节点释放', () => {
    const { container } = mount(fixture())
    pressKey(node(container, '__agg__a'), ' ')
    // 8 子全部释放：root + a + 8 + b = 11，聚合消失
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(11)
    expect(container.querySelector(`g[data-id="__agg__a"]`)).toBeNull()
  })
})
