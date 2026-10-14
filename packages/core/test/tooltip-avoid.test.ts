import { describe, expect, it } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData } from '../src'
import { ZoomTransform } from 'd3-zoom'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function mount(
  data: TreeNodeData,
  extra: Record<string, unknown> = {},
): {
  container: HTMLElement
  tree: ReturnType<typeof createBidirectionalTree>
} {
  const container = document.createElement('div')
  const tree = createBidirectionalTree(container, {
    data,
    measureText: fixedMeasure,
    duration: 0,
    ...extra,
    // 本文件聚焦避让几何：showDelay 归零让悬停同步显示，与 core 默认值解耦
    tooltip: { showDelay: 0, ...(extra.tooltip as object | undefined) },
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

/** 节点布局盒（g 的 translate 与 rect 的 width/height，布局坐标系） */
function nodeBox(container: HTMLElement, id: string): {
  x: number
  y: number
  width: number
  height: number
} {
  const g = nodeById(container, id)
  const rect = g.querySelector('rect')!
  const m = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(g.getAttribute('transform') ?? '')
  expect(m, `节点 ${id} 应有 transform`).toBeTruthy()
  return {
    x: Number(m![1]),
    y: Number(m![2]),
    width: Number(rect.getAttribute('width')),
    height: Number(rect.getAttribute('height')),
  }
}

/** 直接写 d3-zoom 的内部变换（zoomTransform 即读该属性）：测试里精确控制 k */
function setZoom(container: HTMLElement, k: number, tx = 0, ty = 0): void {
  const svg = container.querySelector('svg')!
  ;(svg as unknown as { __zoom: ZoomTransform }).__zoom = new ZoomTransform(k, tx, ty)
}

/** jsdom 无布局：mock 悬浮层盒尺寸，令碰撞避让有真实的 w/h 可用 */
function mockTipSize(container: HTMLElement, width: number, height: number): void {
  const el = tooltipEl(container)
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width })
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height })
}

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

/** 布局盒 → 屏幕盒：gChart 居中平移 (400,300)（jsdom size() 回落 800×600）与 zoom 变换复合 */
function screenBox(
  box: { x: number; y: number; width: number; height: number },
  k: number,
  tx: number,
  ty: number,
): Rect {
  const cx = k * (400 + box.x) + tx
  const cy = k * (300 + box.y) + ty
  return {
    left: cx - (box.width * k) / 2,
    top: cy - (box.height * k) / 2,
    right: cx + (box.width * k) / 2,
    bottom: cy + (box.height * k) / 2,
  }
}

function tipRect(tip: HTMLDivElement): Rect {
  const left = parseFloat(tip.style.left)
  const top = parseFloat(tip.style.top)
  return { left, top, right: left + tip.offsetWidth, bottom: top + tip.offsetHeight }
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

function baseFixture(): TreeNodeData {
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

/** 折叠手柄外缘相对节点边缘的布局距离：中心偏移 badgeRadius+3，再加自身半径 */
const HANDLE_EXTENT = 7 * 2 + 3
const GAP = 12

describe('悬浮层遮挡避让（尺寸保持屏幕恒定）', () => {
  describe('折叠手柄避让（沿轴间隙计入手柄外缘）', () => {
    it('带子节点的左枝节点 k=1：左移间隙为 GAP+HANDLE_EXTENT*1', () => {
      const { container } = mount(baseFixture())
      const a = nodeById(container, 'a')
      const box = nodeBox(container, 'a')
      hover(a)
      const left = parseFloat(tooltipEl(container).style.left)
      expect(left).toBeCloseTo(400 + box.x - box.width / 2 - (GAP + HANDLE_EXTENT), 5)
    })

    it('放大 k=2：间隙按 GAP+HANDLE_EXTENT*k 等比扩大，悬浮层不再压手柄', () => {
      const { container } = mount(baseFixture())
      setZoom(container, 2)
      const a = nodeById(container, 'a')
      const box = nodeBox(container, 'a')
      hover(a)
      const left = parseFloat(tooltipEl(container).style.left)
      expect(left).toBeCloseTo(2 * (400 + box.x) - box.width - (GAP + HANDLE_EXTENT * 2), 5)
    })

    it('叶子节点（无手柄）k=2：间隙保持 GAP 不扩大', () => {
      const { container } = mount(baseFixture())
      setZoom(container, 2)
      const a1 = nodeById(container, 'a1')
      const box = nodeBox(container, 'a1')
      hover(a1)
      const left = parseFloat(tooltipEl(container).style.left)
      expect(left).toBeCloseTo(2 * (400 + box.x) - box.width - GAP, 5)
    })

    it('懒加载未展开（hasChildren）的节点同样让过手柄', () => {
      const data = baseFixture()
      ;(data.children![0] as TreeNodeData).children = undefined
      ;(data.children![0] as TreeNodeData).hasChildren = true
      const { container } = mount(data)
      const a = nodeById(container, 'a')
      const box = nodeBox(container, 'a')
      hover(a)
      const left = parseFloat(tooltipEl(container).style.left)
      expect(left).toBeCloseTo(400 + box.x - box.width / 2 - (GAP + HANDLE_EXTENT), 5)
    })
  })

  describe('相邻节点避让（沿正交轴滑移）', () => {
    it('缩小后与子节点列重叠：悬浮层沿垂直轴滑移至零遮挡位置', () => {
      const k = 0.5
      const { container } = mount(baseFixture())
      setZoom(container, k)
      mockTipSize(container, 80, 36)
      const a = nodeById(container, 'a')
      hover(a)
      const tip = tooltipEl(container)
      const rect = tipRect(tip)

      // 前置自证：垂直居中的初位置（cy-18）确实与子节点列重叠，避让逻辑被真实触发
      const anchor = screenBox(nodeBox(container, 'a'), k, 0, 0)
      const cy = (anchor.top + anchor.bottom) / 2
      const initial = { left: rect.left, top: cy - 18, right: rect.right, bottom: cy + 18 }
      const kidBoxes = ['a1', 'a2', 'b', 'b1', 'root'].map((id) =>
        screenBox(nodeBox(container, id), k, 0, 0),
      )
      expect(
        kidBoxes.reduce((sum, b) => sum + overlapArea(initial, b), 0),
        '前置条件：初位置应与节点重叠',
      ).toBeGreaterThan(0)

      // 断言：滑移后与所有非锚节点零遮挡
      for (const id of ['a1', 'a2', 'b', 'b1', 'root']) {
        const node = screenBox(nodeBox(container, id), k, 0, 0)
        expect(overlapArea(rect, node), `悬浮层不应遮挡节点 ${id}`).toBe(0)
      }
      // 仍在视口内
      expect(rect.top).toBeGreaterThanOrEqual(2)
      expect(rect.bottom).toBeLessThanOrEqual(598)
    })

    it('外侧被子节点列占满时换贴锚姿态，不大滑移飘离锚点', () => {
      // k=1 且卡片宽 130 > 列间空隙：外侧贴合横跨子节点列，内侧又贴到根——
      // 旧行为沿正交轴大滑移约百像素，卡片视觉上"飞离"锚点（demo 实测回归）
      const { container } = mount(baseFixture())
      mockTipSize(container, 130, 60)
      const a = nodeById(container, 'a')
      hover(a)
      const tip = tooltipEl(container)
      const rect = tipRect(tip)
      const anchor = screenBox(nodeBox(container, 'a'), 1, 0, 0)

      // 前置自证：外侧垂直居中的初位置确实与子节点列重叠，避让逻辑被真实触发
      const initial = {
        left: anchor.left - (GAP + HANDLE_EXTENT) - 130,
        top: (anchor.top + anchor.bottom) / 2 - 30,
        right: anchor.left - (GAP + HANDLE_EXTENT),
        bottom: (anchor.top + anchor.bottom) / 2 + 30,
      }
      const kidBoxes = ['a1', 'a2'].map((id) => screenBox(nodeBox(container, id), 1, 0, 0))
      expect(
        kidBoxes.reduce((sum, b) => sum + overlapArea(initial, b), 0),
        '前置条件：初位置应与子节点列重叠',
      ).toBeGreaterThan(0)

      // 断言 1：与所有非锚节点零遮挡
      for (const id of ['a1', 'a2', 'root', 'b', 'b1']) {
        const node = screenBox(nodeBox(container, id), 1, 0, 0)
        expect(overlapArea(rect, node), `悬浮层不应遮挡节点 ${id}`).toBe(0)
      }
      // 断言 2：贴锚不变式——卡片到锚的矩形间距不超过外侧贴合间隙（手柄让位后的正常间隙）
      const dx = Math.max(anchor.left - rect.right, rect.left - anchor.right, 0)
      const dy = Math.max(anchor.top - rect.bottom, rect.top - anchor.bottom, 0)
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(GAP + HANDLE_EXTENT + 1)
    })

    it('无处零遮挡时回退最小遮挡且钳制在视口内', () => {
      // 16 个子节点密排成整列：滑移范围内找不到零遮挡位
      const data: TreeNodeData = {
        id: 'root',
        name: '根节点',
        children: [
          {
            id: 'a',
            name: '甲板块',
            side: 'left',
            children: Array.from({ length: 16 }, (_, i) => ({
              id: `a${i}`,
              name: `子${i}`,
            })),
          },
        ],
      }
      const k = 0.25
      const { container } = mount(data)
      setZoom(container, k)
      mockTipSize(container, 80, 36)
      const a = nodeById(container, 'a')
      hover(a)
      const tip = tooltipEl(container)
      const left = parseFloat(tip.style.left)
      const top = parseFloat(tip.style.top)
      expect(Number.isFinite(left)).toBe(true)
      expect(Number.isFinite(top)).toBe(true)
      expect(top).toBeGreaterThanOrEqual(2)
      expect(top + 36).toBeLessThanOrEqual(598)
    })

    it('无遮挡场景不改变既有贴边行为（回归）', () => {
      const { container } = mount(baseFixture())
      const b = nodeById(container, 'b')
      const box = nodeBox(container, 'b')
      hover(b)
      const left = parseFloat(tooltipEl(container).style.left)
      // 右枝带子节点：右缘 = 节点右缘 + GAP+HANDLE_EXTENT（盒宽 0）
      expect(left).toBeCloseTo(400 + box.x + box.width / 2 + GAP + HANDLE_EXTENT, 5)
    })
  })

  describe('垂直布局对称', () => {
    it('垂直布局：手柄避让与滑移避让同样生效', () => {
      const k = 0.5
      const { container } = mount(baseFixture(), { orientation: 'vertical' })
      setZoom(container, k)
      mockTipSize(container, 80, 36)
      const a = nodeById(container, 'a')
      hover(a)
      const tip = tooltipEl(container)
      const rect = tipRect(tip)
      for (const id of ['a1', 'a2', 'b', 'b1', 'root']) {
        const node = screenBox(nodeBox(container, id), k, 0, 0)
        expect(overlapArea(rect, node), `悬浮层不应遮挡节点 ${id}`).toBe(0)
      }
    })
  })
})
