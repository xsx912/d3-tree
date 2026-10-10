import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeNodeData, TreeInstance } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const searchLegend: DemoItem = {
  id: 'search-legend',
  title: '搜索与图例过滤',
  desc: 'search(keyword) 高亮命中及其祖先链、其余淡化并定位首个命中；setVisibleGroups(groups) 按分组过滤（连同子树）。onGroupsChange 先于首帧提供分组与调色板颜色，可用来构建图例与连线着色。',
  setup({ canvas, overlay, setHint }) {
    const groupColors = new Map<string, string>()
    const activeGroups = new Set<string>()

    // 图例：分组色 chips（先构建 DOM 再由 onGroupsChange 填充）
    const legend = document.createElement('div')
    legend.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;'
    const renderLegend = (groups: Array<{ name: string; color: string }>): void => {
      legend.innerHTML = ''
      for (const { name, color } of groups) {
        activeGroups.add(name)
        const chip = document.createElement('span')
        chip.className = 'chip'
        chip.innerHTML = `<span class="dot" style="background:${color}"></span>${name}`
        chip.onclick = () => {
          if (activeGroups.has(name)) activeGroups.delete(name)
          else activeGroups.add(name)
          chip.classList.toggle('off', !activeGroups.has(name))
          tree.setVisibleGroups(activeGroups.size ? [...activeGroups] : null)
        }
        legend.appendChild(chip)
      }
    }

    const search = document.createElement('input')
    search.placeholder = '搜索节点…'
    search.addEventListener('input', () => {
      const kw = search.value.trim()
      if (!kw) {
        tree.clearSearch()
        setHint('')
        return
      }
      const hits = tree.search(kw)
      setHint(hits > 0 ? `「${kw}」命中 ${hits} 个节点` : `「${kw}」无命中`)
    })

    const options = {
      data: industryData,
      colorByGroup: true,
      // 连线按目标节点分组着色，未分组回退默认灰（回调在渲染期惰性读表）
      linkColor: (l: { target: { data: TreeNodeData } }): string =>
        groupColors.get(l.target.data.group ?? '') ?? '#C0C4CC',
      onGroupsChange: (groups: Array<{ name: string; color: string }>): void => {
        for (const { name, color } of groups) groupColors.set(name, color)
        renderLegend(groups)
      },
    }
    // 必须先装配回调再创建实例：onGroupsChange 先于首帧触发
    const tree: TreeInstance = createBidirectionalTree(canvas, options)
    tree.zoomToFit()

    overlay.append(search, legend)
    return () => tree.destroy()
  },
}
