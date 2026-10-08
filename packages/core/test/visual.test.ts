import { describe, expect, it, vi } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

/** 分组数据：左侧 A 组（含子树），右侧 B 组 + 无分组节点 */
function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      {
        id: 'a',
        name: '甲板块',
        side: 'left',
        group: 'A',
        properties: { 成立: '2010年', 说明: '<b>转义测试</b>' },
        children: [
          { id: 'a1', name: '甲一', group: 'A' },
          { id: 'a2', name: '甲二', group: 'A' },
        ],
      },
      { id: 'b', name: '乙板块', side: 'right', group: 'B', children: [{ id: 'b1', name: '乙一', group: 'B' }] },
      { id: 'c', name: '丙板块', side: 'right' },
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

function hover(el: Element, type: 'mouseenter' | 'mouseleave'): void {
  el.dispatchEvent(new MouseEvent(type, { bubbles: false }))
}

describe('着色 + tooltip + 图例筛选（工单05）', () => {
  it('colorByGroup：同组同色、异组异色、根节点不受影响、分色节点白字', () => {
    const { container } = mount(fixture(), { colorByGroup: true })
    const fill = (id: string) => container.querySelector(`g[data-id="${id}"] rect`)!.getAttribute('fill')
    expect(fill('a')).toBe(fill('a1'))
    expect(fill('a')).not.toBe(fill('b'))
    expect(fill('root')).toBe('#1E6EFF')
    // 分色节点文字为白色，根白字，无分组节点深灰
    const textColor = (id: string) =>
      container.querySelector(`g[data-id="${id}"] text.d3t-label`)!.getAttribute('fill')
    expect(textColor('a')).toBe('#FFFFFF')
    expect(textColor('c')).toBe('#303133')
    // 节点携带分组类名
    expect(container.querySelector('g[data-id="a"]')!.classList.contains('d3t-group--A')).toBe(true)
  })

  it('默认不开启 colorByGroup 保持白节点；nodeColor 回调优先于分组色', () => {
    const { container } = mount(fixture(), {
      colorByGroup: true,
      nodeColor: (n: TreeNodeData) => (n.id === 'a1' ? '#123456' : undefined),
    })
    expect(container.querySelector('g[data-id="a1"] rect')!.getAttribute('fill')).toBe('#123456')
  })

  it('onGroupsChange 回调携带分组名与颜色', () => {
    const onGroupsChange = vi.fn()
    mount(fixture(), { colorByGroup: true, onGroupsChange })
    expect(onGroupsChange).toHaveBeenCalledTimes(1)
    const groups = onGroupsChange.mock.calls[0]![0] as Array<{ name: string; color: string }>
    expect(groups.map(g => g.name)).toEqual(['A', 'B'])
    expect(groups[0]!.color).toMatch(/^#/)
  })

  it('悬停显示 tooltip：默认渲染名称与 properties 键值并转义 HTML', () => {
    const { container } = mount(fixture())
    const tooltip = container.querySelector<HTMLDivElement>('div.d3t-tooltip')!
    expect(tooltip.style.display).toBe('none')

    hover(container.querySelector('g[data-id="a"]')!, 'mouseenter')
    expect(tooltip.style.display).toBe('block')
    expect(tooltip.innerHTML).toContain('甲板块')
    expect(tooltip.innerHTML).toContain('成立')
    expect(tooltip.innerHTML).toContain('2010年')
    // properties 值中的 HTML 被转义
    expect(tooltip.innerHTML).toContain('&lt;b&gt;转义测试&lt;/b&gt;')
    expect(tooltip.querySelector('b')).toBeNull()

    hover(container.querySelector('g[data-id="a"]')!, 'mouseleave')
    expect(tooltip.style.display).toBe('none')
  })

  it('自定义 tooltip formatter 生效', () => {
    const { container } = mount(fixture(), {
      tooltip: { formatter: (n: TreeNodeData) => `<span class="custom">${n.name}-详情</span>` },
    })
    const tooltip = container.querySelector<HTMLDivElement>('div.d3t-tooltip')!
    hover(container.querySelector('g[data-id="a"]')!, 'mouseenter')
    expect(tooltip.innerHTML).toContain('<span class="custom">甲板块-详情</span>')
  })

  it('setVisibleGroups 过滤分组（连同子树），null 恢复全部', () => {
    const { container, tree } = mount(fixture())
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)

    tree.setVisibleGroups(['A'])
    // 仅保留 root + a 子树（A 组）+ 无分组的 c；B 组的 b、b1 隐藏
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(5)
    expect(container.querySelector('g[data-id="b"]')).toBeNull()
    expect(container.querySelector('g[data-id="b1"]')).toBeNull()
    expect(container.querySelector('g[data-id="a1"]')).not.toBeNull()

    tree.setVisibleGroups(null)
    expect(container.querySelectorAll('g.d3t-node')).toHaveLength(7)
  })
})
