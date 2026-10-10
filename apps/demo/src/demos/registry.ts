import type { DemoCategory, DemoEntry } from './types'

import { horizontal } from './items/horizontal'
import horizontalSrc from './items/horizontal.ts?raw'
import { vertical } from './items/vertical'
import verticalSrc from './items/vertical.ts?raw'
import { aggregate } from './items/aggregate'
import aggregateSrc from './items/aggregate.ts?raw'
import { toggle } from './items/toggle'
import toggleSrc from './items/toggle.ts?raw'
import { toggleRegion } from './items/toggle-region'
import toggleRegionSrc from './items/toggle-region.ts?raw'
import { addRemove } from './items/add-remove'
import addRemoveSrc from './items/add-remove.ts?raw'
import { lazyLoad } from './items/lazy-load'
import lazyLoadSrc from './items/lazy-load.ts?raw'
import { searchLegend } from './items/search-legend'
import searchLegendSrc from './items/search-legend.ts?raw'
import { nodeTemplate } from './items/node-template'
import nodeTemplateSrc from './items/node-template.ts?raw'
import { nodeRenderer } from './items/node-renderer'
import nodeRendererSrc from './items/node-renderer.ts?raw'
import { linkStyle } from './items/link-style'
import linkStyleSrc from './items/link-style.ts?raw'
import { themeTexts } from './items/theme-texts'
import themeTextsSrc from './items/theme-texts.ts?raw'
import { exportImage } from './items/export-image'
import exportImageSrc from './items/export-image.ts?raw'

/** 展示的源码 = 实际执行的代码（同一文件 ?raw 导入），不会漂移 */
const entry = (item: DemoEntry['item'], source: string): DemoEntry => ({ item, source })

export const categories: DemoCategory[] = [
  {
    label: '基础布局',
    entries: [
      entry(horizontal, horizontalSrc),
      entry(vertical, verticalSrc),
      entry(aggregate, aggregateSrc),
    ],
  },
  {
    label: '折叠交互',
    entries: [entry(toggle, toggleSrc), entry(toggleRegion, toggleRegionSrc)],
  },
  {
    label: '数据操作',
    entries: [entry(addRemove, addRemoveSrc), entry(lazyLoad, lazyLoadSrc)],
  },
  {
    label: '查找与过滤',
    entries: [entry(searchLegend, searchLegendSrc)],
  },
  {
    label: '自定义渲染',
    entries: [
      entry(nodeTemplate, nodeTemplateSrc),
      entry(nodeRenderer, nodeRendererSrc),
      entry(linkStyle, linkStyleSrc),
      entry(themeTexts, themeTextsSrc),
    ],
  },
  {
    label: '导出',
    entries: [entry(exportImage, exportImageSrc)],
  },
]

export const allEntries: DemoEntry[] = categories.flatMap(c => c.entries)
