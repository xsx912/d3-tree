import { afterEach, expect, it, vi } from 'vitest'
import { act, createElement, createRef, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { BidirectionalTree } from '../src'
import type { BidirectionalTreeHandle } from '../src'

const data = {
  id: 'root',
  name: 'root',
  children: [{ id: 'a', name: 'branch', children: [{ id: 'leaf', name: 'leaf' }] }],
}
const measureText = () => 100
let root: Root | undefined
afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
function setup() {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  root = createRoot(container)
  return { container, ref: createRef<BidirectionalTreeHandle>() }
}
it('ref 导出命令委托真实 core 并生成指定 PNG 下载', async () => {
  const { ref } = setup()
  const downloads: string[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download)
  })
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:test', revokeObjectURL: vi.fn() })
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
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
    callback(new Blob(['PNG'], { type: 'image/png' })),
  )
  await act(async () =>
    root!.render(createElement(BidirectionalTree, { ref, data, duration: 0, measureText })),
  )
  await ref.current!.exportImage({ format: 'png', filename: 'React-图谱' })
  expect(downloads).toEqual(['React-图谱.png'])
})
it('内联悬停回调和开关更新保留实例、折叠、搜索与最新闭包', async () => {
  const { container, ref } = setup()
  const calls = vi.fn()
  const render = async (version: number, toggleOnNodeClick: boolean) => {
    await act(async () =>
      root!.render(
        createElement(BidirectionalTree, {
          data,
          duration: 0,
          measureText,
          ref,
          toggleOnNodeClick,
          onNodeHover: () => calls(version),
          onNodeHoverEnd: () => calls(-version),
        }),
      ),
    )
  }
  await render(1, true)
  const svg = container.querySelector('svg')
  act(() => {
    ref.current!.toggle('a')
    ref.current!.search('branch')
  })
  // 搜索 a 不会展开其子级。
  await render(2, false)
  expect(container.querySelector('svg')).toBe(svg)
  expect(container.querySelector('[data-id="leaf"]')).toBeNull()
  expect(container.querySelector('[data-id="a"]')!.classList.contains('d3t-hit')).toBe(true)
  const a = container.querySelector('[data-id="a"]')!
  a.dispatchEvent(new MouseEvent('mouseenter'))
  a.dispatchEvent(new MouseEvent('mouseleave'))
  expect(calls.mock.calls).toEqual([[2], [-2]])
  a.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(container.querySelector('[data-id="leaf"]')).toBeNull()
  await render(3, true)
  a.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(container.querySelector('[data-id="leaf"]')).toBeTruthy()
})
it('动态 hoverEnd 和自接管模式切换正确；StrictMode 无重复实例', async () => {
  const { container } = setup()
  const onNodeHover = vi.fn(),
    onNodeHoverEnd = vi.fn()
  const render = async (enabled: boolean, end: boolean) => {
    await act(async () =>
      root!.render(
        createElement(
          StrictMode,
          null,
          createElement(BidirectionalTree, {
            data,
            duration: 0,
            measureText,
            onNodeHover: enabled ? onNodeHover : undefined,
            onNodeHoverEnd: end ? onNodeHoverEnd : undefined,
          }),
        ),
      ),
    )
  }
  await render(true, false)
  const svg = container.querySelector('svg')
  await render(true, true)
  expect(container.querySelector('svg')).toBe(svg)
  const a = container.querySelector('[data-id="a"]')!
  a.dispatchEvent(new MouseEvent('mouseenter'))
  a.dispatchEvent(new MouseEvent('mouseleave'))
  expect(onNodeHoverEnd).toHaveBeenCalledTimes(1)
  await render(false, false)
  expect(container.querySelectorAll('svg')).toHaveLength(1)
  container.querySelector('[data-id="a"]')!.dispatchEvent(new MouseEvent('mouseenter'))
  expect(container.querySelector<HTMLElement>('.d3t-tooltip')!.style.display).toBe('block')
})
