import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeInstance, TreeNodeData, TreeOptions } from '../src'

const trees: TreeInstance[] = []
afterEach(() => {
  trees.splice(0).forEach((tree) => tree.destroy())
  vi.restoreAllMocks()
})
const data = (): TreeNodeData => ({
  id: 'root',
  name: 'root',
  children: [
    { id: 'a', name: 'old', side: 'right', hasChildren: true },
    { id: 'b', name: 'other', side: 'left' },
  ],
})
function mount(extra: Partial<TreeOptions> = {}, container = document.createElement('div')) {
  const tree = createBidirectionalTree(container, {
    data: data(),
    duration: 0,
    measureText: (text) => text.length * 10 + 30,
    ...extra,
  })
  trees.push(tree)
  return { tree, container }
}
function node(container: HTMLElement, id: string) {
  return [...container.querySelectorAll<SVGGElement>('g.d3t-node')].find(
    (el) => el.dataset.id === id,
  )!
}
function deferred() {
  let resolve!: (children: TreeNodeData[]) => void
  let reject!: (error: Error) => void
  const promise = new Promise<TreeNodeData[]>((ok, fail) => {
    resolve = ok
    reject = fail
  })
  return { promise, resolve, reject }
}
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('数据换代回归', () => {
  it('destroy 后旧懒加载响应不改数据、不发事件也不重建 DOM', async () => {
    const initial = data(),
      request = deferred(),
      onNodeToggle = vi.fn()
    const { tree, container } = mount({
      data: initial,
      loadChildren: () => request.promise,
      onNodeToggle,
    })
    tree.toggle('a')
    tree.destroy()
    request.resolve([{ id: 'stale', name: 'stale' }])
    await flush()
    expect(initial.children![0]!.children).toBeUndefined()
    expect(onNodeToggle).not.toHaveBeenCalled()
    expect(container.children).toHaveLength(0)
  })
  it('自定义回调修改内容子组 class 后仍可替换旧内容', () => {
    const { tree, container } = mount({
      nodeRenderer: ({ group, data: item }) => {
        group.setAttribute('class', 'custom')
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.textContent = item.name
        group.append(text)
      },
    })
    tree.setData(data())
    tree.setData(data())
    expect(node(container, 'a').querySelectorAll('g.custom')).toHaveLength(1)
  })
  it('节点换代时从普通节点变为根、旧根变普通节点，徽标与默认样式正确', () => {
    const { tree, container } = mount()
    tree.setData({
      id: 'a',
      name: 'new root',
      children: [{ id: 'root', name: 'old root', children: [{ id: 'leaf', name: 'leaf' }] }],
    })
    expect(node(container, 'a').querySelector('g.d3t-badge')).toBeNull()
    expect(node(container, 'root').querySelector('g.d3t-badge')).toBeTruthy()
    expect(node(container, 'a').querySelector('rect')!.getAttribute('fill')).toBe('#1E6EFF')
    tree.toggle('root')
    expect(node(container, 'leaf')).toBeUndefined()
  })
  it('自定义聚合内容随释放更新；尺寸、侧和深度随换代更新', () => {
    const initial = data()
    initial.children![0]!.children = Array.from({ length: 6 }, (_, index) => ({
      id: `child-${index}`,
      name: `child-${index}`,
    }))
    const { tree, container } = mount({
      data: initial,
      visibleChildrenLimit: 2,
      nodeTemplate: (item) => `<b>${item.name}</b>`,
    })
    const aggregate = container.querySelector('g.d3t-node--aggregate')!
    expect(aggregate.querySelector('b')!.textContent).toContain('(4)')
    aggregate.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(container.querySelector('g.d3t-node--aggregate b')!.textContent).toContain('(2)')
    tree.destroy()
    const other = mount({
      nodeSize: (item) => ({ width: Number(item.properties?.width ?? 100), height: 50 }),
      nodeRenderer: ({ group, width, depth, side }) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.textContent = `${width}:${depth}:${side}`
        group.append(text)
      },
    })
    other.tree.setData({
      id: 'root',
      name: 'root',
      children: [
        {
          id: 'parent',
          name: 'parent',
          side: 'right',
          children: [{ id: 'a', name: 'new', properties: { width: 200 } }],
        },
      ],
    })
    expect(node(other.container, 'a').textContent).toContain('200:2:right')
  })
  it.each([false, true])('过期懒加载不能影响新请求，重复数据引用=%s', async (sameReference) => {
    const old = data()
    const requests = [deferred(), deferred()]
    const loader = vi
      .fn()
      .mockReturnValueOnce(requests[0]!.promise)
      .mockReturnValueOnce(requests[1]!.promise)
    const onNodeToggle = vi.fn()
    const { tree, container } = mount({ data: old, loadChildren: loader, onNodeToggle })
    tree.toggle('a')
    tree.setData(sameReference ? old : data())
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(false)
    tree.toggle('a')
    expect(loader).toHaveBeenCalledTimes(2)
    requests[0]!.resolve([{ id: 'stale', name: 'stale' }])
    await flush()
    expect(old.children![0]!.children).toBeUndefined()
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(true)
    expect(onNodeToggle).not.toHaveBeenCalled()
    requests[1]!.resolve([{ id: 'fresh', name: 'fresh' }])
    await flush()
    expect(node(container, 'fresh')).toBeTruthy()
    expect(node(container, 'stale')).toBeUndefined()
  })
  it('过期失败不发错误也不结束新请求', async () => {
    const requests = [deferred(), deferred()]
    const onLoadError = vi.fn()
    const { tree, container } = mount({
      loadChildren: vi
        .fn()
        .mockReturnValueOnce(requests[0]!.promise)
        .mockReturnValueOnce(requests[1]!.promise),
      onLoadError,
    })
    tree.toggle('a')
    tree.setData(data())
    tree.toggle('a')
    requests[0]!.reject(new Error('stale'))
    await flush()
    expect(onLoadError).not.toHaveBeenCalled()
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(true)
    requests[1]!.resolve([])
    await flush()
    expect(node(container, 'a').classList.contains('d3t-loading')).toBe(false)
  })
  it.each(['resolve', 'reject'] as const)('聚合旧请求 %s 不污染新代次', async (result) => {
    const old = data()
    old.children![0]!.children = [
      { id: 'x', name: 'x' },
      { id: 'y', name: 'y' },
    ]
    const next = structuredClone(old)
    const requests = [deferred(), deferred()]
    const onLoadError = vi.fn()
    const loader = vi
      .fn()
      .mockReturnValueOnce(requests[0]!.promise)
      .mockReturnValueOnce(requests[1]!.promise)
    const { tree, container } = mount({
      data: old,
      visibleChildrenLimit: 1,
      loadChildren: loader,
      onLoadError,
    })
    node(container, '__agg__a').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    tree.setData(next)
    node(container, '__agg__a').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(loader).toHaveBeenCalledTimes(2)
    if (result === 'resolve') requests[0]!.resolve([{ id: 'stale', name: 'stale' }])
    else requests[0]!.reject(new Error('stale'))
    await flush()
    expect(old.children![0]!.children).toHaveLength(2)
    expect(onLoadError).not.toHaveBeenCalled()
    expect(node(container, '__agg__a').classList.contains('d3t-loading')).toBe(true)
    requests[1]!.resolve([])
    await flush()
    expect(node(container, 'y')).toBeTruthy()
  })
  it.each([false, true])('换数据清理搜索类，复用ID=%s', (sameIds) => {
    const { tree, container } = mount()
    tree.search('old')
    const next = data()
    next.children![0]!.name = 'new'
    if (!sameIds)
      next.children!.forEach((child) => {
        child.id += '-new'
      })
    tree.setData(next)
    expect(container.querySelectorAll('.d3t-hit,.d3t-hit-ancestor,.d3t-dimmed')).toHaveLength(0)
  })
  it.each(['template', 'renderer'] as const)('自定义 %s 更新内容与几何且不重复', (mode) => {
    const { tree, container } = mount(
      mode === 'template'
        ? { nodeTemplate: (item) => `<b>${item.name}</b>` }
        : {
            nodeRenderer: ({ group, data: item, width }) => {
              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
              text.textContent = `${item.name}:${width}`
              group.append(text)
            },
          },
    )
    const next = data()
    next.children![0]!.name = 'updated'
    next.children![0]!.side = 'left'
    tree.setData(next)
    tree.setData(next)
    const a = node(container, 'a')
    expect(a.textContent).toContain('updated')
    expect(a.getAttribute('aria-label')).toBe('updated')
    expect(a.classList.contains('d3t-side--left')).toBe(true)
    expect(
      a.querySelectorAll(mode === 'template' ? 'foreignObject' : 'text:not(.d3t-badge-symbol)'),
    ).toHaveLength(1)
    expect(a.querySelectorAll('g.d3t-badge')).toHaveLength(1)
    if (mode === 'template')
      expect(a.querySelector('foreignObject')!.getAttribute('width')).toBe('100')
  })
  it.each(['__agg__a', '["aggregate","a"]', 'a->b', '中文/节点'])(
    '真实 ID %s 不与虚拟 key 混淆',
    (realId) => {
      const initial = data()
      initial.children![0]!.children = [
        { id: realId, name: 'real', children: [{ id: 'leaf', name: 'leaf' }] },
        { id: 'hidden', name: 'hidden' },
      ]
      const { tree, container } = mount({ data: initial, visibleChildrenLimit: 1 })
      tree.setData(structuredClone(initial))
      const candidates = [...container.querySelectorAll<SVGGElement>('g.d3t-node')]
      const real = candidates.find(
        (el) => el.dataset.id === realId && el.classList.contains('d3t-node--node'),
      )!
      expect(real.querySelector('text.d3t-label')!.textContent).toBe('real')
      const aggregate = candidates.find((el) => el.classList.contains('d3t-node--aggregate'))!
      aggregate.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(node(container, 'hidden')).toBeTruthy()
      tree.toggle(realId)
      expect(node(container, 'leaf')).toBeUndefined()
      expect(container.querySelectorAll('path.d3t-link')).toHaveLength(
        container.querySelectorAll('g.d3t-node').length - 1,
      )
    },
  )
  it('销毁恢复原 position，保留调用端后续修改', () => {
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      position: 'static',
    } as CSSStyleDeclaration)
    const el = document.createElement('div')
    el.style.setProperty('position', 'static', 'important')
    const { tree } = mount({}, el)
    tree.destroy()
    tree.destroy()
    expect(el.style.position).toBe('static')
    expect(el.style.getPropertyPriority('position')).toBe('important')
    const second = mount({}, el).tree
    el.style.position = 'absolute'
    second.destroy()
    expect(el.style.position).toBe('absolute')
  })
  it('聚合 loading 不阻止同名真实节点展开', async () => {
    const initial = data()
    initial.children![0]!.children = [
      { id: '__agg__a', name: 'real', hasChildren: true },
      { id: 'hidden', name: 'hidden' },
    ]
    const loader = vi.fn(() => new Promise<TreeNodeData[]>(() => {}))
    const { tree, container } = mount({
      data: initial,
      visibleChildrenLimit: 1,
      loadChildren: loader,
    })
    container
      .querySelector('.d3t-node--aggregate')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    tree.toggle('__agg__a')
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
