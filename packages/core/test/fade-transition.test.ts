import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * jsdom 未实现 SVGElement#transform（baseVal），d3-interpolate 解析 transform 过渡即崩。
 * 补一个只支持 translate(x,y) 的最小 consolidate（本文件 transform 均为该形式），
 * 让位移过渡在 jsdom 里真实运行；仅影响本文件的 jsdom 实例。
 */
function polyfillSvgTransform(): void {
  if ('transform' in SVGElement.prototype) return
  Object.defineProperty(SVGElement.prototype, 'transform', {
    configurable: true,
    get() {
      return {
        baseVal: {
          consolidate: () => {
            const m = /translate\(([-\d.eE+]+)[, ]([-\d.eE+]+)\)/.exec(
              this.getAttribute('transform') ?? '',
            )
            const [, xs, ys] = m ?? []
            return { matrix: { a: 1, b: 0, c: 0, d: 1, e: Number(xs ?? 0), f: Number(ys ?? 0) } }
          },
        },
      }
    },
  })
}

/**
 * 淡入淡出的过渡过程测试。
 * d3-timer 在模块加载时捕获 setTimeout/performance/Date——先装 fake timers 再动态 import，
 * 即可用 advanceTimersByTime 确定性地驱动 250ms 过渡（jsdom 无 rAF，走 17ms setTimeout 回退）。
 */
let createBidirectionalTree: typeof import('../src').createBidirectionalTree
type TreeNodeData = import('../src').TreeNodeData

beforeAll(async () => {
  polyfillSvgTransform()
  // 连 rAF 一起 fake：jsdom 的 rAF 走启动时捕获的真实 setTimeout，fake 不到它；
  // d3-timer 在模块加载时绑定 window.requestAnimationFrame——先装假 rAF 再动态 import 才能被 advanceTimersByTime 驱动
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

afterAll(() => {
  vi.useRealTimers()
})

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

function nodeOpacity(container: HTMLElement, id: string): number | null {
  const el = container.querySelector<SVGGElement>(`g[data-id="${id}"]`)
  if (!el || el.getAttribute('opacity') === null) return null
  return Number(el.getAttribute('opacity'))
}

/** 全部连线的 opacity 数值集合（无属性的不计入）；断言数值而非元素数组，避免测试框架渲染 DOM diff */
function linkOpacities(container: HTMLElement): number[] {
  return [...container.querySelectorAll<SVGPathElement>('path.d3t-link[opacity]')].map(p =>
    Number(p.getAttribute('opacity')),
  )
}

describe('fadeOpacity 展开淡入/收起淡出（过渡过程）', () => {
  it('收起时子节点随回拢位移同步淡出，过渡结束后移除', () => {
    const { container, tree } = mount({ fadeOpacity: 0.3 })
    tree.toggle('a') // 收起
    vi.advanceTimersByTime(125) // 半程：位移与透明度均在途中
    expect(container.querySelector('g[data-id="a1"]'), '半程时 a1 应仍在 DOM').toBeTruthy()
    const mid = nodeOpacity(container, 'a1')
    expect(mid, '半程透明度应自 1 向 0.3 途中（大于目标值）').toBeGreaterThan(0.3)
    expect(mid).toBeLessThan(1)
    // 连线同步淡出：退场中的 a→a1、a→a2 两条透明度在途中（merged 元素恒为 1）
    const fadingOps = linkOpacities(container).filter(op => op < 1)
    expect(fadingOps).toHaveLength(2)
    for (const op of fadingOps) {
      expect(op).toBeGreaterThan(0.3)
      expect(op).toBeLessThan(1)
    }
    vi.advanceTimersByTime(400)
    expect(container.querySelector('g[data-id="a1"]'), '过渡结束后 a1 应被移除').toBeNull()
    expect(linkOpacities(container).filter(op => op < 1), '退场连线淡出完毕').toHaveLength(0)
  })

  it('展开时新节点以 fadeOpacity 为起点淡入，完成后恢复为 1', () => {
    const { container, tree } = mount({ fadeOpacity: 0.3 })
    tree.toggle('a')
    vi.advanceTimersByTime(400) // 等收起完成、退场元素移除
    tree.toggle('a') // 展开：a1/a2 走 enter
    expect(nodeOpacity(container, 'a1'), 'enter 瞬间透明度应为淡入起点 0.3').toBeCloseTo(0.3)
    expect(nodeOpacity(container, 'a2')).toBeCloseTo(0.3)
    // 新连线以 0.3 起点（merged 旧元素保持 1，不参与淡入）
    const enteringOps = linkOpacities(container).filter(op => op < 1)
    expect(enteringOps).toHaveLength(2)
    for (const op of enteringOps) expect(op).toBeCloseTo(0.3)
    vi.advanceTimersByTime(400)
    expect(nodeOpacity(container, 'a1'), '过渡完成后应恢复不透明').toBe(1)
    expect(linkOpacities(container).filter(op => op < 1), '新连线淡入完毕').toHaveLength(0)
  })

  it('未配置 fadeOpacity 时默认 0.25：进入元素以 0.25 起步淡入', () => {
    const { container, tree } = mount() // 不传 fadeOpacity，锁定新默认值
    tree.toggle('a')
    vi.advanceTimersByTime(400)
    tree.toggle('a')
    expect(nodeOpacity(container, 'a1'), 'enter 瞬间透明度应为默认淡入起点 0.25').toBeCloseTo(0.25)
    vi.advanceTimersByTime(400)
    expect(nodeOpacity(container, 'a1'), '过渡完成后恢复不透明').toBe(1)
  })

  it('fadeOpacity 超出 [0,1] 时钳制：负值按 0、超过 1 视为关闭淡入淡出', () => {
    const low = mount({ fadeOpacity: -0.5 })
    low.tree.toggle('a')
    vi.advanceTimersByTime(400)
    low.tree.toggle('a')
    // toBe 而非 toBeCloseTo：后者会把 null（未设置）当作 0，断言空转
    expect(nodeOpacity(low.container, 'a1'), '负值应钳制为 0').toBe(0)

    const high = mount({ fadeOpacity: 5 })
    high.tree.toggle('a')
    vi.advanceTimersByTime(400)
    high.tree.toggle('a')
    expect(nodeOpacity(high.container, 'a1'), '超过 1 不引入 opacity').toBeNull()
  })

  it('自定义连线路径时 fadeOpacity 仍作用于新连线（透明度与路径形变无关）', () => {
    const { container, tree } = mount({
      fadeOpacity: 0.3,
      linkPathGenerator: () => 'M0,0L40,0',
    })
    tree.toggle('a')
    vi.advanceTimersByTime(400)
    tree.toggle('a')
    const enteringOps = linkOpacities(container).filter(op => op < 1)
    expect(enteringOps).toHaveLength(2)
    for (const op of enteringOps) expect(op).toBeCloseTo(0.3)
    vi.advanceTimersByTime(400)
    expect(linkOpacities(container).filter(op => op < 1), '自定义路径下淡入同样完成').toHaveLength(0)
  })
})
