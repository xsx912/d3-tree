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
| `duration` | `number` / `250` | 过渡动画时长（ms），`0` 关闭动画。展开/收起的位移过渡自被操作父节点「朝子节点一侧」的边缘中点出发并收拢回该点（初始全量生长自根节点中心） |
| `fadeOpacity` | `number` / `0.25` | 展开/收起的淡入淡出透明度（0~1，超出钳制）：展开时新节点与连线从该值淡入至 1，收起时淡出至该值后移除；传 `1` 关闭淡入淡出（纯位移动画） |
| `rowHeight` | `number` / `48` | 兄弟轴步距（垂直模式下语义为兄弟水平间距） |
| `columnGap` | `number` / `48` | 深度轴列/行间距 |
| `visibleChildrenLimit` | `number` / `5` | 每父节点可见子节点上限，超出聚合「展开 (N)」；`0` 不聚合 |
| `orientation` | `'horizontal' \| 'vertical'` / `'horizontal'` | 布局方向：左右分侧 / 上下分侧 |
| `linkStyle` | `'orthogonal' \| 'diagonal' \| 'straight'` / `'orthogonal'` | 连线：直角折线 / 贝塞尔 / 直线 |
| `linkColor` | `string \| (link) => string` / `'#C0C4CC'` | 连线颜色，回调见 [LinkRenderContext](#linkrendercontext) |
| `linkWidth` | `number` / `1` | 连线宽度（px） |
| `linkPathGenerator` | `(link) => string` | 完全自定义连线 path d，优先于 linkStyle |
| `colorByGroup` | `boolean` / `false` | 按 group 调色板着色；十六进制背景自动选择高对比黑/白字 |
| `nodeColor` | `(node) => string` | 自定义节点填充，优先于分组色 |
| `nodeSize` | `(data, variant) => { width, height }` | 节点几何完全接管 |
| `nodeRenderer` | `(ctx) => void \| (() => void)` | SVG 自定义内容重绘；可返回刷新/退出/销毁清理函数（导出无损） |
| `nodeTemplate` | `(data, variant) => string \| HTMLElement` | HTML 模板渲染进 foreignObject |
| `tooltip.formatter` | `(node, ctx) => string \| HTMLElement` | 悬浮框内容：HTML 字符串或 DOM 元素（可承载组件宿主）；默认名称 + properties 键值表（自动转义）；ctx 见 [TooltipContext](#tooltipcontext)。悬浮框**锚定节点**（外侧、边缘翻转、随缩放平移跟随），不随光标移动；内容替换或尺寸变化（异步数据、字体/图片加载）自动重算位置；内容**可交互**：移入弹窗不隐藏（可点击按钮/链接），移出节点或弹窗后约 150ms 防抖隐藏 |
| `tooltip.className` | `string` | 追加到悬浮层的 class（内置外壳保留，覆盖内联样式需 `!important`） |
| `tooltip.showDelay` | `number` / `0` | 移入节点后的显示延时（毫秒）：悬停停留才出现（扫过节点不弹窗），期间移出取消、换节点重启计时；`0` 即刻显示 |
| `tooltip.hideDelay` | `number` / `150` | 移出节点/弹窗后的防抖隐藏延时（毫秒）：期间移入弹窗取消隐藏；`0` 移出即藏（仍走淡出） |
| `tooltip.fadeDuration` | `number` / `150` | 显示/隐藏淡入淡出时长（毫秒，`0` 关闭过渡）；"减少动态效果"偏好下未显式配置时为 0；淡出完成才隐藏并触发 `onTooltipHide` |
| `tooltip.onTooltipHide` | `() => void` | 悬浮层隐藏时回调（移出/重渲染；destroy 不触发）——封装层用它实现关闭实例缓存后移出即卸载 |
| `loadChildren` | `(parent) => Promise<TreeNodeData[]>` | 异步拉取并入数据；触发：点击「展开 (N)」聚合，或展开 `hasChildren` 标记节点（本地已有下一级则不请求） |
| `onLoadError` | `(error, parent) => void` | loadChildren 拉取失败回调；缺省仅静默复位 loading 态 |
| `theme` | `Partial<Theme>` | 主题定制：浅合并到内置主题（背景/节点色/连线色/徽标/调色板等任意字段） |
| `texts` | `TreeTexts` | 内置文案定制（聚合节点/徽标提示），用于国际化；缺省中文，见 [TreeTexts](#treetexts) |
| `toggleOnNodeClick` | `boolean` / `true` | `false` 时点击节点仅触发回调（编辑选取模式）；内置徽标、聚合节点与 `data-d3t-toggle` 标记区域仍可折叠，见[自定义折叠触发区域](#自定义折叠触发区域data-d3t-toggle) |
| `measureText` | `(text, variant) => number` | 文本度量注入（测试确定性） |
| `onNodeClick` / `onNodeToggle` / `onNodeSelect` | 回调 | 节点点击 / 折叠切换 / 选取广播 |
| `onNodeHover` / `onNodeHoverEnd` | 回调 | 悬停事件缝（**自接管悬浮框**）：配置 `onNodeHover` 即停用内置悬浮框（外壳/锚定/防抖/淡入淡出），悬停/移出由回调通知，渲染定位全归调用端；事件忠实转发浏览器序列（移出立即触发、直切时先收前节点 end 再收新 hover）、重渲染时触发 end、destroy 不触发；`onNodeHoverEnd` 需与 `onNodeHover` 成对配置。ctx 见 [TooltipContext](#tooltipcontext)（`element` 可直接 anchor 给 floating-ui / radix）；聚合节点照发（`aggregate` 区分）。详见[悬浮框自定义](/guide/custom-tooltip) |
| `onGroupsChange` | `(groups: { name, color }[]) => void` | 分组集合变化（先于首帧触发） |

## 实例方法 TreeInstance

| 方法 | 说明 |
| --- | --- |
| `setData(data)` | 整体替换数据并过渡；每次调用使旧请求失效，清搜索和 loading、重置折叠/释放/分组过滤，保留缩放 |
| `toggle(id)` | 切换折叠态（根不可折叠） |
| `expandAll()` / `collapseAll()` | 全展开（含释放聚合）/ 收起至一级板块 |
| `addChild(parentId, node, side?)` | 追加子节点；父为根时可指定分侧；折叠父自动展开 |
| `removeChild(id)` | 删除节点及子树（根不可删） |
| `search(kw)` / `clearSearch()` | 命中 + 祖先链高亮、定位首个命中；返回命中数；无命中不清除现有高亮 |
| `setVisibleGroups(groups \| null)` | 分组过滤（连同子树） |
| `zoomToFit()` | 适配视口（只缩小不放大，40px 边距） |
| `exportImage({ format, scale, filename })` | 导出 SVG / PNG（默认 png、2x） |
| `destroy()` | 移除 SVG、tooltip、样式、监听与 ResizeObserver |

## TreeTexts

内置文案（缺省中文）的国际化出口：

```ts
interface TreeTexts {
  // “展开 (N)”基础文案；方向箭头（< > ↑ ↓）由内部按分侧与布局方向追加
  aggregateLabel?: (remaining: number) => string
  badgeExpandTitle?: (descendantCount: number) => string  // 徽标悬停提示：收起态
  badgeCollapseTitle?: (descendantCount: number) => string // 徽标悬停提示：展开态
  badgeLazyExpandTitle?: () => string  // 徽标悬停提示：hasChildren 未加载
}

// 英文示例
createBidirectionalTree(el, {
  data,
  texts: {
    aggregateLabel: n => `Expand (${n})`,
    badgeExpandTitle: n => `Expand (${n} descendants)`,
    badgeCollapseTitle: n => `Collapse (${n} descendants)`,
  },
})
```

## 可访问性

- 节点组带 `role="treeitem"`（聚合节点为 `role="button"`）、`aria-label`（节点名）与 `tabindex="0"`，支持 <kbd>Enter</kbd> / <kbd>Space</kbd> 激活（点击语义相同：折叠切换 / 释放聚合 / 触发回调）。
- 含子节点的节点带 `aria-expanded`，随折叠态刷新；+/− 徽标 `aria-hidden="true"`，避免 Tab 序列重复停留。
- 系统「减少动态效果」（`prefers-reduced-motion: reduce`）开启且未显式配置 `duration` 时，动画自动关闭。
- 键盘焦点描边与搜索命中共用 `theme.hitStroke`，可通过主题覆盖。

## NodeRenderContext

`nodeRenderer` 收到的上下文（`group` 是节点中心的独立内容子组，向其 append 任意 SVG 内容）：

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

## 自定义折叠触发区域（data-d3t-toggle）

默认点击节点本体即折叠/展开。自定义节点（`nodeTemplate` / `nodeRenderer`）时，若希望
**由调用端决定哪块区域触发折叠**：在节点内容中给目标元素标记 `data-d3t-toggle` 属性即可，
点击该元素切换所属节点的折叠态。语义与内置 +/− 徽标一致：

- 阻断冒泡——不会同时触发 `onNodeClick` / `onNodeSelect`；
- 不受 `toggleOnNodeClick` 约束——配合 `toggleOnNodeClick: false` 即可实现
  "点击节点本体只回调、仅指定区域可折叠"；
- HTML 模板字符串与 SVG 渲染器绘制的元素均支持。

```html
<!-- nodeTemplate 示例：只有右侧"展/收"胶囊可折叠 -->
<div style="display:flex;align-items:center;">
  <span>${data.name}</span>
  <span data-d3t-toggle style="cursor:pointer;">展/收</span>
</div>
```

```ts
// nodeRenderer 示例：给 SVG 子元素加同名属性
const btn = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
btn.setAttribute('data-d3t-toggle', '')
ctx.group.appendChild(btn)
```

自定义节点内容在每次数据/布局重绘时刷新；回调 group 只拥有内容子组。内置 +/− 徽标始终由图表管理，不会因内容刷新被删除。管理框架内容时可由 nodeRenderer 返回卸载清理函数。

## TooltipContext

`tooltip.formatter` 与 `onNodeHover` 收到的第二个参数（节点在当前视图中的位置与状态）：

```ts
interface TooltipContext {
  depth: number                     // 深度（根为 0）
  side: 'left' | 'right' | 'center'
  collapsed: boolean                // 本地子级已折叠不显示
  element: SVGGElement              // 节点 g 元素引用（rect 实时可取，可 anchor 给弹窗库）
  aggregate: boolean                // 是否「展开 (N)」聚合节点（内置悬浮框不显示；自接管照发）
}
```

字符串模式按 HTML 解析（转义由调用端负责）；返回元素则原样挂入悬浮层，可承载组件宿主。详见[悬浮框自定义](/guide/custom-tooltip)。

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

`d3t-node--root|node|aggregate`、`d3t-side--left|right|center`、`d3t-group--<group>`、`d3t-label`、`d3t-link`、`d3t-badge`、`d3t-hit`、`d3t-hit-ancestor`、`d3t-dimmed`、`d3t-loading`、`d3t-tooltip`（悬浮层基类）。SVG 内联属性优先级低于 CSS，可直接以规则覆盖颜色/线型。

分组类名保留 `[a-zA-Z0-9_-]`，其他连续字符变为 `-`；发生替换时追加原字符串的 base36 哈希。例如 `产业` 对应 `d3t-group----3w9nq`，实际值可从节点 DOM 查看。

## 基础无障碍与销毁

节点由 `role="tree"` 拥有，平铺结构显式提供 `aria-level`、`aria-posinset`、`aria-setsize`；聚合操作也为 treeitem，支持 Enter/Space 激活。此为基础支持，不承诺完整树键盘导航或屏幕阅读器符合性。加载脉冲遵循 `prefers-reduced-motion`，默认调色板自动选择高对比文字。

destroy 幂等，恢复由库改变的容器 position（保留调用端后续改动）。销毁后命令无副作用：search 返回 0，增删返回 false，exportImage 拒绝并报告已销毁；已开始的 PNG 导出可完成转换与 URL 清理，但不再触发下载。

数据输入须为无环树且真实节点 ID 全局唯一。formatter/nodeTemplate 的 HTML 字符串由调用端负责转义；默认悬浮框内容已转义。
