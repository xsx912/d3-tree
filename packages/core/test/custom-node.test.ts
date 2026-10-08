import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { NodeRenderContext, TreeNodeData, TreeInstance } from '../src'

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
        children: [{ id: 'a1', name: '甲一' }],
      },
      { id: 'b', name: '乙板块', side: 'right', children: [{ id: 'b1', name: '乙一' }] },
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

describe('节点完全自定义（工单10）', () => {
  it('nodeSize 生效：节点几何与列间距按自定义宽高计算', () => {
    const { container } = mount(fixture(), {
      nodeSize: (data: TreeNodeData, variant: 'root' | 'node' | 'aggregate') =>
        variant === 'root' ? { width: 200, height: 60 } : { width: 120, height: 40 },
    })
    const rootRect = container.querySelector('g[data-id="root"] rect')!
    expect(Number(rootRect.getAttribute('width'))).toBe(200)
    expect(Number(rootRect.getAttribute('height'))).toBe(60)
    const aRect = container.querySelector('g[data-id="a"] rect')!
    expect(Number(aRect.getAttribute('width'))).toBe(120)
    expect(Number(aRect.getAttribute('height'))).toBe(40)
    // 深度 1 列起点 = 根宽/2 + columnGap = 100 + 48 = 148
    const t = container.querySelector('g[data-id="a"]')!.getAttribute('transform')!
    expect(Number(/translate\(([-\d.]+),/.exec(t)![1])).toBeCloseTo(-(148 + 60), 0)
  })

  it('nodeRenderer 替代默认渲染并收到完整上下文', () => {
    const contexts: NodeRenderContext[] = []
    const { container } = mount(fixture(), {
      nodeSize: () => ({ width: 100, height: 50 }),
      nodeRenderer: (ctx: NodeRenderContext) => {
        contexts.push(ctx)
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', '20')
        ctx.group.appendChild(circle)
      },
    })
    // 默认 rect/text 不再渲染，出现自定义 circle
    expect(container.querySelector('g[data-id="a"] rect')).toBeNull()
    expect(container.querySelector('g[data-id="a"] text.d3t-label')).toBeNull()
    expect(container.querySelector('g[data-id="a"] circle')).toBeTruthy()
    // 上下文完整
    const aCtx = contexts.find(c => c.data.id === 'a')!
    expect(aCtx.variant).toBe('node')
    expect(aCtx.side).toBe('left')
    expect(aCtx.depth).toBe(1)
    expect(aCtx.width).toBe(100)
    expect(aCtx.height).toBe(50)
  })

  it('nodeTemplate 渲染进 foreignObject；nodeRenderer 优先于 nodeTemplate', () => {
    const { container } = mount(fixture(), {
      nodeSize: () => ({ width: 140, height: 44 }),
      nodeTemplate: (data: TreeNodeData) => `<b class="tpl">${data.name}</b>`,
    })
    const fo = container.querySelector('g[data-id="a"] foreignObject')!
    expect(fo).toBeTruthy()
    expect(Number(fo.getAttribute('width'))).toBe(140)
    expect(fo.querySelector('div b.tpl')?.textContent).toBe('甲板块')
    // XHTML 命名空间（序列化兼容）
    expect(fo.querySelector('div')!.namespaceURI).toBe('http://www.w3.org/1999/xhtml')

    // renderer 优先
    const { container: c2 } = mount(fixture(), {
      nodeSize: () => ({ width: 100, height: 50 }),
      nodeRenderer: (ctx: NodeRenderContext) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        ctx.group.appendChild(el)
      },
      nodeTemplate: () => '<i>tpl</i>',
    })
    expect(c2.querySelector('g[data-id="a"] foreignObject')).toBeNull()
    expect(c2.querySelector('g[data-id="a"] rect')).toBeTruthy()
  })

  it('自定义模式下徽标仍按自定义宽度定位，折叠功能正常', () => {
    const { container, tree } = mount(fixture(), {
      nodeSize: () => ({ width: 160, height: 50 }),
      nodeTemplate: (data: TreeNodeData) => `<span>${data.name}</span>`,
    })
    const cx = Number(
      container.querySelector('g[data-id="a"] circle.d3t-badge-circle')!.getAttribute('cx'),
    )
    expect(cx).toBeCloseTo(-(160 / 2 + 10), 0) // 左半区徽标在节点外左侧
    // 折叠切换正常
    click(container.querySelector('g[data-id="a"]')!)
    expect(
      container.querySelector('g[data-id="a"] text.d3t-badge-symbol')!.textContent,
    ).toBe('+')
    tree.toggle('a')
    expect(
      container.querySelector('g[data-id="a"] text.d3t-badge-symbol')!.textContent,
    ).toBe('−')
  })

  it('nodeColor 在自定义渲染模式下不侵入用户内容（无默认 rect 可刷新）', () => {
    const nodeColor = vi.fn(() => '#123456')
    mount(fixture(), {
      nodeSize: () => ({ width: 100, height: 50 }),
      nodeRenderer: (ctx: NodeRenderContext) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('fill', '#ABCDEF')
        rect.setAttribute('width', '100')
        rect.setAttribute('height', '50')
        ctx.group.appendChild(rect)
      },
      nodeColor,
    })
    // nodeRenderer 模式下不调用默认填色路径（rectFill 不被触及）
    expect(nodeColor).not.toHaveBeenCalled()
  })

  it('导出序列化包含自定义 HTML 内容', async () => {
    const blobs: Blob[] = []
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn((b: Blob) => {
          blobs.push(b)
          return 'blob:mock'
        }),
        revokeObjectURL: vi.fn(),
      }),
    )
    const downloads: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    const { tree } = mount(fixture(), {
      nodeSize: () => ({ width: 140, height: 44 }),
      nodeTemplate: (data: TreeNodeData) => `<em>自定义-${data.name}</em>`,
    })
    await tree.exportImage({ format: 'svg' })
    const text = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blobs[0]!)
    })
    expect(downloads[0]).toBe('bidirectional-tree.svg')
    expect(text).toContain('自定义-甲板块')
    expect(text).toContain('foreignObject')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
})
