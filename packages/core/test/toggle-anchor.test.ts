import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { animationAnchor } from '../src/layout'
import { polyfillSvgTransform } from './helpers'

/**
 * 展开/收起动画锚点 = 父节点「朝子节点一侧」的边缘中点（连线发出点）。
 * d3-timer 在模块加载时捕获 setTimeout/rAF——先装 fake timers 再动态 import，
 * 用 advanceTimersByTime 确定性地驱动 250ms 过渡，enter/exit 两端终态均可断言。
 */

describe('animationAnchor 锚点几何（纯函数）', () => {
  const n = { x: -100, y: 40, width: 60, height: 34 }

  it('水平左枝：左缘中点', () => {
    expect(animationAnchor({ ...n, side: 'left' }, 'horizontal')).toEqual({ x: -130, y: 40 })
  })

  it('水平右枝：右缘中点', () => {
    expect(animationAnchor({ ...n, side: 'right' }, 'horizontal')).toEqual({ x: -70, y: 40 })
  })

  it('垂直右枝（下侧）：下缘中点', () => {
    expect(animationAnchor({ ...n, side: 'right' }, 'vertical')).toEqual({ x: -100, y: 57 })
  })

  it('垂直左枝（上侧）：上缘中点', () => {
    expect(animationAnchor({ ...n, side: 'left' }, 'vertical')).toEqual({ x: -100, y: 23 })
  })

  it('根节点（center）回退节点中心', () => {
    expect(animationAnchor({ ...n, side: 'center' }, 'horizontal')).toEqual({ x: -100, y: 40 })
  })
})

describe('展开/收起动画自父节点末端边缘中点出发（集成）', () => {
  let createBidirectionalTree: typeof import('../src').createBidirectionalTree
  type TreeNodeData = import('../src').TreeNodeData

  beforeAll(async () => {
    polyfillSvgTransform()
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'Date',
        'performance',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    })
    ;({ createBidirectionalTree } = await import('../src'))
  })
  afterAll(() => vi.useRealTimers())

  /** 固定宽度度量：文本长度 × 系数 + 内边距，保证布局断言确定性 */
  const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
    text.length * 10 + (variant === 'root' ? 48 : 28)

  /** 初始折叠态：展开即纯 enter 路径，无 exit 残留元素干扰 join */
  function fixture(): TreeNodeData {
    return {
      id: 'root',
      name: '根节点',
      children: [
        {
          id: 'a',
          name: '甲板块',
          side: 'left',
          collapsed: true,
          children: [
            { id: 'a1', name: '甲一' },
            { id: 'a2', name: '甲二' },
          ],
        },
        {
          id: 'b',
          name: '乙板块',
          side: 'right',
          collapsed: true,
          children: [{ id: 'b1', name: '乙一' }],
        },
      ],
    }
  }

  function mount(extra: Record<string, unknown> = {}) {
    const container = document.createElement('div')
    const tree = createBidirectionalTree(container, {
      data: fixture(),
      measureText: fixedMeasure,
      duration: 250,
      ...extra,
    })
    return { container, tree }
  }

  function nodeEl(container: HTMLElement, id: string): SVGGElement {
    const el = container.querySelector(`g.d3t-node[data-id="${id}"]`)
    if (!el) throw new Error(`node ${id} not found`)
    return el as SVGGElement
  }

  function transformOf(el: Element): { x: number; y: number } {
    // 兼容两种格式：chart 直写的 translate(x,y) 与 d3-interpolate 插值写回的 translate(x, y)
    const m = (el.getAttribute('transform') ?? '').match(/translate\(([-\d.]+)[, ]+([-\d.]+)\)/)
    if (!m) throw new Error('no transform attr')
    return { x: Number(m[1]), y: Number(m[2]) }
  }

  function nodeTransform(container: HTMLElement, id: string) {
    return transformOf(nodeEl(container, id))
  }

  function nodeRectSize(container: HTMLElement, id: string): { w: number; h: number } {
    const rect = nodeEl(container, id).querySelector('rect')
    const w = Number(rect?.getAttribute('width'))
    const h = Number(rect?.getAttribute('height'))
    if (!rect || Number.isNaN(w) || Number.isNaN(h)) throw new Error(`node ${id} has no rect size`)
    return { w, h }
  }

  it('左枝：新节点与新连线自父节点左缘中点出发（enter 起点）', () => {
    const { container, tree } = mount()
    tree.toggle('a')
    const p = nodeTransform(container, 'a')
    const { w } = nodeRectSize(container, 'a')
    const edgeX = p.x - w / 2
    for (const id of ['a1', 'a2']) {
      const t = nodeTransform(container, id)
      expect(t.x).toBeCloseTo(edgeX, 6)
      expect(t.y).toBeCloseTo(p.y, 6)
    }
    // 新连线 degenerate 起点：orthogonal 肘形全部坐标退化为锚点
    const degenerate = `M${edgeX},${p.y}H${edgeX}V${p.y}H${edgeX}`
    const ds = Array.from(container.querySelectorAll('path.d3t-link')).map(el =>
      el.getAttribute('d'),
    )
    expect(ds.filter(d => d === degenerate).length).toBeGreaterThanOrEqual(2)
  })

  it('右枝：新节点自父节点右缘中点出发（enter 起点）', () => {
    const { container, tree } = mount()
    tree.toggle('b')
    const p = nodeTransform(container, 'b')
    const { w } = nodeRectSize(container, 'b')
    const t = nodeTransform(container, 'b1')
    expect(t.x).toBeCloseTo(p.x + w / 2, 6)
    expect(t.y).toBeCloseTo(p.y, 6)
  })

  it('垂直布局：新节点自父节点外缘中点出发（右枝在下侧）', () => {
    const { container, tree } = mount({ orientation: 'vertical' })
    tree.toggle('b')
    const p = nodeTransform(container, 'b')
    const { h } = nodeRectSize(container, 'b')
    const t = nodeTransform(container, 'b1')
    expect(t.x).toBeCloseTo(p.x, 6)
    expect(t.y).toBeCloseTo(p.y + h / 2, 6)
  })

  it('收起：子节点收拢到父节点左缘中点（exit 终态，途中向锚点趋近）', () => {
    const { container, tree } = mount()
    tree.toggle('a')
    vi.advanceTimersByTime(400) // 展开落位
    const p = nodeTransform(container, 'a')
    const { w } = nodeRectSize(container, 'a')
    const edgeX = p.x - w / 2
    const start = nodeTransform(container, 'a1')
    const el = nodeEl(container, 'a1')
    tree.toggle('a') // 收起
    vi.advanceTimersByTime(125) // 半程：位移在旧位置与锚点之间
    const mid = transformOf(el)
    expect(mid.x, '半程 x 应在途中').toBeGreaterThan(Math.min(start.x, edgeX))
    expect(mid.x).toBeLessThan(Math.max(start.x, edgeX))
    vi.advanceTimersByTime(400)
    expect(transformOf(el).x, '终态收拢到左缘中点').toBeCloseTo(edgeX, 6)
    expect(transformOf(el).y).toBeCloseTo(p.y, 6)
    expect(container.querySelector('g.d3t-node[data-id="a1"]'), '过渡结束后移除').toBeNull()
  })
})
