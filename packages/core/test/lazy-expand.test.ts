import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function child(id: string, extra: Partial<TreeNodeData> = {}): TreeNodeData {
  return { id, name: `子${id}`, ...extra }
}

function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根',
    children: [
      { id: 'a', name: '未加载', hasChildren: true },
      { id: 'b', name: '本地已有下一级', children: [child('b1')] },
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

function node(container: HTMLElement, id: string): SVGGElement {
  const el = container.querySelector<SVGGElement>(`g[data-id="${id}"]`)
  expect(el, `节点 ${id} 应存在`).toBeTruthy()
  return el!
}

describe('点击展开触发懒加载（hasChildren）', () => {
  it('未加载节点展示 + 徽标与 aria-expanded=false', () => {
    const { container } = mount(fixture())
    const a = node(container, 'a')
    expect(a.querySelector('g.d3t-badge')).toBeTruthy()
    expect(a.querySelector('text.d3t-badge-symbol')!.textContent).toBe('+')
    expect(a.getAttribute('aria-expanded')).toBe('false')
    expect(a.querySelector('title')!.textContent).toContain('数据源加载')
  })

  it('点击未加载节点触发 loadChildren，并入后展开并广播 onNodeToggle', async () => {
    const loadChildren = vi.fn((parent: TreeNodeData) =>
      Promise.resolve([child(`${parent.id}-1`), child(`${parent.id}-2`)]),
    )
    const onNodeToggle = vi.fn()
    const { container } = mount(fixture(), { loadChildren, onNodeToggle })
    click(node(container, 'a'))

    await vi.waitFor(() => {
      expect(container.querySelector('g[data-id="a-1"]')).toBeTruthy()
    })
    expect(loadChildren).toHaveBeenCalledTimes(1)
    expect(loadChildren).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    // a 展开且不进入折叠集：2 个新子节点可见
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(6) // root+a+a1+a2+b+b1
    expect(node(container, 'a').querySelector('text.d3t-badge-symbol')!.textContent).toBe('−')
    expect(node(container, 'a').getAttribute('aria-expanded')).toBe('true')
    expect(onNodeToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), false)
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(false)
  })

  it('已有下一级的节点点击走本地切换，不触发请求；加载后同样本地切换', async () => {
    const loadChildren = vi.fn((parent: TreeNodeData) =>
      Promise.resolve([child(`${parent.id}-1`)]),
    )
    const { container, tree } = mount(fixture(), { loadChildren })
    click(node(container, 'b')) // b 本地有子节点：本地收起，不请求
    expect(loadChildren).not.toHaveBeenCalled()
    expect(container.querySelector('g[data-id="b1"]')).toBeNull()

    click(node(container, 'a')) // a 未加载：触发请求
    await vi.waitFor(() => {
      expect(container.querySelector('g[data-id="a-1"]')).toBeTruthy()
    })
    const calls = loadChildren.mock.calls.length
    click(node(container, 'a')) // 已加载：本地收起，不再请求
    expect(loadChildren).toHaveBeenCalledTimes(calls)
    expect(container.querySelector('g[data-id="a-1"]')).toBeNull()
    tree.toggle('a') // 编程式切换同样不请求
    expect(loadChildren).toHaveBeenCalledTimes(calls)
    expect(container.querySelector('g[data-id="a-1"]')).toBeTruthy()
  })

  it('loadChildren 失败触发 onLoadError，节点保持未加载态且可重试', async () => {
    const onLoadError = vi.fn()
    const error = new Error('网络异常')
    let shouldFail = true
    const { container } = mount(fixture(), {
      loadChildren: () => (shouldFail ? Promise.reject(error) : Promise.resolve([child('a1')])),
      onLoadError,
    })
    click(node(container, 'a'))
    await vi.waitFor(() => {
      expect(onLoadError).toHaveBeenCalledWith(error, expect.objectContaining({ id: 'a' }))
    })
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(false)
    expect(node(container, 'a').getAttribute('aria-expanded')).toBe('false')

    shouldFail = false // 重试成功
    click(node(container, 'a'))
    await vi.waitFor(() => {
      expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    })
  })

  it('接口返回空数组视为末级：清除 hasChildren，回归叶子', async () => {
    const { container, tree } = mount(fixture(), { loadChildren: () => Promise.resolve([]) })
    click(node(container, 'a'))
    await vi.waitFor(() => {
      expect(
        node(container, 'a').querySelector<SVGGElement>('g.d3t-badge')!.style.display,
      ).toBe('none')
    })
    expect(node(container, 'a').getAttribute('aria-expanded')).toBeNull()
    // 叶子化后点击不再触发任何请求
    const before = container.querySelectorAll('g.d3t-node').length
    click(node(container, 'a'))
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(before)
    expect(tree).toBeTruthy()
  })

  it('加载中重复点击不会重复请求', async () => {
    let resolve!: (v: TreeNodeData[]) => void
    const loadChildren = vi.fn(
      () => new Promise<TreeNodeData[]>(r => (resolve = r)),
    )
    const { container } = mount(fixture(), { loadChildren })
    click(node(container, 'a'))
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(true)
    click(node(container, 'a')) // 加载中重复点击
    resolve([child('a1')])
    await vi.waitFor(() => {
      expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    })
    expect(loadChildren).toHaveBeenCalledTimes(1)
  })

  it('未配置 loadChildren 时 hasChildren 节点点击无反应', () => {
    const { container } = mount(fixture())
    const before = container.querySelectorAll('g.d3t-node').length
    click(node(container, 'a'))
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(before)
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(false)
  })
})
