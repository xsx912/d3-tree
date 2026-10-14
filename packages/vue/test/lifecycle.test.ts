import { afterEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import type { App } from 'vue'
import { BidirectionalTree } from '../src'
import type { BidirectionalTreeExposed } from '../src'

let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('ref 导出命令委托真实 core 并生成指定 PNG 下载', async () => {
  const handle = ref<BidirectionalTreeExposed>()
  const container = document.createElement('div')
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
  app = createApp({
    render: () =>
      h(BidirectionalTree, {
        ref: handle,
        data: { id: 'root', name: 'root' },
        duration: 0,
        measureText: () => 100,
      }),
  })
  app.mount(container)
  await handle.value!.exportImage({ format: 'png', filename: 'Vue-图谱' })
  expect(downloads).toEqual(['Vue-图谱.png'])
})
it.each([true, false])('条件插槽有→无→有安全回退和清理，缓存=%s', async (tooltipCache) => {
  const shown = ref(true),
    version = ref(1)
  const destroyed = vi.fn()
  const data = { id: 'root', name: 'default' }
  const measureText = () => 100
  const Content = defineComponent({
    props: ['version'],
    unmounted: destroyed,
    render() {
      return h('b', `slot-${this.version}`)
    },
  })
  const container = document.createElement('div')
  app = createApp({
    render: () =>
      h(
        BidirectionalTree,
        {
          data,
          duration: 0,
          measureText,
          // 该用例 nextTick 后同步断言 tooltip 内容：归零与 core 默认值解耦
          tooltipShowDelay: 0,
          tooltipCache,
        },
        shown.value ? { tooltip: () => h(Content, { version: version.value }) } : {},
      ),
  })
  const error = vi.fn()
  app.config.errorHandler = error
  app.mount(container)
  const hover = async () => {
    container.querySelector('g.d3t-node')!.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
  }
  await hover()
  expect(container.querySelector('.d3t-tooltip')!.textContent).toBe('slot-1')
  version.value = 2
  await nextTick()
  await hover()
  expect(container.querySelector('.d3t-tooltip')!.textContent).toBe('slot-2')
  shown.value = false
  await nextTick()
  await hover()
  expect(error).not.toHaveBeenCalled()
  expect(container.querySelector('.d3t-tooltip')!.textContent).toContain('default')
  expect(destroyed).toHaveBeenCalled()
  shown.value = true
  await nextTick()
  await hover()
  expect(container.querySelector('.d3t-tooltip')!.textContent).toBe('slot-2')
  expect(container.querySelectorAll('svg')).toHaveLength(1)
})
