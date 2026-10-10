import type { DemoCategory, DemoItem } from './types'

import { horizontal } from './items/horizontal'
import { vertical } from './items/vertical'
import { aggregate } from './items/aggregate'
import { toggle } from './items/toggle'
import { toggleRegion } from './items/toggle-region'
import { addRemove } from './items/add-remove'
import { lazyLoad } from './items/lazy-load'
import { searchLegend } from './items/search-legend'
import { nodeTemplate } from './items/node-template'
import { nodeRenderer } from './items/node-renderer'
import { linkStyle } from './items/link-style'
import { themeTexts } from './items/theme-texts'
import { exportImage } from './items/export-image'

export const categories: DemoCategory[] = [
  {
    label: '基础布局',
    entries: [horizontal, vertical, aggregate],
  },
  {
    label: '折叠交互',
    entries: [toggle, toggleRegion],
  },
  {
    label: '数据操作',
    entries: [addRemove, lazyLoad],
  },
  {
    label: '查找与过滤',
    entries: [searchLegend],
  },
  {
    label: '自定义渲染',
    entries: [nodeTemplate, nodeRenderer, linkStyle, themeTexts],
  },
  {
    label: '导出',
    entries: [exportImage],
  },
]

export const allItems: DemoItem[] = categories.flatMap(c => c.entries)
