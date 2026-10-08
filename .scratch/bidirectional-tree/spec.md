# Spec: 双向树图谱（产业链图谱）bidirectional-tree

Status: ready-for-agent

## Problem Statement

需要一个像 d3.js 本身一样框架无关的横向**双向树图谱**组件：根节点居中、子树向左右两侧展开，用于呈现企业产业链这类"中心实体 + 双侧分类下钻"的层级数据。现有方案要么与具体框架绑定（Vue/React 组件库），要么不支持可变宽度节点、按列对齐、懒加载聚合（"展开 (N)"）、搜索定位、图谱导出等图谱场景刚需。使用者需要在原生 JS、Vue 3、React 中以一致的 API 使用同一套渲染核心。

## Solution

提供三个包：

- **@d3-tree/core**：零框架依赖的 TypeScript 库（基于 d3 v7）。入口为工厂函数 `createBidirectionalTree(container, options)`，返回带命令式方法的图表实例（setData / addChild / removeChild / toggle / collapseAll / expandAll / search / clearSearch / setVisibleGroups / exportImage / zoomToFit / destroy）。
- **@d3-tree/vue**：Vue 3 组件 `<BidirectionalTree>`，props 映射 options、ref 暴露命令方法。
- **@d3-tree/react**：React 18 组件 `<BidirectionalTree>`，forwardRef 暴露同样的命令方法。

另附 Vite 多页 demo（vanilla / vue / react 三入口）与产业链风格中文示例数据。

视觉基线：白底画布；根节点蓝底白字加大（#1E6EFF 系）；普通节点白底、1px 浅灰描边、小圆角、宽度随文字自适应；连线为 1px 浅灰直角折线；节点外侧 +/− 圆形徽标；"展开 (N)" 聚合节点分批懒展开。交互基线：折叠/展开对齐 d3 官方 collapsible-tree（children/_children 置换，250ms 过渡，新节点自被点击节点旧位置长出、收起回拢至父节点新位置）。

## User Stories

1. 作为图谱观看者，我希望根节点居中、子树向左右两侧横向展开，以便一眼区分中心实体与两侧分类维度。
2. 作为图谱观看者，我希望根节点为蓝底白字加大样式、普通节点为白底灰边圆角矩形，以便视觉上立刻区分根与分支。
3. 作为图谱观看者，我希望连线为浅灰直角折线（父边→公共竖线→子边），以便清晰追踪父子归属。
4. 作为图谱观看者，我希望节点宽度随文字长度自适应，以便长名称完整显示、不被截断或换行。
5. 作为图谱观看者，我希望同一深度的子节点按列严格对齐，以便横向比较同层内容。
6. 作为图谱观看者，我希望点击节点本体或其 +/− 徽标即可折叠/展开子树，以便聚焦关心的分支。
7. 作为图谱观看者，我希望展开/收起有 250ms 平滑过渡（新节点从被点击节点处长出、收起时回拢到父节点），以便追踪结构变化。
8. 作为图谱观看者，我希望可展开节点的外侧（左半区在左、右半区在右）显示圆形 +/− 徽标，以便操作位置符合直觉。
9. 作为图谱观看者，我希望徽标悬停可见被收起的后代数量提示，以便预知展开规模。
10. 作为图谱观看者，我希望某节点的子节点数超过显示上限时出现"展开 (N)"聚合节点，点击后分批释放后续子节点，以便大数据量下渐进浏览。
11. 作为图谱观看者，我希望滚轮缩放画布，以便在总体与细节间切换。
12. 作为图谱观看者，我希望拖拽平移画布，以便浏览超出视口的区域。
13. 作为图谱观看者，我希望一键"适配视窗"（zoomToFit），以便任何时候都能把整棵树收进视野。
14. 作为图谱观看者，我希望悬停节点显示 tooltip 详情（properties 键值），以便不展开也能获得上下文。
15. 作为图谱观看者，我希望节点按分组着色并附图例，点选图例芯片可显隐对应分组，以便按维度过滤。
16. 作为图谱观看者，我希望输入关键词搜索：命中节点及其祖先链高亮、其余淡化、视口自动定位到首个命中，以便快速找到目标。
17. 作为图谱观看者，我希望一键导出当前图谱为 PNG（2x）或 SVG 文件，以便用于报告与存档。
18. 作为原生 JS 开发者，我希望 `createBidirectionalTree(element, options)` 一行接入，无需任何框架。
19. 作为开发者，我希望 `setData(newData)` 整体替换数据并保持动画过渡。
20. 作为开发者，我希望 `addChild(parentId, node)` / `removeChild(id)` 编程式增删节点，自动重排并过渡。
21. 作为开发者，我希望 `toggle(id)` / `collapseAll()` / `expandAll()` 程序化控制折叠态。
22. 作为开发者，我希望 `onNodeClick` / `onNodeToggle` / `onNodeSelect` 等事件回调接入自己的业务逻辑。
23. 作为开发者，我希望可配置 duration、rowHeight、columnGap、visibleChildrenLimit、linkStyle（orthogonal/diagonal）、配色主题、nodeColor 回调。
24. 作为开发者，我希望提供 `loadChildren` 异步回调缝：点击展开时动态拉取子节点（如远程 API），本地数据无回调时退化为本地分批。
25. 作为 Vue 3 开发者，我希望 `<BidirectionalTree :data @node-click>` 声明式使用、模板 ref 调用命令方法。
26. 作为 React 开发者，我希望 `<BidirectionalTree ref>`（forwardRef）获得同样能力。
27. 作为开发者，我希望 `destroy()` 彻底清理监听与 DOM，以便路由切换/组件卸载不泄漏。
28. 作为开发者，我希望包为 ESM + 完整 d.ts 类型，以便 TS 项目获得类型提示。
29. 作为维护者，我希望纯逻辑（布局数学、聚合分批、增删）先有测试再有实现（TDD），以便回归有兜底。
30. 作为维护者，我希望 demo 三页共享同一示例数据与工具栏，以便三种接入方式效果可直接对照。
31. 作为图谱观看者，我希望选择垂直布局（根居中、子树分上半区/下半区纵向展开），以便在左右窄长的画布中呈现双向树（2026-10-08 增补）。

## Implementation Decisions

- **工程**：pnpm monorepo；`packages/core`、`packages/vue`（peerDependencies: vue ^3）、`packages/react`（peerDependencies: react ^17|^18|^19）；`apps/demo` 为 Vite 多页应用（三 HTML 入口）。包构建用 tsup（ESM + d.ts），测试 vitest，格式化 prettier。
- **核心依赖**：core 直接依赖 d3 v7（hierarchy/selection/transition/zoom 等，打包摇树交给消费方）。
- **数据模型**：节点为 `{ id, name, group?, side?: 'left' | 'right', collapsed?, properties?, children? }`；根的直接子节点按 `side` 分侧，缺省按数量均分。
- **双向布局**：每侧各建 hierarchy 并以 `d3.tree().nodeSize([rowHeight, 1])` 计算纵向次序坐标；横向按深度分列，列起点 = 前列起点 + 该侧该深度最大节点宽度 + columnGap；左侧横向坐标取负镜像；两侧根对齐于 (0,0)。文本宽度用离屏 canvas measureText 度量（根节点字体更大单独度量），度量函数可从 options 注入以保证测试确定性。
- **折叠/展开**：采用官方 collapsible-tree 模式——`children` 与 `_children` 置换、`x0/y0` 记忆旧位置、d3.join enter/update/exit 三段过渡，duration 默认 250ms（altKey 慢放不实现）。
- **聚合（懒展开）**：渲染时每个有子节点的节点默认显示前 `visibleChildrenLimit`（默认 5）个子节点；剩余以"展开 (N)"虚拟聚合节点表示，点击释放下一批，取尽后聚合节点退出。提供 `loadChildren(parent) => Promise<children>` 回调缝：存在时点击聚合节点先回调再合并结果。
- **连线**：默认正交折线 generator；可选 `linkStyle: 'diagonal'`（d3.linkHorizontal）。
- **徽标**：节点外侧 14–16px 圆形 +/− 徽标，独立点击热区；徽标与节点本体点击都触发折叠切换；徽标 title 提示被收起后代数。
- **缩放**：d3.zoom 绑定 svg 根分组；`zoomToFit()` 计算内容包围盒与视口比例。
- **tooltip**：容器内绝对定位 div，跟随鼠标，内容由 formatter 回调生成（默认渲染 properties 键值表）。
- **图例筛选**：`setVisibleGroups(groups)` 隐藏非该组节点（连同其子树），图例 UI 由 demo 承担，core 只提供能力与配色回调。
- **搜索**：`search(keyword)` 对 name（及 properties 字符串值）做包含匹配，命中集并入全部祖先链，非命中整体降低不透明度，视口平移缩放至首个命中；`clearSearch()` 还原。
- **导出**：SVG 序列化（克隆节点内联计算样式）下载；PNG 将 SVG 转 blob→Image→canvas（2x scale）→ dataURL 下载。
- **增删**：`addChild(parentId, node, side?)` 定位父节点（含折叠态自动展开）插入并重排过渡；`removeChild(id)` 移除并收拢。
- **封装**：Vue 3 `<script setup>` 组件，watch props 变化映射到对应命令；React 18 函数组件 forwardRef，props diff 后调用命令；二者 ref 均暴露 core 实例的命令方法子集。
- **布局方向**：`orientation: 'horizontal' | 'vertical'`，默认 horizontal（向后兼容）。垂直 = 水平的坐标转置：根居中，side 语义映射为上半区（原 left）/下半区（原 right），深度沿 y 轴分"行"对齐（行起点 = 前序各行最大高度累计 + columnGap），兄弟沿 x 轴以 rowHeight 排布；直角折线转为 垂直-水平-垂直；徽标置于节点上（上半区）/下（下半区）外侧；聚合箭头上半区 `↑ 展开 (N)`、下半区 `展开 (N) ↓`。zoomToFit/搜索定位的居中公式按轴独立，无需分支。
- **单缝原则**：对外测试缝只有 `createBidirectionalTree` 公共 API（jsdom 环境），布局/聚合等纯函数不导出。

## Testing Decisions

- **好测试的标准**：只断言公共 API 的外部行为（渲染产物的 DOM 结构、几何位置、状态与回调），不断言内部实现细节（不测内部函数、不依赖私有字段）。
- **环境**：vitest + jsdom；文本度量经 options 注入固定宽度函数，保证布局断言确定性。
- **覆盖点**：初始渲染（左右分侧、根节点样式、节点数与折线数、列对齐）；折叠/展开（children/_children 效果、点击徽标与节点等价、过渡前后类名/位置）；聚合（5+1 形态、分批释放、取尽消失、loadChildren 回调被调用）；增删节点（层级变化、重排、事件）；搜索（高亮集合与淡化、祖先链、clearSearch 复原）；图例筛选；导出（SVG 字符串包含根 svg 与节点文本；PNG 路径 mock canvas 断言调用）；zoomToFit（视口变换包含内容包围盒）。
- **先例**：全新仓库，无既有测试，首个测试套件即立此范式。

## Out of Scope

- 完整键盘导航与屏幕阅读器支持（仅徽标/节点 title 与基础 aria）。
- 服务端渲染适配、WebWorker 布局加速。
- 撤销/重做栈。
- 真实后端 API 集成（loadChildren 仅留回调缝，demo 用本地数据）。
- i18n（库无内嵌文案；demo 文案为中文）。
- 发布到 npm registry（产物就绪，不执行发布）。
- 经典自顶向下单向布局（垂直形态采用上下分侧双向，2026-10-08 增补）。

## Further Notes

- 视觉参考稿分析与官方示例源码核对结论已合入上文"视觉基线/交互基线"，实现时以本 spec 为准。
- 官方折叠示例：https://observablehq.com/@d3/collapsible-tree
- 实施顺序见同目录 `issues/`（to-tickets 产出），阻塞关系在工单头部标注。
