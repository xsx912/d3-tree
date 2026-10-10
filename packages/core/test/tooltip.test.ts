import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance, TooltipContext } from '../src'

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
        properties: { 类型: '板块' },
        children: [
          { id: 'a1', name: '甲一' },
          { id: 'a2', name: '甲二' },
        ],
      },
      {
        id: 'b',
        name: '乙板块',
        side: 'right',
        properties: { 类型: '板块' },
        children: [{ id: 'b1', name: '乙一' }],
      },
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

function nodeById(container: HTMLElement, id: string): SVGGElement {
  const el = container.querySelector<SVGGElement>(`g[data-id="${id}"]`)
  expect(el, `节点 ${id} 应存在`).toBeTruthy()
  return el!
}

function hover(el: Element): void {
  el.dispatchEvent(new MouseEvent('mouseenter', { cancelable: true, clientX: 10, clientY: 10 }))
}

function tooltipEl(container: HTMLElement): HTMLDivElement {
  const el = container.querySelector<HTMLDivElement>('div.d3t-tooltip')
  expect(el, '悬浮层应存在').toBeTruthy()
  return el!
}

describe('悬浮框自定义内容（formatter 组件化）', () => {
  it('formatter 收到节点数据与上下文：depth/side/collapsed', () => {
    const formatter = vi.fn((_node: TreeNodeData, _ctx: TooltipContext) => 'x')
    const { container, tree } = mount(fixture(), { tooltip: { formatter } })
    tree.collapseAll()

    hover(nodeById(container, 'a'))

    expect(formatter).toHaveBeenCalledTimes(1)
    const [node, ctx] = formatter.mock.calls[0]!
    expect(node.id).toBe('a')
    expect(ctx.depth).toBe(1)
    expect(ctx.side).toBe('left')
    expect(ctx.collapsed).toBe(true)
  })

  it('展开态节点 ctx.collapsed 为 false', () => {
    const formatter = vi.fn((_node: TreeNodeData, _ctx: TooltipContext) => 'x')
    const { container } = mount(fixture(), { tooltip: { formatter } })

    hover(nodeById(container, 'b'))

    const [, ctx] = formatter.mock.calls[0]!
    expect(ctx.collapsed).toBe(false)
  })

  it('根节点 ctx：depth 0、side center', () => {
    const formatter = vi.fn((_node: TreeNodeData, _ctx: TooltipContext) => 'x')
    const { container } = mount(fixture(), { tooltip: { formatter } })

    hover(nodeById(container, 'root'))

    const [, ctx] = formatter.mock.calls[0]!
    expect(ctx.depth).toBe(0)
    expect(ctx.side).toBe('center')
  })

  it('formatter 返回 HTMLElement：元素被原样挂入悬浮层', () => {
    const card = document.createElement('div')
    card.className = 'my-card'
    card.textContent = '自定义卡片'
    const { container } = mount(fixture(), { tooltip: { formatter: () => card } })

    hover(nodeById(container, 'a'))

    const tip = tooltipEl(container)
    expect(tip.style.display).toBe('block')
    expect(tip.querySelector('.my-card')).toBe(card)
    expect(tip.textContent).toBe('自定义卡片')
  })

  it('formatter 返回字符串：按 HTML 写入悬浮层（现状回归）', () => {
    const { container } = mount(fixture(), {
      tooltip: { formatter: (node: TreeNodeData) => `<b>${node.name}</b>` },
    })

    hover(nodeById(container, 'a'))

    const tip = tooltipEl(container)
    expect(tip.querySelector('b')?.textContent).toBe('甲板块')
  })

  it('缺省 formatter：渲染节点名与 properties 键值表', () => {
    const { container } = mount(fixture())

    hover(nodeById(container, 'a'))

    const tip = tooltipEl(container)
    expect(tip.textContent).toContain('甲板块')
    expect(tip.textContent).toContain('类型')
    expect(tip.textContent).toContain('板块')
  })

  it('tooltip.className 追加到悬浮层（保留 d3t-tooltip 基类与内置外壳）', () => {
    const { container } = mount(fixture(), { tooltip: { className: 'biz-tip' } })

    const tip = tooltipEl(container)
    expect(tip.classList.contains('d3t-tooltip')).toBe(true)
    expect(tip.classList.contains('biz-tip')).toBe(true)
    expect(tip.style.background).not.toBe('') // 内联外壳仍在，可被 CSS 覆盖
  })

  it('聚合节点不显示悬浮框', () => {
    const formatter = vi.fn(() => 'x')
    const data = fixture()
    // 甲板块 4 个子节点、上限 2 → 其下出现聚合节点（根的直接子节点只分侧、不聚合）
    data.children![0]!.children!.push(
      { id: 'a3', name: '甲三' },
      { id: 'a4', name: '甲四' },
    )
    const { container } = mount(data, { tooltip: { formatter }, visibleChildrenLimit: 2 })

    const agg = container.querySelector<SVGGElement>('g.d3t-node--aggregate')
    expect(agg, '聚合节点应存在').toBeTruthy()
    hover(agg!)

    expect(formatter).not.toHaveBeenCalled()
    expect(tooltipEl(container).style.display).toBe('none')
  })

  it('鼠标移出隐藏悬浮层', () => {
    const { container } = mount(fixture())

    const a = nodeById(container, 'a')
    hover(a)
    expect(tooltipEl(container).style.display).toBe('block')

    a.dispatchEvent(new MouseEvent('mouseleave'))
    expect(tooltipEl(container).style.display).toBe('none')
  })
})
