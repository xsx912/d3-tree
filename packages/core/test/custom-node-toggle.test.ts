import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { NodeRenderContext, TreeNodeData, TreeInstance } from '../src'

const SVG_NS = 'http://www.w3.org/2000/svg'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根',
    children: [
      {
        id: 'a',
        name: '节点A',
        children: [
          { id: 'a1', name: 'A1' },
          { id: 'a2', name: 'A2' },
        ],
      },
    ],
  }
}

function mount(
  data: TreeNodeData,
  extra: Record<string, unknown> = {},
): { container: HTMLElement; tree: TreeInstance } {
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

/** 模板字符串内含 data-d3t-toggle 标记的 chip 与普通 label 区域 */
const chipTemplate = (data: TreeNodeData, variant: 'root' | 'node' | 'aggregate'): string =>
  variant === 'root'
    ? `<div style="width:100%;height:100%">${data.name}</div>`
    : `<div style="width:100%;height:100%;display:flex;">
        <span class="chip" data-d3t-toggle style="cursor:pointer;">折</span>
        <span class="label">${data.name}</span>
      </div>`

describe('自定义节点 data-d3t-toggle 标记区域折叠', () => {
  it('nodeTemplate 标记区域点击切换折叠态，并广播 onNodeToggle', () => {
    const onNodeToggle = vi.fn()
    const { container } = mount(fixture(), { nodeTemplate: chipTemplate, onNodeToggle })
    const a = node(container, 'a')
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    click(a.querySelector('.chip')!)
    expect(container.querySelector('g[data-id="a1"]')).toBeNull() // 已折叠
    expect(a.querySelector('text.d3t-badge-symbol')!.textContent).toBe('+')
    expect(a.getAttribute('aria-expanded')).toBe('false')
    expect(onNodeToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), true)

    click(a.querySelector('.chip')!)
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy() // 再点还原
  })

  it('标记区域点击不触发 onNodeClick / onNodeSelect（同徽标按钮语义）', () => {
    const onNodeClick = vi.fn()
    const onNodeSelect = vi.fn()
    const { container } = mount(fixture(), {
      nodeTemplate: chipTemplate,
      onNodeClick,
      onNodeSelect,
    })
    const a = node(container, 'a')
    click(a.querySelector('.chip')!)
    expect(onNodeClick).not.toHaveBeenCalled()
    expect(onNodeSelect).not.toHaveBeenCalled()
    // 点击非标记区域仍走常规激活路径
    click(a.querySelector('.label')!)
    expect(onNodeClick).toHaveBeenCalledTimes(1)
    expect(onNodeSelect).toHaveBeenCalledTimes(1)
  })

  it('toggleOnNodeClick:false 时整节点点击不折叠，标记区域仍可折叠', () => {
    const { container } = mount(fixture(), {
      nodeTemplate: chipTemplate,
      toggleOnNodeClick: false,
    })
    const a = node(container, 'a')
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    click(a.querySelector('.label')!) // 卡片主体：仅回调，不折叠
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    click(a.querySelector('.chip')!) // 标记区域：仍可折叠
    expect(container.querySelector('g[data-id="a1"]')).toBeNull()
    expect(a.getAttribute('aria-expanded')).toBe('false')
  })

  it('nodeRenderer 绘制的 SVG 元素标记 data-d3t-toggle 同样生效', () => {
    const renderer = (ctx: NodeRenderContext): void => {
      if (ctx.variant === 'root') return
      const btn = document.createElementNS(SVG_NS, 'circle')
      btn.setAttribute('data-d3t-toggle', '')
      btn.setAttribute('class', 'chip')
      ctx.group.appendChild(btn)
      const label = document.createElementNS(SVG_NS, 'text')
      label.setAttribute('class', 'label')
      label.textContent = ctx.data.name
      ctx.group.appendChild(label)
    }
    const { container } = mount(fixture(), {
      nodeRenderer: renderer,
      toggleOnNodeClick: false,
    })
    const a = node(container, 'a')
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    click(a.querySelector('.chip')!)
    expect(container.querySelector('g[data-id="a1"]')).toBeNull()
  })

  it('未标记的自定义节点保持默认行为：整节点点击切换', () => {
    const { container } = mount(fixture(), {
      nodeTemplate: (data: TreeNodeData): string =>
        `<div style="width:100%;height:100%">${data.name}</div>`,
    })
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    click(node(container, 'a'))
    expect(container.querySelector('g[data-id="a1"]')).toBeNull()
  })
})
