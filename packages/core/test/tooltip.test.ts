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

/** 与 core 默认值对齐：防抖延时 + 淡出时长后彻底隐藏 */
const HIDE_DELAY = 150
const FADE_DURATION = 150
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
async function settleHide(): Promise<void> {
  await sleep(HIDE_DELAY + FADE_DURATION + 60)
}

/** jsdom 无 ResizeObserver：最小 fake，测试里手动 trigger 模拟内容尺寸变化通知 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  private callback: () => void
  observed: Element[] = []
  constructor(callback: () => void) {
    this.callback = callback
    FakeResizeObserver.instances.push(this)
  }
  observe(el: Element): void {
    this.observed.push(el)
  }
  unobserve(el: Element): void {
    this.observed = this.observed.filter(e => e !== el)
  }
  disconnect(): void {
    this.observed = []
  }
  /** 对齐浏览器语义：已断开（无观察目标）的 observer 不再通知 */
  trigger(): void {
    if (this.observed.length > 0) this.callback()
  }
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

  it('鼠标移出隐藏悬浮层（防抖延迟后）', async () => {
    const { container } = mount(fixture())

    const a = nodeById(container, 'a')
    hover(a)
    expect(tooltipEl(container).style.display).toBe('block')

    a.dispatchEvent(new MouseEvent('mouseleave'))
    await settleHide()
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

  describe('onTooltipHide 回调（封装层卸载时机的缝）', () => {
    it('移出节点时触发（防抖延迟后）', async () => {
      const onTooltipHide = vi.fn()
      const { container } = mount(fixture(), { tooltip: { onTooltipHide } })

      const a = nodeById(container, 'a')
      hover(a)
      expect(onTooltipHide).not.toHaveBeenCalled()

      a.dispatchEvent(new MouseEvent('mouseleave'))
      await settleHide()
      expect(onTooltipHide).toHaveBeenCalledTimes(1)
    })

    it('重渲染隐藏悬浮层时触发（如折叠切换）', () => {
      const onTooltipHide = vi.fn()
      const { container, tree } = mount(fixture(), { tooltip: { onTooltipHide } })

      const a = nodeById(container, 'a')
      hover(a)
      tree.toggle('a') // render() 末尾 hideTooltip()

      expect(onTooltipHide).toHaveBeenCalledTimes(1)
    })

    it('换节点直切不经过隐藏（不触发），destroy 也不触发（封装层自管卸载）', () => {
      const onTooltipHide = vi.fn()
      const { container, tree } = mount(fixture(), { tooltip: { onTooltipHide } })

      hover(nodeById(container, 'a'))
      hover(nodeById(container, 'b')) // mouseenter 直切：无 hide
      expect(onTooltipHide).not.toHaveBeenCalled()

      tree.destroy()
      expect(onTooltipHide).not.toHaveBeenCalled()
    })
  })

  describe('防抖隐藏与弹窗可交互（移入弹窗内容区不消失）', () => {
    it('悬浮层可交互：pointer-events 为 auto（不再挡不住鼠标）', () => {
      const { container } = mount(fixture())
      expect(tooltipEl(container).style.pointerEvents).toBe('auto')
    })

    it('移出节点后延迟期内仍显示，到期后才隐藏', async () => {
      const { container } = mount(fixture())
      const a = nodeById(container, 'a')

      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      expect(tooltipEl(container).style.display).toBe('block') // 立即断言：防抖期内不消失

      await settleHide()
      expect(tooltipEl(container).style.display).toBe('none')
    })

    it('移出节点后移入弹窗：取消隐藏，弹窗保持显示', async () => {
      const { container } = mount(fixture())
      const a = nodeById(container, 'a')

      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      const tip = tooltipEl(container)
      tip.dispatchEvent(new MouseEvent('mouseenter'))

      await settleHide()
      expect(tip.style.display).toBe('block') // 已被弹窗 mouseenter 取消
    })

    it('弹窗内移出后延迟隐藏', async () => {
      const { container } = mount(fixture())
      const a = nodeById(container, 'a')

      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      const tip = tooltipEl(container)
      tip.dispatchEvent(new MouseEvent('mouseenter'))
      tip.dispatchEvent(new MouseEvent('mouseleave'))

      await settleHide()
      expect(tip.style.display).toBe('none')
    })

    it('移出后快速悬停另一节点：取消待隐藏并直切新内容', async () => {
      const { container } = mount(fixture(), { tooltip: { formatter: (n: TreeNodeData) => n.id } })
      const a = nodeById(container, 'a')
      const b = nodeById(container, 'b')

      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      hover(b) // 延迟期内直切

      await settleHide()
      const tip = tooltipEl(container)
      expect(tip.style.display).toBe('block')
      expect(tip.textContent).toBe('b')
    })
  })

  describe('淡入淡出与延时可配（fadeDuration / hideDelay）', () => {
    it('显示即时且目标不透明（淡入由 CSS 过渡渲染，jsdom 断言目标值）', () => {
      const { container } = mount(fixture())

      hover(nodeById(container, 'a'))
      const tip = tooltipEl(container)
      expect(tip.style.display).toBe('block') // 无显示延时
      expect(tip.style.opacity).toBe('1')
    })

    it('节点间直切不重新入场：保持可见不重置透明度', () => {
      const { container } = mount(fixture())

      hover(nodeById(container, 'a'))
      hover(nodeById(container, 'b'))
      const tip = tooltipEl(container)
      expect(tip.style.display).toBe('block')
      expect(tip.style.opacity).toBe('1')
    })

    it('hideDelay 可配：延长防抖窗口', async () => {
      const { container } = mount(fixture(), { tooltip: { hideDelay: 300, fadeDuration: 0 } })

      const a = nodeById(container, 'a')
      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      await sleep(200)
      expect(tooltipEl(container).style.display).toBe('block') // 仍在加长后的防抖窗口内
      await sleep(250)
      expect(tooltipEl(container).style.display).toBe('none')
    })

    it('fadeDuration 0：防抖到期立即隐藏（无淡出等待）', async () => {
      const { container } = mount(fixture(), { tooltip: { hideDelay: 0, fadeDuration: 0 } })

      const a = nodeById(container, 'a')
      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      await sleep(30)
      expect(tooltipEl(container).style.display).toBe('none')
    })

    it('默认淡出：防抖到期后淡出中仍显示，淡出完成才隐藏并触发 onTooltipHide', async () => {
      const onTooltipHide = vi.fn()
      const { container } = mount(fixture(), { tooltip: { onTooltipHide } })

      const a = nodeById(container, 'a')
      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      await sleep(HIDE_DELAY + 80) // 防抖已过、淡出进行中
      const tip = tooltipEl(container)
      expect(tip.style.display).toBe('block')
      expect(tip.style.opacity).toBe('0')
      expect(onTooltipHide).not.toHaveBeenCalled()
      await sleep(FADE_DURATION + 80) // 淡出完成
      expect(tip.style.display).toBe('none')
      expect(onTooltipHide).toHaveBeenCalledTimes(1)
    })

    it('淡出中移回弹窗：取消隐藏并恢复不透明', async () => {
      const onTooltipHide = vi.fn()
      const { container } = mount(fixture(), {
        tooltip: { hideDelay: 0, fadeDuration: 300, onTooltipHide },
      })

      const a = nodeById(container, 'a')
      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))
      await sleep(80) // 淡出进行中
      const tip = tooltipEl(container)
      expect(tip.style.opacity).toBe('0')

      tip.dispatchEvent(new MouseEvent('mouseenter'))
      expect(tip.style.opacity).toBe('1') // 立即淡回
      await sleep(400)
      expect(tip.style.display).toBe('block')
      expect(onTooltipHide).not.toHaveBeenCalled()
    })

    it('系统减少动态效果偏好下，未显式配置 fadeDuration 时跳过淡入淡出', async () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
      try {
        const { container } = mount(fixture())
        const a = nodeById(container, 'a')

        hover(a)
        const tip = tooltipEl(container)
        expect(tip.style.opacity).toBe('1') // 无淡入起点，直接不透明

        a.dispatchEvent(new MouseEvent('mouseleave'))
        await sleep(HIDE_DELAY + 80) // 防抖到期即隐藏，无淡出等待
        expect(tip.style.display).toBe('none')
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe('内容尺寸变化后重定位（异步详情撑高悬浮层）', () => {
    it('异步内容撑高后按新尺寸重算锚定位置（不再压到节点）', () => {
      FakeResizeObserver.instances = []
      vi.stubGlobal('ResizeObserver', FakeResizeObserver)
      try {
        const card = document.createElement('div')
        card.textContent = '骨架'
        const { container } = mount(fixture(), { tooltip: { formatter: () => card } })

        const tip = tooltipEl(container)
        // jsdom 无布局：stub 悬浮层高度，模拟骨架屏（40px）→ 详情（120px）
        let height = 40
        Object.defineProperty(tip, 'offsetHeight', { get: () => height, configurable: true })

        const a = nodeById(container, 'a')
        hover(a)
        const top1 = parseFloat(tip.style.top) // 骨架期定位：cy - 40/2

        height = 120
        card.textContent = '详情多行内容'
        const ro = FakeResizeObserver.instances.find(r => r.observed.includes(tip))
        expect(ro, '应创建 ResizeObserver 监听悬浮层').toBeTruthy()
        ro!.trigger() // 模拟浏览器通知：内容尺寸变化

        // 重算：垂直居中随新高度上移 40px（(120-40)/2），否则卡片下坠/压节点
        expect(parseFloat(tip.style.top)).toBeCloseTo(top1 - 40, 5)
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it('内容替换（DOM 变化）即重算——不依赖渲染循环的兜底路径', async () => {
      // 不 stub ResizeObserver（jsdom 无，core RO 分支跳过）：仅 MutationObserver 生效
      const card = document.createElement('div')
      card.textContent = '骨架'
      const { container } = mount(fixture(), { tooltip: { formatter: () => card } })
      const tip = tooltipEl(container)
      let height = 40
      Object.defineProperty(tip, 'offsetHeight', { get: () => height, configurable: true })

      const a = nodeById(container, 'a')
      hover(a)
      const top1 = parseFloat(tip.style.top)

      height = 120
      card.textContent = '详情多行内容' // 异步数据到达的内容替换（microtask 通知）
      await sleep(30)

      expect(parseFloat(tip.style.top)).toBeCloseTo(top1 - 40, 5)
    })

    it('destroy 后断开监听（不再重定位）', () => {
      FakeResizeObserver.instances = []
      vi.stubGlobal('ResizeObserver', FakeResizeObserver)
      try {
        const { container, tree } = mount(fixture())
        const tip = tooltipEl(container)
        hover(nodeById(container, 'a'))
        const before = tip.style.top

        const ro = FakeResizeObserver.instances.find(r => r.observed.includes(tip))
        expect(ro, '悬浮层监听应存在').toBeTruthy()
        tree.destroy()
        expect(ro!.observed).toHaveLength(0) // disconnect 清空观察目标

        let height = 120
        Object.defineProperty(tip, 'offsetHeight', { get: () => height, configurable: true })
        ro!.trigger() // 已断开：不再通知，位置保持
        expect(tip.style.top).toBe(before)
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe('悬停事件缝（自接管悬浮框：配置 onNodeHover 即停用内置）', () => {
    it('悬停触发 onNodeHover：ctx 含 depth/side/collapsed/element/aggregate', () => {
      const onNodeHover = vi.fn()
      const { container } = mount(fixture(), { onNodeHover })

      hover(nodeById(container, 'a'))

      expect(onNodeHover).toHaveBeenCalledTimes(1)
      const [node, ctx] = onNodeHover.mock.calls[0]!
      expect(node.id).toBe('a')
      expect(ctx.depth).toBe(1)
      expect(ctx.side).toBe('left')
      expect(ctx.collapsed).toBe(false)
      expect(ctx.element).toBe(nodeById(container, 'a')) // 节点 g 元素引用
      expect(ctx.aggregate).toBe(false)
    })

    it('配置即禁内置：悬停后内置悬浮层保持隐藏', () => {
      const onNodeHover = vi.fn()
      const { container } = mount(fixture(), { onNodeHover })

      hover(nodeById(container, 'a'))

      expect(onNodeHover).toHaveBeenCalledTimes(1)
      expect(tooltipEl(container).style.display).toBe('none')
    })

    it('聚合节点照发事件（aggregate: true，调用端自行区分）', () => {
      const onNodeHover = vi.fn()
      const data = fixture()
      data.children![0]!.children!.push(
        { id: 'a3', name: '甲三' },
        { id: 'a4', name: '甲四' },
      )
      const { container } = mount(data, { onNodeHover, visibleChildrenLimit: 2 })

      const agg = container.querySelector<SVGGElement>('g.d3t-node--aggregate')!
      expect(agg, '聚合节点应存在').toBeTruthy()
      hover(agg)

      expect(onNodeHover).toHaveBeenCalledTimes(1)
      expect(onNodeHover.mock.calls[0]![1].aggregate).toBe(true)
    })

    it('移出立即触发 onNodeHoverEnd（带最后悬停节点，无防抖延时）', () => {
      const onNodeHoverEnd = vi.fn()
      const { container } = mount(fixture(), { onNodeHover: vi.fn(), onNodeHoverEnd })

      const a = nodeById(container, 'a')
      hover(a)
      a.dispatchEvent(new MouseEvent('mouseleave'))

      expect(onNodeHoverEnd).toHaveBeenCalledTimes(1) // 同步触发
      expect(onNodeHoverEnd.mock.calls[0]![0].id).toBe('a')
    })

    it('换节点直切（真实事件序 leave→enter）：先收前节点 end，再收新 hover', () => {
      const onNodeHover = vi.fn()
      const onNodeHoverEnd = vi.fn()
      const { container } = mount(fixture(), { onNodeHover, onNodeHoverEnd })

      const a = nodeById(container, 'a')
      hover(a)
      // 真实浏览器指针 A→B：mouseleave(A) 先于 mouseenter(B)——事件缝忠实转发该序列
      a.dispatchEvent(new MouseEvent('mouseleave'))
      hover(nodeById(container, 'b'))

      expect(onNodeHover).toHaveBeenCalledTimes(2)
      expect(onNodeHoverEnd).toHaveBeenCalledTimes(1)
      expect(onNodeHoverEnd.mock.calls[0]![0].id).toBe('a')
      expect(onNodeHover.mock.calls[1]![0].id).toBe('b')
    })

    it('重渲染（折叠切换）时触发 end——对齐内置"锚点失效即隐藏"语义', () => {
      const onNodeHoverEnd = vi.fn()
      const { container, tree } = mount(fixture(), { onNodeHover: vi.fn(), onNodeHoverEnd })

      hover(nodeById(container, 'a'))
      tree.toggle('a')

      expect(onNodeHoverEnd).toHaveBeenCalledTimes(1)
      expect(onNodeHoverEnd.mock.calls[0]![0].id).toBe('a')
    })

    it('destroy 不触发 end（对齐 onTooltipHide 先例）', () => {
      const onNodeHoverEnd = vi.fn()
      const { container, tree } = mount(fixture(), { onNodeHover: vi.fn(), onNodeHoverEnd })

      hover(nodeById(container, 'a'))
      tree.destroy()

      expect(onNodeHoverEnd).not.toHaveBeenCalled()
    })

    it('内置模式 ctx 同样携带 element/aggregate（formatter 可用）', () => {
      const formatter = vi.fn((_node: TreeNodeData, _ctx: TooltipContext) => 'x')
      const { container } = mount(fixture(), { tooltip: { formatter } })

      hover(nodeById(container, 'a'))

      const [, ctx] = formatter.mock.calls[0]!
      expect(ctx.element).toBe(nodeById(container, 'a'))
      expect(ctx.aggregate).toBe(false)
    })
  })
})
