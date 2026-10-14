import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeInstance } from '../src'
import { theme } from '../src/theme'

let tree: TreeInstance | undefined
afterEach(() => {
  tree?.destroy()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllTimers()
  vi.useRealTimers()
})
const data = () => ({ id: 'root', name: 'root', children: [{ id: 'a', name: 'a' }] })
function mount(extra = {}) {
  const container = document.createElement('div')
  tree = createBidirectionalTree(container, {
    data: data(),
    duration: 0,
    measureText: () => 100,
    ...extra,
  })
  return container
}
describe('资源与尺寸回归', () => {
  it('悬浮框显示、防抖和淡出在各自阈值前后执行', async () => {
    vi.useFakeTimers()
    const container = mount({ tooltip: { showDelay: 80, hideDelay: 50, fadeDuration: 100 } })
    const item = container.querySelector('g[data-id="a"]')!
    const tooltip = container.querySelector<HTMLElement>('.d3t-tooltip')!
    item.dispatchEvent(new MouseEvent('mouseenter'))
    await vi.advanceTimersByTimeAsync(79)
    expect(tooltip.style.display).toBe('none')
    await vi.advanceTimersByTimeAsync(1)
    expect(tooltip.style.display).toBe('block')
    await vi.advanceTimersByTimeAsync(16)
    item.dispatchEvent(new MouseEvent('mouseleave'))
    await vi.advanceTimersByTimeAsync(49)
    expect(tooltip.style.opacity).toBe('1')
    await vi.advanceTimersByTimeAsync(1)
    expect(tooltip.style.opacity).toBe('0')
    await vi.advanceTimersByTimeAsync(99)
    expect(tooltip.style.display).toBe('block')
    await vi.advanceTimersByTimeAsync(1)
    expect(tooltip.style.display).toBe('none')
  })
  it('showDelay 缺省为 300：悬停停留 300ms 才显示，设 0 回到即刻显示', async () => {
    vi.useFakeTimers()
    const container = mount({ tooltip: {} })
    const item = container.querySelector('g[data-id="a"]')!
    const tooltip = container.querySelector<HTMLElement>('.d3t-tooltip')!
    item.dispatchEvent(new MouseEvent('mouseenter'))
    await vi.advanceTimersByTimeAsync(299)
    expect(tooltip.style.display).toBe('none')
    await vi.advanceTimersByTimeAsync(1)
    expect(tooltip.style.display).toBe('block')
  })
  it('默认分组、聚合和徽标文字与背景对比度达到 4.5', () => {
    const luminance = (hex: string) => {
      const channels = [1, 3, 5].map((index) => {
        const value = parseInt(hex.slice(index, index + 2), 16) / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
    }
    const contrast = (a: string, b: string) =>
      (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
    const container = mount({
      colorByGroup: true,
      data: {
        id: 'root',
        name: 'root',
        children: theme.groupPalette.map((_, index) => ({
          id: `node-${index}`,
          name: 'label',
          group: String(index),
          children: [
            { id: `leaf-${index}`, name: 'leaf' },
            { id: `hidden-${index}`, name: 'hidden' },
          ],
        })),
      },
      visibleChildrenLimit: 1,
    })
    for (const item of container.querySelectorAll('g.d3t-node--node')) {
      const background = item.querySelector('rect')!.getAttribute('fill')!
      const foreground = item.querySelector('text.d3t-label')!.getAttribute('fill')!
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(theme.aggregateText, theme.nodeFill)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(theme.badgeText, theme.badgeFill)).toBeGreaterThanOrEqual(4.5)
  })
  it('destroy 后命令不修改数据或产出 DOM/回调，导出明确拒绝', async () => {
    const initial = data(),
      onGroupsChange = vi.fn(),
      onNodeToggle = vi.fn()
    const container = mount({ data: initial, onGroupsChange, onNodeToggle })
    tree!.destroy()
    onGroupsChange.mockClear()
    tree!.setData(data())
    tree!.toggle('a')
    tree!.expandAll()
    tree!.collapseAll()
    tree!.zoomToFit()
    tree!.setVisibleGroups([])
    tree!.clearSearch()
    expect(tree!.search('a')).toBe(0)
    expect(tree!.addChild('root', { id: 'new', name: 'new' })).toBe(false)
    expect(tree!.removeChild('a')).toBe(false)
    await expect(tree!.exportImage()).rejects.toThrow('已销毁')
    expect(initial.children).toHaveLength(1)
    expect(container.children).toHaveLength(0)
    expect(onGroupsChange).not.toHaveBeenCalled()
    expect(onNodeToggle).not.toHaveBeenCalled()
  })
  it('自定义内容刷新/退出/销毁各调用一次清理，不删除徽标', () => {
    const cleanup = vi.fn()
    const container = mount({ nodeRenderer: () => cleanup })
    tree!.setData(data())
    expect(cleanup).toHaveBeenCalledTimes(2)
    expect(container.querySelectorAll('g.d3t-badge')).toHaveLength(1)
    tree!.removeChild('a')
    expect(cleanup).toHaveBeenCalledTimes(4) // 退出 a，刷新 root
    tree!.destroy()
    tree!.destroy()
    expect(cleanup).toHaveBeenCalledTimes(5)
  })
  it('resize 重新居中不清除当前缩放，destroy 断开观察器', () => {
    const callbacks: Array<{ callback: ResizeObserverCallback; targets: Element[] }> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        record: { callback: ResizeObserverCallback; targets: Element[] }
        constructor(callback: ResizeObserverCallback) {
          this.record = { callback, targets: [] }
          callbacks.push(this.record)
        }
        observe(target: Element) {
          this.record.targets.push(target)
        }
        disconnect() {
          this.record.targets.length = 0
        }
      },
    )
    const container = mount()
    let width = 900
    Object.defineProperty(container, 'clientWidth', { get: () => width })
    Object.defineProperty(container, 'clientHeight', { value: 600 })
    tree!.zoomToFit()
    const zoom = container.querySelector('.d3t-zoom')!.getAttribute('transform')
    const observer = callbacks.find((item) => item.targets.includes(container))!
    observer.callback([], {} as ResizeObserver)
    expect(container.querySelector('.d3t-chart')!.getAttribute('transform')).toBe(
      'translate(450,300)',
    )
    width = 1000
    observer.callback([], {} as ResizeObserver)
    expect(container.querySelector('.d3t-chart')!.getAttribute('transform')).toBe(
      'translate(500,300)',
    )
    expect(container.querySelector('.d3t-zoom')!.getAttribute('transform')).toBe(zoom)
    tree!.destroy()
    expect(callbacks.every((item) => item.targets.length === 0)).toBe(true)
  })
  it.each(['image', 'canvas', 'encode'] as const)('PNG %s 失败仍释放 blob URL', async (mode) => {
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: revoke })
    vi.stubGlobal(
      'Image',
      class {
        onload?: () => void
        onerror?: () => void
        set src(_value: string) {
          queueMicrotask(() => (mode === 'image' ? this.onerror?.() : this.onload?.()))
        }
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mode === 'canvas'
        ? null
        : ({
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          } as unknown as CanvasRenderingContext2D),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))
    mount()
    await expect(tree!.exportImage()).rejects.toThrow(
      mode === 'image'
        ? 'SVG 图像加载失败'
        : mode === 'canvas'
          ? 'Canvas 2D 上下文不可用'
          : 'PNG 编码失败',
    )
    expect(revoke).toHaveBeenCalledWith('blob:test')
  })
  it('PNG 编码期间销毁不再下载，但仍回收转换 URL', async () => {
    const revoke = vi.fn(),
      download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: revoke })
    vi.stubGlobal(
      'Image',
      class {
        onload?: () => void
        set src(_value: string) {
          queueMicrotask(() => this.onload?.())
        }
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    let encoded!: BlobCallback
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      encoded = callback
    })
    mount()
    const pending = tree!.exportImage()
    await Promise.resolve()
    await Promise.resolve()
    tree!.destroy()
    encoded(new Blob(['PNG'], { type: 'image/png' }))
    await pending
    expect(download).not.toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledWith('blob:test')
  })
})
