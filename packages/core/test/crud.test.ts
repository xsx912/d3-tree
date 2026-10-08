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

  it('zoomToFit：小内容缩放限制为 1，宽内容自动缩小；内容中心必须落在视口中心', () => {
    /** 解析 g.d3t-zoom 的 translate/scale，返回根节点（布局原点）的屏幕坐标 */
    function rootScreenX(container: HTMLElement): number {
      const t = container.querySelector('g.d3t-zoom')!.getAttribute('transform') ?? ''
      const m = /translate\(([-\d.]+),([-\d.]+)\) scale\(([\d.]+)\)/.exec(t)
      expect(m, `transform 形如 translate(x,y) scale(k)：${t}`).toBeTruthy()
      const tx = Number(m![1])
      const k = Number(m![3])
      return tx + k * 400 // 布局原点经 gChart 居中偏移 800/2=400 后再施加 zoom
    }

    // 小树：视口 800×600（jsdom 容器为 0 时回退），内容远小于视口 → k = 1
    const small = mount(fixture())
    small.tree.zoomToFit()
    expect(
      small.container.querySelector('g.d3t-zoom')!.getAttribute('transform'),
    ).toContain('scale(1)')
    expect(Math.abs(rootScreenX(small.container) - 400)).toBeLessThan(1)

    // 宽树：左右各 10 层对称链，内容宽度超出视口 → k < 1；对称数据下根节点即内容中心
    let deep: TreeNodeData = { id: 'd10', name: '十层节点' }
    for (let i = 9; i >= 1; i--) deep = { id: `d${i}`, name: `层${i}`, children: [deep] }
    const mirror = structuredClone(deep)
    const wide = mount({
      id: 'root',
      name: '根',
      children: [
        { ...deep, side: 'right' },
        { ...mirror, side: 'left' },
      ],
    })
    wide.tree.zoomToFit()
    const t = wide.container.querySelector('g.d3t-zoom')!.getAttribute('transform')!
    expect(t).toMatch(/scale\(0\.\d+\)/)
    expect(Math.abs(rootScreenX(wide.container) - 400)).toBeLessThan(1)
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
