import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function child(id: string): TreeNodeData {
  return { id, name: `子${id}` }
}

/** a 左 8 子、b 右 7 子（默认 limit=5 → 双侧均聚合） */
function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      { id: 'a', name: '甲板块', side: 'left', children: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'].map(child) },
      { id: 'b', name: '乙板块', side: 'right', children: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'].map(child) },
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

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function nodeText(container: HTMLElement, id: string): string {
  const el = container.querySelector(`g[data-id="${id}"] text.d3t-label`)
  expect(el, `节点 ${id} 应存在`).toBeTruthy()
  return el!.textContent ?? ''
}

describe('“展开 (N)”聚合懒加载（工单03）', () => {
  it('超过上限的子节点聚合为“展开 (N)”：5 普通 + 1 聚合', () => {
    const { container } = mount(fixture())
    // root + a + 5子 + aggA + b + 5子 + aggB = 14
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(15)
    expect(nodeText(container, '__agg__a')).toBe('< 展开 (3)')
    expect(nodeText(container, '__agg__b')).toBe('展开 (2) >')
    expect(container.querySelectorAll('g.d3t-node--aggregate')).toHaveLength(2)
  })

  it('点击聚合节点分批释放下一批，取尽后聚合节点消失', () => {
    const { container } = mount(fixture())
    click(container.querySelector('g[data-id="__agg__a"]')!)
    // a 侧全部 8 子可见，聚合消失；b 侧不变
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(17) // root+a+8 + b+5+aggB
    expect(container.querySelector('g[data-id="__agg__a"]')).toBeNull()
    expect(container.querySelector('g[data-id="a8"]')).toBeTruthy()
    // b 侧再点一次仍剩余（7 - 5 = 2，一次释放 5 → 全部显示）
    click(container.querySelector('g[data-id="__agg__b"]')!)
    expect(container.querySelector('g[data-id="__agg__b"]')).toBeNull()
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(18) // 全量：root+a+8+b+7
  })

  it('visibleChildrenLimit: 0 时完全不聚合', () => {
    const { container } = mount(fixture(), { visibleChildrenLimit: 0 })
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(18) // root + (a+8) + (b+7)
    expect(container.querySelectorAll('g.d3t-node--aggregate')).toHaveLength(0)
  })

  it('配置 loadChildren 时点击聚合触发回调一次，返回子节点并入并渲染', async () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        { id: 'c', name: '丙板块', side: 'right', children: [child('c1'), child('c2')] },
      ],
    }
    const loadChildren = vi.fn((parent: TreeNodeData) =>
      Promise.resolve([child('c3'), child('c4'), child('c5')]),
    )
    const { container } = mount(data, { visibleChildrenLimit: 1, loadChildren })
    // limit 1 → c1 可见 + agg(1)
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(4) // root + c + c1 + agg
    click(container.querySelector('g[data-id="__agg__c"]')!)

    await vi.waitFor(() => {
      expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7) // root + c + 5 子
    })
    expect(loadChildren).toHaveBeenCalledTimes(1)
    expect(loadChildren).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }))
    expect(container.querySelector('g[data-id="__agg__c"]')).toBeNull()
    expect(container.querySelector('g[data-id="c5"]')).toBeTruthy()
  })

  it('collapseAll 收起全部可折叠节点（保留根与一级板块），expandAll 全量展开', () => {
    const { container, tree } = mount(fixture())
    tree.collapseAll()
    // 根不可折叠 → 根 + 一级板块 a、b 保留，子树全部收起
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(3)
    expect(container.querySelectorAll('path.d3t-link')).toHaveLength(2)

    tree.expandAll()
    // root + (a+8) + (b+7) = 18，无聚合节点
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(18)
    expect(container.querySelectorAll('g.d3t-node--aggregate')).toHaveLength(0)
  })

  it('聚合虚拟节点无 +/− 徽标', () => {
    const { container } = mount(fixture())
    expect(container.querySelector('g[data-id="__agg__a"]')!.querySelector('g.d3t-badge')).toBeNull()
    // 普通节点仍有徽标
    expect(container.querySelector('g[data-id="a"]')!.querySelector('g.d3t-badge')).toBeTruthy()
  })
})
