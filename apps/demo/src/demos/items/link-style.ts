import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeNodeData, TreeInstance } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

const STYLES = ['orthogonal', 'straight', 'diagonal'] as const
const NAMES = { orthogonal: '直角折线', straight: '直线', diagonal: '贝塞尔曲线' } as const

export const linkStyle: DemoItem = {
  id: 'link-style',
  title: '连线样式与颜色',
  desc: 'linkStyle 切换折线/直线/贝塞尔；linkColor 传回调按目标节点分组着色（未分组回退默认灰）；更彻底的自定义可用 linkPathGenerator 直接接管 path d。',
  setup({ canvas, overlay, setHint }) {
    let styleIdx = 0
    const groupColors = new Map<string, string>()
    const options = {
      data: industryData,
      linkStyle: STYLES[0],
      linkColor: (l: { target: { data: TreeNodeData } }): string =>
        groupColors.get(l.target.data.group ?? '') ?? '#C0C4CC',
      onGroupsChange: (groups: Array<{ name: string; color: string }>): void => {
        for (const { name, color } of groups) groupColors.set(name, color)
      },
    }
    let tree: TreeInstance = createBidirectionalTree(canvas, options)
    tree.zoomToFit()

    const btn = document.createElement('button')
    const apply = (): void => {
      tree.destroy()
      tree = createBidirectionalTree(canvas, options)
      tree.zoomToFit()
      setHint(`当前连线：${NAMES[STYLES[styleIdx]]}（颜色随分组）`)
    }
    btn.textContent = `连线：${NAMES[STYLES[0]]}`
    btn.onclick = () => {
      styleIdx = (styleIdx + 1) % STYLES.length
      options.linkStyle = STYLES[styleIdx]
      btn.textContent = `连线：${NAMES[STYLES[styleIdx]]}`
      apply()
    }
    overlay.appendChild(btn)
    return () => tree.destroy()
  },
}
