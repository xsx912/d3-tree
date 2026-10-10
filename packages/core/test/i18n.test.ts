import { describe, expect, it } from 'vitest'
import { createBidirectionalTree } from '../src'
import type { TreeNodeData, TreeInstance, TreeTexts } from '../src'

const fixedMeasure = (text: string, variant: 'root' | 'node' | 'aggregate'): number =>
  text.length * 10 + (variant === 'root' ? 48 : 28)

function child(id: string): TreeNodeData {
  return { id, name: `子${id}` }
}

/** a 左侧 7 子（默认 limit=5 → 聚合 2） */
function fixture(): TreeNodeData {
  return {
    id: 'root',
    name: '根节点',
    children: [
      {
        id: 'a',
        name: '甲板块',
        side: 'left',
        children: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'].map(child),
      },
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

function badgeTitle(container: HTMLElement, id: string): string {
  const el = container.querySelector(`g[data-id="${id}"] .d3t-badge title`)
  expect(el, `节点 ${id} 的徽标 title 应存在`).toBeTruthy()
  return el!.textContent ?? ''
}

describe('内置文案定制（texts，i18n）', () => {
  it('缺省文案保持中文：聚合节点与徽标提示', () => {
    const { container, tree } = mount(fixture())
    const agg = container.querySelector(`g[data-id="__agg__a"] text.d3t-label`)
    expect(agg?.textContent).toBe('< 展开 (2)')
    expect(badgeTitle(container, 'a')).toBe('收起（含 7 个后代节点）')
    tree.toggle('a')
    expect(badgeTitle(container, 'a')).toBe('展开（含 7 个后代节点）')
  })

  it('aggregateLabel 覆盖聚合文案（方向箭头仍由内部追加）', () => {
    const texts: TreeTexts = { aggregateLabel: n => `Expand (${n})` }
    const { container } = mount(fixture(), { texts })
    expect(container.querySelector(`g[data-id="__agg__a"] text.d3t-label`)?.textContent).toBe(
      '< Expand (2)',
    )
  })

  it('badgeCollapseTitle / badgeExpandTitle 覆盖徽标悬停提示', () => {
    const texts: TreeTexts = {
      badgeCollapseTitle: n => `Collapse (${n})`,
      badgeExpandTitle: n => `Expand (${n})`,
    }
    const { container, tree } = mount(fixture(), { texts })
    expect(badgeTitle(container, 'a')).toBe('Collapse (7)')
    tree.toggle('a')
    expect(badgeTitle(container, 'a')).toBe('Expand (7)')
  })
})
