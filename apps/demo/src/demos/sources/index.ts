import type { DemoSources } from '../types'

import { horizontalSources } from './horizontal'
import { verticalSources } from './vertical'
import { aggregateSources } from './aggregate'
import { toggleSources } from './toggle'
import { toggleRegionSources } from './toggle-region'
import { addRemoveSources } from './add-remove'
import { lazyLoadSources } from './lazy-load'
import { searchLegendSources } from './search-legend'
import { nodeTemplateSources } from './node-template'
import { nodeRendererSources } from './node-renderer'
import { linkStyleSources } from './link-style'
import { themeTextsSources } from './theme-texts'
import { exportImageSources } from './export-image'

/**
 * 每个示例三种技术栈的完整可运行源码（源码面板展示/复制用）：
 * html 为整页文档、vue 为 SFC、react 为组件文件，均与左侧画布功能一一对应，
 * 粘贴到装好对应包的工程（@d3-tree/core / @d3-tree/vue / @d3-tree/react）即可复现。
 */
export const sources: Record<string, DemoSources> = {
  horizontal: horizontalSources,
  vertical: verticalSources,
  aggregate: aggregateSources,
  toggle: toggleSources,
  'toggle-region': toggleRegionSources,
  'add-remove': addRemoveSources,
  'lazy-load': lazyLoadSources,
  'search-legend': searchLegendSources,
  'node-template': nodeTemplateSources,
  'node-renderer': nodeRendererSources,
  'link-style': linkStyleSources,
  'theme-texts': themeTextsSources,
  'export-image': exportImageSources,
}
