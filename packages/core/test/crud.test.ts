import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

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

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function translateX(container: HTMLElement, id: string): number {
  const t = container.querySelector(`g[data-id="${id}"]`)?.getAttribute('transform') ?? ''
  return Number(/translate\(([-\d.]+),/.exec(t)![1])
}

describe('缩放与增删节点（工单04）', () => {
  const fixture = (): TreeNodeData => ({
    id: 'root',
    name: '根节点',
    children: [
      { id: 'a', name: '甲板块', side: 'left', children: [{ id: 'a1', name: '甲一' }] },
      { id: 'b', name: '乙板块', side: 'right', children: [{ id: 'b1', name: '乙一' }] },
    ],
  })

  it('addChild 追加子节点并渲染；父节点为折叠态时自动展开', () => {
    const { container, tree } = mount(fixture())
    tree.toggle('a') // 折叠 a
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(4)

    const ok = tree.addChild('a', { id: 'a2', name: '甲二' })
    expect(ok).toBe(true)
    expect(container.querySelector('g[data-id="a2"]')).toBeTruthy()
    // a 自动展开：a1、a2 均可见
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(6)
  })

  it('addChild 到根节点可用 side 指定分侧', () => {
    const { container, tree } = mount(fixture())
    tree.addChild('root', { id: 'n1', name: '新板块' }, 'right')
    expect(translateX(container, 'n1')).toBeGreaterThan(0)
    tree.addChild('root', { id: 'n2', name: '新板块二' }, 'left')
    expect(translateX(container, 'n2')).toBeLessThan(0)
  })

  it('addChild 父节点不存在返回 false', () => {
    const { tree } = mount(fixture())
    expect(tree.addChild('nope', { id: 'x', name: 'x' })).toBe(false)
  })

  it('removeChild 删除节点及子树；根节点不可删除', () => {
    const { container, tree } = mount(fixture())
    expect(tree.removeChild('a')).toBe(true)
    expect(container.querySelector('g[data-id="a"]')).toBeNull()
    expect(container.querySelector('g[data-id="a1"]')).toBeNull()
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(3) // root + b + b1

    expect(tree.removeChild('root')).toBe(false)
    expect(tree.removeChild('nope')).toBe(false)
  })

  it('zoomToFit：小内容缩放限制为 1，宽内容自动缩小', () => {
    // 小树：视口 800×600（jsdom 容器为 0 时回退），内容远小于视口 → k = 1
    const small = mount(fixture())
    small.tree.zoomToFit()
    expect(
      small.container.querySelector('g.d3t-zoom')!.getAttribute('transform'),
    ).toContain('scale(1)')

    // 宽树：右侧 10 层链，内容宽度超出视口 → k < 1
    let deep: TreeNodeData = { id: 'd10', name: '十层节点' }
    for (let i = 9; i >= 1; i--) deep = { id: `d${i}`, name: `层${i}`, children: [deep] }
    const wide = mount({ id: 'root', name: '根', children: [{ ...deep, side: 'right' }] })
    wide.tree.zoomToFit()
    expect(wide.container.querySelector('g.d3t-zoom')!.getAttribute('transform')).toMatch(
      /scale\(0\.\d+\)/,
    )
  })

  it('toggleOnNodeClick: false 时点击仅广播 onNodeSelect，不触发折叠', () => {
    const onNodeSelect = vi.fn()
    const { container } = mount(fixture(), { toggleOnNodeClick: false, onNodeSelect })
    click(container.querySelector('g[data-id="a"]')!)
    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5) // 未折叠
  })

  it('onNodeSelect 对根节点点击同样广播', () => {
    const onNodeSelect = vi.fn()
    const { container } = mount(fixture(), { onNodeSelect })
    click(container.querySelector('g[data-id="root"]')!)
    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
  })
})
