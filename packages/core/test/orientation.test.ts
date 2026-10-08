import { describe, expect, it } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

/** root + a(left, a1/a2) + b(right, b1) + c(无 side，索引2 ≥ ceil(3/2) → 右/下半区) */
function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      { id: 'a', name: '甲板块', side: 'left', children: [{ id: 'a1', name: '甲一' }, { id: 'a2', name: '甲二' }] },
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
    duration: 0,
    ...extra,
  })
  return { container, tree }
}

function translate(container: HTMLElement, id: string): { x: number; y: number } {
  const t = container.querySelector(`g[data-id="${id}"]`)?.getAttribute('transform') ?? ''
  const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(t)
  expect(m, `transform：${t}`).toBeTruthy()
  return { x: Number(m![1]), y: Number(m![2]) }
}

describe('布局方向 orientation（工单11）', () => {
  /* 期望值独立推导（默认尺寸：普通节点高 34、根高 44、columnGap 48、rowHeight 48）：
     垂直模式下深度沿 y、兄弟沿 x——
     深度1 行起点 = 44/2 + 48 = 70，行最大高 34 → 上半区 depth1 中心 y = -(70+17) = -87
     深度2 行起点 = 70 + 34 + 48 = 152 → depth2 中心 y = -(152+17) = -169          */

  it('垂直：side 映射上半区/下半区，深度按行对齐（y 值按几何推导）', () => {
    const { container } = mount(fixture(), { orientation: 'vertical' })
    expect(translate(container, 'root')).toEqual({ x: 0, y: 0 })
    expect(translate(container, 'a').y).toBeCloseTo(-87, 5)
    expect(translate(container, 'c').y).toBeCloseTo(87, 5) // c 落下半区；与 b 同深度同侧 → 行对齐
    expect(translate(container, 'b').y).toBe(translate(container, 'c').y)
    expect(translate(container, 'b').y).toBeCloseTo(87, 5) // 下半区取正
    expect(translate(container, 'a1').y).toBeCloseTo(-169, 5)
    expect(translate(container, 'a2').y).toBeCloseTo(-169, 5)
  })

  it('垂直：兄弟沿 x 排布，同父兄弟间距为 rowHeight', () => {
    const { container } = mount(fixture(), { orientation: 'vertical' })
    const a1 = translate(container, 'a1')
    const a2 = translate(container, 'a2')
    // separation 动态间距：a1/a2 宽 48 → (24+24+12) = 60
    expect(Math.abs(a1.x - a2.x)).toBeCloseTo(60, 5)
    expect(a1.y).toBe(a2.y)
    // 垂直下同侧 depth1 兄弟 b/c 沿 x：宽 58 each → (29+29+12) = 70
    const b = translate(container, 'b')
    const c = translate(container, 'c')
    expect(Math.abs(b.x - c.x)).toBeCloseTo(70, 5)
  })

  it('水平（默认）：同一 fixture 的分侧在 x 轴，验证转置发生', () => {
    const { container } = mount(fixture())
    const a = translate(container, 'a')
    const b = translate(container, 'b')
    expect(a.x).toBeLessThan(0)
    expect(b.x).toBeGreaterThan(0)
    // 水平：depth1 列起点 = root宽78/2 + 48 = 87，a 宽 58 → a.x = -(87+29) = -116
    expect(a.x).toBeCloseTo(-116, 5)
    // 水平：a 的分侧体现在 x 而非 y（y 是兄弟轴，两侧独立）
    expect(translate(container, 'a1').x).toBe(translate(container, 'a2').x)
  })

  it('垂直：连线为 V-H-V 直角折线；水平为 H-V-H', () => {
    const v = mount(fixture(), { orientation: 'vertical' })
    const vPath = v.container.querySelector('path.d3t-link')!.getAttribute('d')!
    expect(vPath).toMatch(/^M[-\d.]+,[\d.-]+V[-\d.]+H[-\d.]+V[-\d.]+$/)
    const h = mount(fixture())
    const hPath = h.container.querySelector('path.d3t-link')!.getAttribute('d')!
    expect(hPath).toMatch(/^M[-\d.]+,[\d.-]+H[-\d.]+V[-\d.]+H[-\d.]+$/)
  })

  it('垂直：徽标置于节点上（上半区）/下（下半区）外侧', () => {
    const { container } = mount(fixture(), { orientation: 'vertical' })
    const aBadge = container.querySelector('g[data-id="a"] circle.d3t-badge-circle')!
    expect(Number(aBadge.getAttribute('cx'))).toBe(0)
    expect(Number(aBadge.getAttribute('cy'))).toBeCloseTo(-(34 / 2 + 7 + 3), 5) // -27
    const bBadge = container.querySelector('g[data-id="b"] circle.d3t-badge-circle')!
    expect(Number(bBadge.getAttribute('cy'))).toBeCloseTo(27, 5)
  })

  it('垂直：聚合箭头为 ↑ / ↓ 形态', () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        { id: 'p', name: '上板块', side: 'left', children: Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `项${i}` })) },
        { id: 'q', name: '下板块', side: 'right', children: Array.from({ length: 7 }, (_, i) => ({ id: `q${i}`, name: `项q${i}` })) },
      ],
    }
    const { container } = mount(data, { orientation: 'vertical' })
    const text = (id: string) =>
      container.querySelector(`g[data-id="${id}"] text.d3t-label`)!.textContent
    expect(text('__agg__p')).toBe('↑ 展开 (3)')
    expect(text('__agg__q')).toBe('展开 (2) ↓')
  })

  it('垂直：折叠与展开行为一致', () => {
    const { container, tree } = mount(fixture(), { orientation: 'vertical' })
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)
    tree.toggle('a')
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5)
    expect(
      container.querySelector('g[data-id="a"] text.d3t-badge-symbol')!.textContent,
    ).toBe('+')
  })

  it('垂直 + nodeSize 自定义：深度行距按自定义高度累计', () => {
    const { container } = mount(fixture(), {
      orientation: 'vertical',
      nodeSize: (_d: TreeNodeData, variant: 'root' | 'node' | 'aggregate') =>
        variant === 'root' ? { width: 200, height: 50 } : { width: 120, height: 50 },
    })
    // 深度1 行起点 = 50/2 + 48 = 73，行高 50 → a.y = -(73 + 25) = -98
    expect(translate(container, 'a').y).toBeCloseTo(-98, 5)
  })

  it('垂直：zoomToFit 居中公式按轴独立（对称数据根居中）', () => {
    let deep: TreeNodeData = { id: 'd5', name: '五层' }
    for (let i = 4; i >= 1; i--) deep = { id: `d${i}`, name: `层${i}`, children: [deep] }
    const mirror = structuredClone(deep)
    const { container, tree } = mount(
      { id: 'root', name: '根', children: [{ ...deep, side: 'left' }, { ...mirror, side: 'right' }] },
      { orientation: 'vertical' },
    )
    tree.zoomToFit()
    const t = container.querySelector('g.d3t-zoom')!.getAttribute('transform')!
    const m = /translate\(([-\d.]+),([-\d.]+)\) scale\(([\d.]+)\)/.exec(t)!
    // 根（布局原点）经内容层居中偏移(300, h/2) 后施加 zoom：ty + k*h/2 == h/2（h=600 回退视口）
    const ty = Number(m![2])
    const k = Number(m![3])
    expect(Math.abs(ty + k * 300 - 300)).toBeLessThan(1)
  })
})
