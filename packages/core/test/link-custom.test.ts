import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { LinkRenderContext, TreeNodeData, TreeInstance } from '../src'
const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      { id: 'a', name: '甲板块', side: 'left', group: 'A', children: [{ id: 'a1', name: '甲一', group: 'A' }] },
      { id: 'b', name: '乙板块', side: 'right', group: 'B', children: [{ id: 'b1', name: '乙一', group: 'B' }] },
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

describe('连线颜色与样式自定义（工单12）', () => {
  it("linkStyle: 'straight' 水平与垂直均为 M..L.. 直线", () => {
    const h = mount(fixture(), { linkStyle: 'straight' })
    expect(h.container.querySelector('path.d3t-link')!.getAttribute('d')).toMatch(
      /^M[-\d.]+,[\d.-]+L[-\d.]+,[\d.-]+$/,
    )
    const v = mount(fixture(), { linkStyle: 'straight', orientation: 'vertical' })
    expect(v.container.querySelector('path.d3t-link')!.getAttribute('d')).toMatch(
      /^M[-\d.]+,[\d.-]+L[-\d.]+,[\d.-]+$/,
    )
  })

  it('缺省颜色保持 #C0C4CC、线宽 1（逐 path 属性）', () => {
    const { container } = mount(fixture())
    const path = container.querySelector('path.d3t-link')!
    expect(path.getAttribute('stroke')).toBe('#C0C4CC')
    expect(path.getAttribute('stroke-width')).toBe('1')
  })

  it('linkColor 字符串与回调（按目标分组着色）生效，回调收到完整上下文', () => {
    const { container } = mount(fixture(), { linkColor: '#FF0000' })
    for (const p of container.querySelectorAll('path.d3t-link')) {
      expect(p.getAttribute('stroke')).toBe('#FF0000')
    }

    const seen: LinkRenderContext[] = []
    const { container: c2 } = mount(fixture(), {
      linkColor: (l: LinkRenderContext) => {
        seen.push(l)
        return l.target.data.group === 'A' ? '#111111' : '#222222'
      },
    })
    const strokes = [...c2.querySelectorAll('path.d3t-link')].map(p => p.getAttribute('stroke'))
    expect(new Set(strokes)).toEqual(new Set(['#111111', '#222222']))
    // 上下文：source 为父（含根）、target 为子，携带几何
    const rootLink = seen.find(l => l.source.data.id === 'root')!
    expect(rootLink.source.depth).toBe(0)
    expect(rootLink.source.x).toBe(0)
    expect(rootLink.target.width).toBeGreaterThan(0)
    expect(rootLink.target.side === 'left' || rootLink.target.side === 'right').toBe(true)
  })

  it('linkWidth 生效', () => {
    const { container } = mount(fixture(), { linkWidth: 3 })
    expect(container.querySelector('path.d3t-link')!.getAttribute('stroke-width')).toBe('3')
  })

  it('linkPathGenerator 优先于 linkStyle，返回值原样渲染；折叠照常工作', () => {
    const gen = vi.fn((_l: LinkRenderContext) => 'M0,0L99,99')
    const { container, tree } = mount(fixture(), {
      linkStyle: 'diagonal',
      linkPathGenerator: gen,
    })
    expect(container.querySelector('path.d3t-link')!.getAttribute('d')).toBe('M0,0L99,99')
    expect(gen).toHaveBeenCalled()
    // 上下文可推导自定义路径（验证一次调用的参数形状）
    const ctx = gen.mock.calls[0]![0]
    expect(ctx.source).toBeTruthy()
    expect(ctx.target).toBeTruthy()
    // 折叠：节点与连线同步移除（5 节点 → 4 连线；折叠 a 后 → 3）
    expect(container.querySelectorAll('path.d3t-link')).toHaveLength(4)
    tree.toggle('a')
    expect(container.querySelectorAll('path.d3t-link')).toHaveLength(3)
  })
})
