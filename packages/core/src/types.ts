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
  /** 悬停 tooltip 展示的键值详情 */
  properties?: Record<string, string | number | boolean | null>
  children?: TreeNodeData[]
}

/** 文本度量器：返回节点总宽度（含内边距）。可注入以保证测试确定性 */
export type TextMeasurer = (text: string, variant: NodeVariant) => number

export type LinkStyle = 'orthogonal' | 'diagonal'

export interface TooltipOptions {
  /** 自定义 tooltip 内容（返回 HTML 字符串）；缺省渲染 properties 键值表 */
  formatter?: (node: TreeNodeData) => string
}

export interface TreeOptions {
  data: TreeNodeData
  /** 过渡动画时长（ms），默认 250（对齐官方 collapsible-tree） */
  duration?: number
  /** 同层兄弟纵向步距，默认 48 */
  rowHeight?: number
  /** 深度列之间的水平间距，默认 48 */
  columnGap?: number
  /** 每个父节点默认可见子节点数上限，超出聚合为“展开 (N)”；0 表示不聚合。默认 5 */
  visibleChildrenLimit?: number
  /** 连线样式：直角折线（默认）或贝塞尔对角线 */
  linkStyle?: LinkStyle
  /** 按 group 字段着色（内置调色板，配白色文字）；默认 false 保持参考稿白节点风格 */
  colorByGroup?: boolean
  /** 文本度量器注入（测试用）；缺省离屏 canvas measureText */
  measureText?: TextMeasurer
  /** 节点着色回调（非根节点），返回 CSS 颜色 */
  nodeColor?: (node: TreeNodeData) => string | undefined
  tooltip?: TooltipOptions
  /** 异步加载子节点回调（点击“展开 (N)”时触发） */
  loadChildren?: (parent: TreeNodeData) => Promise<TreeNodeData[]>
  onNodeClick?: (node: TreeNodeData) => void
  onNodeToggle?: (node: TreeNodeData, collapsed: boolean) => void
  /** 任何非聚合节点被点击时广播（含根节点）；供选取/编辑流程使用 */
  onNodeSelect?: (node: TreeNodeData) => void
  /** 点击节点本体是否触发折叠切换，默认 true；置 false 后点击仅触发回调（编辑选取模式） */
  toggleOnNodeClick?: boolean
  /** 分组集合变化时回调（初始渲染与 setData 后触发），供图例 UI 构建使用 */
  onGroupsChange?: (groups: Array<{ name: string; color: string }>) => void
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
  /** 移除 SVG 与全部监听 */
  destroy(): void
}
