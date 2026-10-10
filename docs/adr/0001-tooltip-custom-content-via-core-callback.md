# 悬浮框自定义走 core 回调，而非框架插槽

自定义悬浮框内容（tooltip.formatter）放宽为 `(node, ctx) => string | HTMLElement`，由 @d3-tree/core 提供，Vue/React 封装层只透传（tooltipFormatter/tooltipClassName props），不做框架惯用的插槽/render-prop。理由：core 回调对齐了 nodeTemplate 的 `string | HTMLElement` 先例，三栈一条缝、封装层零挂载成本；要上框架组件时，调用端用 `render(h(...), host)` / `createRoot(host).render(...)` 渲染进宿主元素后返回即可。框架惯用封装的代价（封装层内部挂载/卸载 VNode 或 ReactNode 的时序管理）被明确推迟到有真实需求再加。

考虑过的替代方案：Vue tooltip 插槽 + React render-prop（调用端体验最好，但封装层要管理悬浮 div 内的组件挂载与隐藏时卸载，复杂度高且与 core 的 mouseenter 驱动重建节奏耦合）；仅增强默认键值表（无法承载调用端组件，不满足"内容组件"诉求）。
