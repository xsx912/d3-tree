import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree, theme } from '../src'
import type { TreeNodeData } from '../src'

/** 固定宽度度量：文本长度 × 系数 + 内边距，保证布局断言确定性 */
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
      {
        id: 'b',
        name: '乙板块',
        side: 'right',
        children: [{ id: 'b1', name: '乙一' }],
      },
      { id: 'c', name: '丙板块' },
      { id: 'd', name: '丁板块' },
      { id: 'e', name: '戊板块' },
    ],
  }
}

function mount(data: TreeNodeData): HTMLElement {
  const container = document.createElement('div')
  createBidirectionalTree(container, { data, measureText: fixedMeasure })
  return container
}

function nodeById(container: HTMLElement, id: string): SVGGElement {
  const el = container.querySelector<SVGGElement>(`g[data-id="${id}"]`)
  expect(el, `节点 ${id} 应存在`).toBeTruthy()
  return el!
}

function translateX(el: Element): number {
  const t = el.getAttribute('transform') ?? ''
  const m = /translate\(([-\d.]+),/.exec(t)
  expect(m, `transform 应含 translate：${t}`).toBeTruthy()
  return Number(m![1])
}

describe('初始渲染（工单01）', () => {
  it('渲染 SVG、根节点与全部子孙节点及连线', () => {
    const c = mount(fixture())
    // root + a(a1,a2) + b(b1) + c + d + e = 9 节点，8 条连线
    expect(c.querySelectorAll('svg.d3t-svg')).toHaveLength(1)
    expect(c.querySelectorAll('g.d3t-node')).toHaveLength(9)
    expect(c.querySelectorAll('path.d3t-link')).toHaveLength(8)
  })

  it('根节点为蓝底白字加大样式并带 root 类', () => {
    const c = mount(fixture())
    const root = nodeById(c, 'root')
    expect(root.classList.contains('d3t-node--root')).toBe(true)
    const rect = root.querySelector('rect')!
    expect(rect.getAttribute('fill')).toBe(theme.rootFill)
    expect(rect.getAttribute('stroke')).toBe('none')
    const text = root.querySelector('text')!
    expect(text.getAttribute('font-weight')).toBe('bold')
    expect(text.getAttribute('fill')).toBe(theme.rootText)
    expect(text.getAttribute('font-size')).toBe(String(theme.rootFontSize))
  })

  it('普通节点为白底灰边并带 side 类', () => {
    const c = mount(fixture())
    const a = nodeById(c, 'a')
    expect(a.classList.contains('d3t-node--node')).toBe(true)
    expect(a.classList.contains('d3t-side--left')).toBe(true)
    const rect = a.querySelector('rect')!
    expect(rect.getAttribute('fill')).toBe(theme.nodeFill)
    expect(rect.getAttribute('stroke')).toBe(theme.nodeStroke)
  })

  it('显式 side 分侧：left 节点在中心左侧，right 节点在右侧', () => {
    const c = mount(fixture())
    expect(translateX(nodeById(c, 'a'))).toBeLessThan(0)
    expect(translateX(nodeById(c, 'b'))).toBeGreaterThan(0)
  })

  it('缺省 side 按数量均分：5 个子节点 → 3 左 2 右', () => {
    const c = mount(fixture())
    // half = ceil(5/2) = 3：c(索引2) 进左侧，d、e 进右侧
    expect(translateX(nodeById(c, 'c'))).toBeLessThan(0)
    expect(translateX(nodeById(c, 'd'))).toBeGreaterThan(0)
    expect(translateX(nodeById(c, 'e'))).toBeGreaterThan(0)
  })

  it('同深度子节点按列对齐：同侧同级左边缘一致', () => {
    const c = mount(fixture())
    const a1 = nodeById(c, 'a1')
    const a2 = nodeById(c, 'a2')
    // '甲一' 与 '甲二' 等宽（fixedMeasure 下同为 48px），列起点一致 → 中心一致
    expect(translateX(a1)).toBe(translateX(a2))
    // 同为 depth 2，纵向按 rowHeight 分布且以父节点为中心
    const y1 = Number(/,([-\d.]+)\)/.exec(a1.getAttribute('transform')!)![1])
    const y2 = Number(/,([-\d.]+)\)/.exec(a2.getAttribute('transform')!)![1])
    expect(Math.abs(y1 - y2)).toBe(48)
  })

  it('连线为直角折线路径（M…H…V…H）', () => {
    const c = mount(fixture())
    const paths = [...c.querySelectorAll<SVGPathElement>('path.d3t-link')]
    const d = paths[0]!.getAttribute('d')!
    expect(d.startsWith('M')).toBe(true)
    expect(d).toMatch(/H[-\d.]+V[-\d.]+H[-\d.]+/)
  })

  it('注入的度量器以 root 变体度量根节点', () => {
    const spy = vi.fn(fixedMeasure)
    const container = document.createElement('div')
    createBidirectionalTree(container, { data: fixture(), measureText: spy })
    expect(spy).toHaveBeenCalledWith('根节点', 'root')
    expect(spy).toHaveBeenCalledWith('甲板块', 'node')
  })

  it('collapsed 节点的子树不渲染', () => {
    const data = fixture()
    const a = data.children![0]!
    a.collapsed = true
    const c = mount(data)
    expect(c.querySelectorAll('g.d3t-node')).toHaveLength(7) // 9 - a1 - a2
    expect(c.querySelectorAll('path.d3t-link')).toHaveLength(6)
  })
})
