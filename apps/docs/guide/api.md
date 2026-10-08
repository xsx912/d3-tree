# API 参考

## createBidirectionalTree

```ts
function createBidirectionalTree(container: HTMLElement, options: TreeOptions): TreeInstance
```

容器需有确定宽高（如通过 CSS 设定）。

## 配置项 TreeOptions

| 选项 | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `data` | `TreeNodeData`（必填） | 层级数据，见[数据模型](/guide/install#数据模型) |
| `duration` | `number` / `250` | 过渡动画时长（ms），`0` 关闭动画 |
| `fadeOpacity` | `number` / `1` | 展开/收起的淡入淡出透明度（0~1，超出钳制）：展开时新节点与连线从该值淡入至 1，收起时淡出至该值后移除；`1` 即纯位移动画 |
| `rowHeight` | `number` / `48` | 兄弟轴步距（垂直模式下语义为兄弟水平间距） |
| `columnGap` | `number` / `48` | 深度轴列/行间距 |
| `visibleChildrenLimit` | `number` / `5` | 每父节点可见子节点上限，超出聚合「展开 (N)」；`0` 不聚合 |
| `orientation` | `'horizontal' \| 'vertical'` / `'horizontal'` | 布局方向：左右分侧 / 上下分侧 |
| `linkStyle` | `'orthogonal' \| 'diagonal' \| 'straight'` / `'orthogonal'` | 连线：直角折线 / 贝塞尔 / 直线 |
| `linkColor` | `string \| (link) => string` / `'#C0C4CC'` | 连线颜色，回调见 [LinkRenderContext](#linkrendercontext) |
| `linkWidth` | `number` / `1` | 连线宽度（px） |
| `linkPathGenerator` | `(link) => string` | 完全自定义连线 path d，优先于 linkStyle |
| `colorByGroup` | `boolean` / `false` | 按 group 调色板着色（白字） |
| `nodeColor` | `(node) => string` | 自定义节点填充，优先于分组色 |
| `nodeSize` | `(data, variant) => { width, height }` | 节点几何完全接管 |
| `nodeRenderer` | `(ctx) => void` | SVG 自定义节点渲染（导出无损） |
| `nodeTemplate` | `(data, variant) => string \| HTMLElement` | HTML 模板渲染进 foreignObject |
| `tooltip.formatter` | `(node) => string` | tooltip HTML（默认名称 + properties 键值表，自动转义） |
| `loadChildren` | `(parent) => Promise<TreeNodeData[]>` | 点击「展开 (N)」时异步拉取并入数据 |
| `toggleOnNodeClick` | `boolean` / `true` | `false` 时点击节点仅触发回调（编辑选取模式） |
| `measureText` | `(text, variant) => number` | 文本度量注入（测试确定性） |
| `onNodeClick` / `onNodeToggle` / `onNodeSelect` | 回调 | 节点点击 / 折叠切换 / 选取广播 |
| `onGroupsChange` | `(groups: { name, color }[]) => void` | 分组集合变化（先于首帧触发） |

## 实例方法 TreeInstance

| 方法 | 说明 |
| --- | --- |
| `setData(data)` | 整体替换数据并过渡 |
| `toggle(id)` | 切换折叠态（根不可折叠） |
| `expandAll()` / `collapseAll()` | 全展开（含释放聚合）/ 收起至一级板块 |
| `addChild(parentId, node, side?)` | 追加子节点；父为根时可指定分侧；折叠父自动展开 |
| `removeChild(id)` | 删除节点及子树（根不可删） |
| `search(kw)` / `clearSearch()` | 命中 + 祖先链高亮、定位首个命中；返回命中数；无命中不清除现有高亮 |
| `setVisibleGroups(groups \| null)` | 分组过滤（连同子树） |
| `zoomToFit()` | 适配视口（只缩小不放大，40px 边距） |
| `exportImage({ format, scale, filename })` | 导出 SVG / PNG（默认 png、2x） |
| `destroy()` | 移除 SVG、tooltip、样式、监听与 ResizeObserver |

## NodeRenderContext

`nodeRenderer` 收到的上下文（`group` 已定位在节点中心，向其 append 任意 SVG 内容）：

```ts
interface NodeRenderContext {
  group: SVGGElement
  data: TreeNodeData
  variant: 'root' | 'node' | 'aggregate'
  side: 'left' | 'right' | 'center'
  depth: number
  width: number
  height: number
}
```

## LinkRenderContext

`linkColor` 与 `linkPathGenerator` 收到的上下文：

```ts
interface LinkRenderContext {
  source: LinkEndpoint  // 父节点
  target: LinkEndpoint  // 子节点
}
interface LinkEndpoint {
  data: TreeNodeData
  variant: 'root' | 'node' | 'aggregate'
  side: 'left' | 'right' | 'center'
  depth: number
  x: number; y: number      // 中心点坐标（方向感知）
  width: number; height: number
}
```

## 渲染类名（CSS 定制）

`d3t-node--root|node|aggregate`、`d3t-side--left|right|center`、`d3t-group--<group>`、`d3t-label`、`d3t-link`、`d3t-badge`、`d3t-hit`、`d3t-hit-ancestor`、`d3t-dimmed`、`d3t-loading`。SVG 内联属性优先级低于 CSS，可直接以规则覆盖颜色/线型。
