---
'@d3-tree/core': minor
'@d3-tree/vue': minor
'@d3-tree/react': minor
---

新增悬停事件缝：调用端可完全自接管悬浮框

- core `onNodeHover(node, ctx)` / `onNodeHoverEnd(node)`：配置 `onNodeHover` 即**停用内置悬浮框**（外壳/锚定/防抖/淡入淡出），悬停与移出由回调通知，渲染定位全归调用端（如 floating-ui / radix）；
- `TooltipContext` 新增 `element`（节点 SVG g 元素引用，实时 rect、缩放后不过期，可直接 anchor）与 `aggregate`（聚合节点标记——事件模式聚合照发）；
- 时序：事件忠实转发浏览器序列（移出立即触发 end、无防抖；直切时先收前节点 end 再收新 hover）、重渲染时触发 end、destroy 不触发；`onNodeHoverEnd` 需与 `onNodeHover` 成对配置；
- Vue `@node-hover` / `:on-node-hover`、React `onNodeHover` / `onNodeHoverEnd` props 透传，事件优先于 `#tooltip` 插槽 / `renderTooltip`。
