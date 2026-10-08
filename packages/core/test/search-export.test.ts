import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

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
        collapsed: true,
        children: [
          { id: 'a1', name: '甲一', properties: { 备注: '特别标注' } },
          { id: 'a2', name: '甲二' },
        ],
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

/** jsdom 的 Blob 可能没有 .text()，用 FileReader 兜底读取 */
async function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe('搜索高亮定位（工单06）', () => {
  it('命中节点与祖先链高亮、其余淡化；返回命中数', () => {
    const { container, tree } = mount(fixture())
    // a 初始折叠 → a1、a2 隐藏（可见：root、a、b、b1）
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(4)
    const hits = tree.search('甲一')
    expect(hits).toBe(1)
    // 命中路径自动展开：a1 出现
    expect(container.querySelector('g[data-id="a1"]')).toBeTruthy()
    expect(container.querySelector('g[data-id="a1"]')!.classList.contains('d3t-hit')).toBe(true)
    // 祖先链：root、a
    expect(container.querySelector('g[data-id="a"]')!.classList.contains('d3t-hit-ancestor')).toBe(true)
    expect(container.querySelector('g[data-id="root"]')!.classList.contains('d3t-dimmed')).toBe(false)
    // 非相关节点淡化
    expect(container.querySelector('g[data-id="b"]')!.classList.contains('d3t-dimmed')).toBe(true)
  })

  it('properties 值同样参与匹配', () => {
    const { container, tree } = mount(fixture())
    expect(tree.search('特别标注')).toBe(1)
    expect(container.querySelector('g[data-id="a1"]')!.classList.contains('d3t-hit')).toBe(true)
  })

  it('无命中返回 0 且不清空现有高亮', () => {
    const { container, tree } = mount(fixture())
    tree.search('甲一')
    expect(tree.search('不存在的词')).toBe(0)
    expect(container.querySelector('g[data-id="a1"]')!.classList.contains('d3t-hit')).toBe(true)
  })

  it('命中聚合隐藏区时自动释放聚合', () => {
    const data: TreeNodeData = {
      id: 'root',
      name: '根',
      children: [
        {
          id: 'p',
          name: '父板块',
          side: 'right',
          children: Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `项${i}` })),
        },
      ],
    }
    const { container, tree } = mount(data, { visibleChildrenLimit: 5 })
    // 初始：5 项 + 展开(3)，p7 不可见
    expect(container.querySelector('g[data-id="p7"]')).toBeNull()
    expect(tree.search('项7')).toBe(1)
    // 命中节点被释放并高亮
    expect(container.querySelector('g[data-id="p7"]')!.classList.contains('d3t-hit')).toBe(true)
    expect(container.querySelector('g[data-id="__agg__p"]')).toBeNull()
  })

  it('视口平移定位到首个命中（zoom 变换不再是恒等）', () => {
    const { container, tree } = mount(fixture())
    const before = container.querySelector('g.d3t-zoom')!.getAttribute('transform')
    tree.search('甲一')
    const after = container.querySelector('g.d3t-zoom')!.getAttribute('transform')
    expect(after).toBeTruthy()
    expect(after).not.toBe(before)
  })

  it('clearSearch 还原高亮与淡化', () => {
    const { container, tree } = mount(fixture())
    tree.search('甲一')
    tree.clearSearch()
    expect(container.querySelector('g[data-id="a1"]')!.classList.contains('d3t-hit')).toBe(false)
    expect(container.querySelector('g[data-id="b"]')!.classList.contains('d3t-dimmed')).toBe(false)
  })
})

describe('导出 PNG/SVG（工单06）', () => {
  const downloads: Array<{ href: string; download: string }> = []
  const blobs: Blob[] = []

  beforeEach(() => {
    downloads.length = 0
    blobs.length = 0
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ href: this.href, download: this.download })
    })
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
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('导出 SVG：触发下载且序列化内容包含节点文本与内联样式', async () => {
    const { tree } = mount(fixture())
    await tree.exportImage({ format: 'svg', filename: '图谱' })
    expect(downloads).toHaveLength(1)
    expect(downloads[0]!.download).toBe('图谱.svg')
    expect(downloads[0]!.href).toContain('blob:')
    const blob = blobs[0]!
    expect(blob.type).toBe('image/svg+xml;charset=utf-8')
    const text = await readBlobText(blob)
    expect(text).toContain('根节点')
    expect(text).toContain('甲板块')
    expect(text).toContain('.d3t-dimmed')
    expect(text).toMatch(/viewBox=/)
  })

  it('导出 PNG：SVG 转 canvas 后以 data URL 下载', async () => {
    // mock Image：src 赋值即异步触发 onload
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    const drawImage = vi.fn()
    const toDataURL = vi.fn(() => 'data:image/png;base64,FAKEPNG')
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(toDataURL)

    const { tree } = mount(fixture())
    await tree.exportImage({ format: 'png', scale: 2, filename: '图谱' })

    expect(toDataURL).toHaveBeenCalledWith('image/png')
    expect(downloads).toHaveLength(1)
    expect(downloads[0]!.download).toBe('图谱.png')
    expect(downloads[0]!.href.startsWith('data:image/png')).toBe(true)
    // 画布尺寸为内容 × scale（fixedMeasure 下包围盒 > 0）
    const canvasCalls = drawImage.mock.calls
    expect(canvasCalls.length).toBeGreaterThan(0)
  })
})
