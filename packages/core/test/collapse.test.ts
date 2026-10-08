import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

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
      { id: 'b', name: '乙板块', side: 'right', children: [{ id: 'b1', name: '乙一' }] },
      { id: 'c', name: '丙板块' },
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
    duration: 0, // 测试中禁用过渡，DOM 断言为同步终态
    ...extra,
  })
  return { container, tree }
}

function nodeById(container: HTMLElement, id: string): SVGGElement {
  const el = container.querySelector<SVGGElement>(`g[data-id="${id}"]`)
  expect(el, `节点 ${id} 应存在`).toBeTruthy()
  return el!
}

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function badgeSymbol(container: HTMLElement, id: string): string {
  return nodeById(container, id).querySelector('text.d3t-badge-symbol')!.textContent
}

describe('折叠展开（工单02）', () => {
  it('点击节点本体折叠子树，再次点击展开', () => {
    const { container } = mount(fixture())
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)

    click(nodeById(container, 'a'))
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5) // 隐藏 a1、a2
    expect(badgeSymbol(container, 'a')).toBe('+')

    click(nodeById(container, 'a'))
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)
    expect(badgeSymbol(container, 'a')).toBe('−')
  })

  it('点击 +/− 徽标与点击节点本体行为等价', () => {
    const { container } = mount(fixture())
    const badge = nodeById(container, 'b').querySelector('g.d3t-badge')!
    click(badge)
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(6) // 隐藏 b1
    expect(badgeSymbol(container, 'b')).toBe('+')
  })

  it('toggle(id) 程序化切换与点击等价', () => {
    const { container, tree } = mount(fixture())
    tree.toggle('a')
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5)
    tree.toggle('a')
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)
  })

  it('数据带 collapsed: true 的节点初始为折叠态', () => {
    const data = fixture()
    data.children![1]!.collapsed = true // b
    const { container } = mount(data)
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(6)
    expect(badgeSymbol(container, 'b')).toBe('+')
  })

  it('onNodeToggle 回调携带节点与新的折叠态', () => {
    const onNodeToggle = vi.fn()
    const { container, tree } = mount(fixture(), { onNodeToggle })
    tree.toggle('a')
    expect(onNodeToggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
      true,
    )
    tree.toggle('a')
    expect(onNodeToggle).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'a' }),
      false,
    )
    // 点击路径同样触发
    click(nodeById(container, 'a'))
    expect(onNodeToggle).toHaveBeenCalledTimes(3)
  })

  it('onNodeClick 回调触发且不阻断折叠切换', () => {
    const onNodeClick = vi.fn()
    const { container } = mount(fixture(), { onNodeClick })
    click(nodeById(container, 'a'))
    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5)
  })

  it('徽标位于节点外侧：左半区在左、右半区在右；叶子节点隐藏徽标', () => {
    const { container } = mount(fixture())
    const aCircle = nodeById(container, 'a').querySelector('circle.d3t-badge-circle')!
    expect(Number(aCircle.getAttribute('cx'))).toBeLessThan(0)
    const bCircle = nodeById(container, 'b').querySelector('circle.d3t-badge-circle')!
    expect(Number(bCircle.getAttribute('cx'))).toBeGreaterThan(0)
    // c 无子节点 → 徽标隐藏
    const cBadge = nodeById(container, 'c').querySelector<SVGGElement>('g.d3t-badge')!
    expect(cBadge.style.display).toBe('none')
  })

  it('根节点无徽标且 toggle 根节点无效', () => {
    const { container, tree } = mount(fixture())
    expect(nodeById(container, 'root').querySelector('g.d3t-badge')).toBeNull()
    tree.toggle('root')
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)
  })

  it('徽标悬停提示包含被折叠的后代数量', () => {
    const { container, tree } = mount(fixture())
    tree.toggle('a')
    const title = nodeById(container, 'a').querySelector('g.d3t-badge title')!
    expect(title.textContent).toContain('2')
  })

  it('折叠后 setData 重置折叠态（以新数据的 collapsed 标记为准）', () => {
    const data = fixture()
    const { container, tree } = mount(data)
    tree.toggle('a')
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5)
    const fresh = fixture()
    tree.setData(fresh)
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)
    expect(badgeSymbol(container, 'a')).toBe('−')
  })
})
