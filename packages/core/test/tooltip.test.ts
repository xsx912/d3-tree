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

  /** 从渲染 DOM 读节点布局坐标（translate）与尺寸（rect），锚定断言用 */
  function nodeBox(el: SVGGElement): { x: number; y: number; width: number; height: number } {
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(el.getAttribute('transform') ?? '')
    expect(m, `节点 transform 应含 translate：${el.getAttribute('transform')}`).toBeTruthy()
    const rect = el.querySelector('rect')!
    return {
      x: Number(m![1]),
      y: Number(m![2]),
      width: Number(rect.getAttribute('width')),
      height: Number(rect.getAttribute('height')),
    }
  }

  describe('锚定节点定位（替代跟随光标）', () => {
    it('右侧节点：悬浮层出现在节点右侧（水平居中于节点），不依赖鼠标坐标', () => {
      const { container } = mount(fixture())

      const b = nodeById(container, 'b')
      const box = nodeBox(b)
      hover(b)

      const tip = tooltipEl(container)
      // jsdom：size() 回落 800×600、gChart 平移 (400,300)、zoom 恒等
      expect(parseFloat(tip.style.left)).toBeCloseTo(400 + box.x + box.width / 2 + 12, 5)
      expect(parseFloat(tip.style.top)).toBeCloseTo(300 + box.y, 5)
    })

    it('左侧节点：悬浮层出现在节点左侧', () => {
      const { container } = mount(fixture())

      const a = nodeById(container, 'a')
      const box = nodeBox(a)
      hover(a)

      expect(parseFloat(tooltipEl(container).style.left)).toBeCloseTo(
        400 + box.x - box.width / 2 - 12,
        5,
      )
    })

    it('根节点（center）：悬浮层出现在右侧', () => {
      const { container } = mount(fixture())

      const root = nodeById(container, 'root')
      const box = nodeBox(root)
      hover(root)

      expect(parseFloat(tooltipEl(container).style.left)).toBeCloseTo(400 + box.width / 2 + 12, 5)
    })

    it('mousemove 不再移动悬浮层', () => {
      const { container } = mount(fixture())

      const b = nodeById(container, 'b')
      hover(b)
      const before = tooltipEl(container).style.left

      b.dispatchEvent(new MouseEvent('mousemove', { clientX: 700, clientY: 500 }))
      expect(tooltipEl(container).style.left).toBe(before)
    })

    it('缩放/平移时悬浮层跟随节点重算位置', () => {
      // 右侧多挂一层，打破 fixture 的左右对称（否则 zoomToFit 算出恒等变换，位置自然不变）
      const data = fixture()
      data.children![1]!.children![0]!.children = [{ id: 'b1-x', name: '乙一延伸' }]
      const { container, tree } = mount(data)

      const b = nodeById(container, 'b')
      const box = nodeBox(b)
      hover(b)
      const before = parseFloat(tooltipEl(container).style.left)

      // zoomToFit 以 duration=0 同步设置 zoom 变换 → 触发 zoom 事件（不重渲染、不清锚点）
      tree.zoomToFit()

      const tip = tooltipEl(container)
      const now = parseFloat(tip.style.left)
      expect(now).not.toBe(before)
      // 期望值按锚定公式复算：k*(400+x)+tx + 节点半宽*k + 12，k/tx 从 gZoom transform 解析
      const m = /translate\(([-\d.]+),([-\d.]+)\) scale\(([\d.]+)\)/.exec(
        container.querySelector('g.d3t-zoom')!.getAttribute('transform') ?? '',
      )!
      const [tx, k] = [Number(m[1]), Number(m[3])]
      expect(now).toBeCloseTo(k * (400 + box.x) + tx + (box.width * k) / 2 + 12, 5)
    })

    it('垂直布局：上侧节点悬浮层出现在节点上方', () => {
      const { container } = mount(fixture(), { orientation: 'vertical' })

      const a = nodeById(container, 'a')
      const box = nodeBox(a)
      hover(a)

      const tip = tooltipEl(container)
      expect(parseFloat(tip.style.top)).toBeCloseTo(300 + box.y - box.height / 2 - 12, 5)
    })

    it('垂直布局：根节点（center）悬浮层出现在下方（根随下侧，同水平布局根随右侧惯例）', () => {
      const { container } = mount(fixture(), { orientation: 'vertical' })

      const root = nodeById(container, 'root')
      const box = nodeBox(root)
      hover(root)

      const tip = tooltipEl(container)
      expect(parseFloat(tip.style.top)).toBeCloseTo(300 + box.y + box.height / 2 + 12, 5)
    })
  })
})
