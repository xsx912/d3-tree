---
'@d3-tree/core': minor
'@d3-tree/vue': minor
'@d3-tree/react': minor
---

悬浮框内容组件化自定义：`tooltip.formatter` 放宽为 `(node, ctx) => string | HTMLElement`（此前仅 HTML 字符串）——返回 DOM 元素时原样挂入悬浮层，可承载 Vue `render()` / React `createRoot()` 渲染的组件宿主。新增 `TooltipContext`（`depth` / `side` / `collapsed`，formatter 第二参数）与 `tooltip.className`（追加到悬浮层的样式挂载点，内置外壳保留）。Vue / React 封装新增 `tooltipClassName` prop，`tooltipFormatter` 签名同步放宽。触发行为（跟鼠标、边缘翻转、聚合节点不显示）不变。
