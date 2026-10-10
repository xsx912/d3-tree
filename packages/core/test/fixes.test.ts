import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function child(id: string, extra: Partial<TreeNodeData> = {}): TreeNodeData {
  return { id, name: `子${id}`, ...extra }
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

describe('行为修复回归', () => {
  it('removeChild 清理被移除子树的折叠态：同 id 重新加入不继承幽灵折叠', () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        {
          id: 'a',
          name: '甲',
          side: 'left',
          children: [{ id: 'a1', name: '甲一', children: [{ id: 'a11', name: '甲一一' }] }],
        },
      ],
    }
    const { container, tree } = mount(data)
    tree.toggle('a1')
    expect(container.querySelector('[data-id="a11"]')).toBeNull() // a1 已折叠

    expect(tree.removeChild('a1')).toBe(true)
    // 同 id 重新加入（带子节点）：不应继承被删节点的折叠态
    tree.addChild('a', { id: 'a1', name: '新甲一', children: [{ id: 'a11', name: '新甲一一' }] })
    expect(container.querySelector('g[data-id="a11"]')).toBeTruthy()
  })

  it('搜索态下增删节点后，新节点重放高亮/淡化', () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        { id: 'a', name: '甲', side: 'left', children: [child('a1', { name: '甲一' }), child('a2')] },
        { id: 'b', name: '乙', side: 'right', children: [child('b1')] },
      ],
    }
    const { container, tree } = mount(data)
    expect(tree.search('甲一')).toBe(1)
    expect(container.querySelector('g[data-id="a1"]')!.classList.contains('d3t-hit')).toBe(true)
    expect(container.querySelector('g[data-id="b1"]')!.classList.contains('d3t-dimmed')).toBe(true)

    // 搜索态保持时追加节点：新节点应被视为非命中而淡化
    tree.addChild('a', { id: 'a3', name: '新节点' })
    const a3 = container.querySelector('g[data-id="a3"]')!
    expect(a3.classList.contains('d3t-dimmed')).toBe(true)
    expect(container.querySelector('g[data-id="a1"]')!.classList.contains('d3t-hit')).toBe(true)
  })

  it('loadChildren 失败触发 onLoadError 并复位 loading 态', async () => {
    const error = new Error('网络异常')
    const onLoadError = vi.fn()
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [{ id: 'c', name: '丙', side: 'right', children: [child('c1'), child('c2')] }],
    }
    const { container } = mount(data, {
      visibleChildrenLimit: 1,
      loadChildren: () => Promise.reject(error),
      onLoadError,
    })
    click(container.querySelector('g[data-id="__agg__c"]')!)
    await vi.waitFor(() => {
      expect(onLoadError).toHaveBeenCalledWith(error, expect.objectContaining({ id: 'c' }))
    })
    expect(
      container.querySelector('g[data-id="__agg__c"]')!.classList.contains('d3t-loading'),
    ).toBe(false)
  })

  it('destroy 后在途 loadChildren 完成不再触碰 DOM', async () => {
    let resolve!: (v: TreeNodeData[]) => void
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [{ id: 'c', name: '丙', side: 'right', children: [child('c1'), child('c2')] }],
    }
    const { container, tree } = mount(data, {
      visibleChildrenLimit: 1,
      loadChildren: () => new Promise<TreeNodeData[]>(r => (resolve = r)),
    })
    click(container.querySelector('g[data-id="__agg__c"]')!)
    tree.destroy()
    expect(() => resolve([child('c3')])).not.toThrow()
    await new Promise(r => setTimeout(r, 0))
    expect(container.innerHTML).toBe('')
  })

  it('重复节点 id 在创建与 setData 时给出告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const dup = (): TreeNodeData => ({
        id: 'root',
        name: '根',
        children: [
          { id: 'dup', name: '甲', side: 'left' },
          { id: 'dup', name: '乙', side: 'right' },
        ],
      })
      mount(dup())
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0]![0]).toContain('重复')

      const { tree } = mount({ id: 'r2', name: '根' })
      tree.setData(dup())
      expect(warn).toHaveBeenCalledTimes(2)
    } finally {
      warn.mockRestore()
    }
  })

  it('聚合"剩余数"只统计分组过滤后仍可见的子节点', () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        {
          id: 'a',
          name: '甲',
          side: 'left',
          children: [
            child('c1', { group: 'g1' }),
            ...['c2', 'c3', 'c4', 'c5', 'c6', 'c7'].map(id => child(id)),
          ],
        },
      ],
    }
    const { container, tree } = mount(data)
    // 无过滤：7 子 → 剩余 2
    expect(container.querySelector('g[data-id="__agg__a"] text.d3t-label')?.textContent).toBe(
      '< 展开 (2)',
    )
    // 过滤掉 g1：可见子节点剩 6 → 剩余 1
    tree.setVisibleGroups(['g2'])
    expect(container.querySelector('g[data-id="__agg__a"] text.d3t-label')?.textContent).toBe(
      '< 展开 (1)',
    )
  })

  it('分组类名不因净化碰撞："a b" 与 "a-b" 产生不同类名', () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        { id: 'x', name: '甲', side: 'left', group: 'a b' },
        { id: 'y', name: '乙', side: 'left', group: 'a-b' },
      ],
    }
    const { container } = mount(data)
    const gx = container
      .querySelector('g[data-id="x"]')!
      .getAttribute('class')!
      .match(/d3t-group--[\S]+/)![0]
    const gy = container
      .querySelector('g[data-id="y"]')!
      .getAttribute('class')!
      .match(/d3t-group--[\S]+/)![0]
    expect(gy).toBe('d3t-group--a-b')
    expect(gx).not.toBe(gy)
    expect(gx.startsWith('d3t-group--a-b-')).toBe(true)
  })
})
