import type { Theme } from './theme'

/** 节点在双向树中的分侧；根节点为 center */
export type Side = 'left' | 'right'

/** 渲染变体：根节点 / 普通节点 / “展开 (N)”聚合虚拟节点 */
export type NodeVariant = 'root' | 'node' | 'aggregate'

/** 层级数据节点 */
export interface TreeNodeData {
  id: string
  name: string
  /** 分组（着色与图例筛选用） */
  group?: string
  /** 仅对根的直接子节点生效：指定分侧；缺省按数量均分 */
  side?: Side
  /** 初始折叠态 */
  collapsed?: boolean
  /**
   * 标记"存在未加载的下一级"：本地 children 为空时节点仍展示 + 徽标（可展开）；
   * 配置 loadChildren 后点击展开会触发异步拉取，成功后按普通子节点处理，
   * 返回空数组则视为末级叶子并清除该标记
   */
  hasChildren?: boolean
  /** 悬停 tooltip 展示的键值详情 */
  properties?: Record<string, string | number | boolean | null>
  children?: TreeNodeData[]
}

/** 文本度量器：返回节点总宽度（含内边距）。可注入以保证测试确定性 */
export type TextMeasurer = (text: string, variant: NodeVariant) => number

export type LinkStyle = 'orthogonal' | 'diagonal' | 'straight'

/** 连线端点（源/目标节点）的公开几何与数据信息 */
export interface LinkEndpoint {
  data: TreeNodeData
  variant: NodeVariant
  side: Side | 'center'
  depth: number
  x: number
  y: number
  width: number
  height: number
}

/** 连线上下文：source 为父节点，target 为子节点 */
export interface LinkRenderContext {
  source: LinkEndpoint
  target: LinkEndpoint
}

/** 连线颜色：CSS 颜色串，或按连线两端信息返回颜色 */
export type LinkColor = string | ((link: LinkRenderContext) => string)

/** 布局方向：水平（左右分侧，默认）或垂直（上下分侧） */
export type Orientation = 'horizontal' | 'vertical'

/** 节点几何函数：返回节点宽高（坐标系以节点中心为原点） */
export type NodeSizeFn = (
  data: TreeNodeData,
  variant: NodeVariant,
) => { width: number; height: number }

/** 自定义节点渲染上下文：group 已定位在节点中心，向其 append 任意 SVG 内容 */
export interface NodeRenderContext {
  group: SVGGElement
  data: TreeNodeData
  variant: NodeVariant
  side: Side | 'center'
  depth: number
  width: number
  height: number
}

/** SVG 自定义渲染器（优先于 nodeTemplate 与默认渲染；导出 PNG/SVG 无损） */
export type NodeRenderer = (context: NodeRenderContext) => void

/** HTML 模板：返回 HTML 字符串或元素，渲染进节点 foreignObject（导出 PNG 需内联样式） */
export type NodeTemplate = (data: TreeNodeData, variant: NodeVariant) => string | HTMLElement

export interface TooltipOptions {
  /** 自定义 tooltip 内容（返回 HTML 字符串）；缺省渲染 properties 键值表 */
  formatter?: (node: TreeNodeData) => string
}

/** 内置文案定制（缺省中文）：聚合节点与徽标悬停提示，供国际化替换 */
export interface TreeTexts {
  /**
   * “展开 (N)”聚合节点的基础文案（返回不含方向箭头的文本，如 `Expand (3)`）；
   * 方向箭头（`<` `>` `↑` `↓`）由内部按分侧与布局方向追加
   */
  aggregateLabel?: (remaining: number) => string
  /** 徽标悬停提示：节点处于收起态（参数为后代节点总数） */
  badgeExpandTitle?: (descendantCount: number) => string
  /** 徽标悬停提示：节点处于展开态 */
  badgeCollapseTitle?: (descendantCount: number) => string
  /** 徽标悬停提示：节点标记 hasChildren 且下一级尚未加载 */
  badgeLazyExpandTitle?: () => string
}

export interface TreeOptions {
  data: TreeNodeData
  /** 过渡动画时长（ms），默认 250（对齐官方 collapsible-tree） */
  duration?: number
  /**
   * 展开/收起的淡入淡出透明度（0~1，超出钳制）：展开时新节点与连线从该透明度淡入至 1，
   * 收起时淡出至该透明度后移除。默认 1 即纯位移动画（不引入 opacity 属性）。
   */
  fadeOpacity?: number
  /** 同层兄弟纵向步距，默认 48 */
  rowHeight?: number
  /** 深度列之间的水平间距，默认 48 */
  columnGap?: number
  /** 每个父节点默认可见子节点数上限，超出聚合为“展开 (N)”；0 表示不聚合。默认 5 */
  visibleChildrenLimit?: number
  /** 连线样式：直角折线（默认）、贝塞尔对角线或直线 */
  linkStyle?: LinkStyle
  /** 连线颜色：CSS 颜色串或按连线两端信息返回（缺省 #C0C4CC） */
  linkColor?: LinkColor
  /** 连线宽度（px），缺省 1 */
  linkWidth?: number
  /** 完全自定义连线路径：返回 SVG path 的 d，优先于 linkStyle（自定义路径不做形变插值） */
  linkPathGenerator?: (link: LinkRenderContext) => string
  /** 布局方向：水平左右分侧（默认）或垂直上下分侧；垂直模式下 rowHeight/columnGap 语义对调（兄弟间距/深度行距） */
  orientation?: Orientation
  /** 按 group 字段着色（内置调色板，配白色文字）；默认 false 保持参考稿白节点风格 */
  colorByGroup?: boolean
  /** 节点几何：宽高完全自定义；缺省按内置文字度量（变宽）+ 34/44 高 */
  nodeSize?: NodeSizeFn
  /** 完全自定义节点渲染（SVG）；提供后替代默认圆角矩形+文字 */
  nodeRenderer?: NodeRenderer
  /** HTML 模板渲染进 foreignObject；nodeRenderer 优先于它 */
  nodeTemplate?: NodeTemplate
  /** 文本度量器注入（测试用）；缺省离屏 canvas measureText */
  measureText?: TextMeasurer
  /** 节点着色回调（非根节点），返回 CSS 颜色 */
  nodeColor?: (node: TreeNodeData) => string | undefined
  tooltip?: TooltipOptions
  /**
   * 异步加载子节点回调。两个触发时机：
   * ① 点击"展开 (N)"聚合节点（返回批次并入后全部释放）；
   * ② 展开带 hasChildren 标记（本地无 children）的节点（点击展开/收起时，
   *    本地已有下一级则不请求，直接本地切换）。
   */
  loadChildren?: (parent: TreeNodeData) => Promise<TreeNodeData[]>
  /** loadChildren 拉取失败时回调（错误对象 + 触发的父节点）；缺省仅静默复位 loading 态 */
  onLoadError?: (error: unknown, parent: TreeNodeData) => void
  /** 主题定制：浅合并到内置主题，可覆盖背景、节点色、连线色等任意字段 */
  theme?: Partial<Theme>
  /** 内置文案定制（聚合节点/徽标提示），用于国际化；缺省中文 */
  texts?: TreeTexts
  onNodeClick?: (node: TreeNodeData) => void
  onNodeToggle?: (node: TreeNodeData, collapsed: boolean) => void
  /** 任何非聚合节点被点击时广播（含根节点）；供选取/编辑流程使用 */
  onNodeSelect?: (node: TreeNodeData) => void
  /** 点击节点本体是否触发折叠切换，默认 true；置 false 后点击仅触发回调（编辑选取模式） */
  toggleOnNodeClick?: boolean
  /** 分组集合变化时回调（初始渲染与 setData 后触发），供图例 UI 构建使用 */
  onGroupsChange?: (groups: Array<{ name: string; color: string }>) => void
}

/** 导出选项 */
export interface ExportImageOptions {
  format?: 'svg' | 'png'
  /** PNG 放大倍数，默认 2 */
  scale?: number
  /** 文件名（不含扩展名），默认 "bidirectional-tree" */
  filename?: string
}

/** createBidirectionalTree 返回的图表实例（命令式 API） */
export interface TreeInstance {
  /** 整体替换数据并过渡到新布局 */
  setData(data: TreeNodeData): void
  /** 切换指定节点的折叠态（根节点不可折叠） */
  toggle(id: string): void
  /** 展开全部节点（含释放全部“展开 (N)”聚合） */
  expandAll(): void
  /** 收起全部可折叠节点（根不可折叠，根与一级板块保留可见） */
  collapseAll(): void
  /**
   * 追加子节点。parent 为根节点时可用 side 指定分侧（缺省自动均分侧）；
   * 父节点处于折叠态会自动展开。返回是否成功。
   */
  addChild(parentId: string, node: TreeNodeData, side?: Side): boolean
  /** 删除指定节点及其子树（根节点不可删除）。返回是否成功。 */
  removeChild(id: string): boolean
  /** 缩放平移使当前可见内容完整落入视口（含边距，只缩小不放大） */
  zoomToFit(): void
  /**
   * 按分组过滤可见节点：仅保留命中分组（含其整棵子树）与未分组节点。
   * 传 null 恢复全部。
   */
  setVisibleGroups(groups: string[] | null): void
  /**
   * 搜索关键词（匹配节点名称与 properties 字符串值，不区分大小写）：
   * 命中节点及其全部祖先链高亮、其余节点淡化，视口定位到首个命中
   * （命中路径上的折叠与聚合会自动展开）。返回命中数量；无命中不改现有高亮。
   */
  search(keyword: string): number
  /** 清除搜索高亮并还原淡化 */
  clearSearch(): void
  /** 导出当前可见图谱为 SVG 或 PNG 文件 */
  exportImage(options?: ExportImageOptions): Promise<void>
  /** 移除 SVG 与全部监听 */
  destroy(): void
}
