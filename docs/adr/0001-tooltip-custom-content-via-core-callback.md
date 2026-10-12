# 悬浮框自定义走 core 回调，而非框架插槽

自定义悬浮框内容（tooltip.formatter）放宽为 `(node, ctx) => string | HTMLElement`，由 @d3-tree/core 提供，Vue/React 封装层只透传（tooltipFormatter/tooltipClassName props），不做框架惯用的插槽/render-prop。理由：core 回调对齐了 nodeTemplate 的 `string | HTMLElement` 先例，三栈一条缝、封装层零挂载成本；要上框架组件时，调用端用 `render(h(...), host)` / `createRoot(host).render(...)` 渲染进宿主元素后返回即可。框架惯用封装的代价（封装层内部挂载/卸载 VNode 或 ReactNode 的时序管理）被明确推迟到有真实需求再加。

考虑过的替代方案：Vue tooltip 插槽 + React render-prop（调用端体验最好，但封装层要管理悬浮 div 内的组件挂载与隐藏时卸载，复杂度高且与 core 的 mouseenter 驱动重建节奏耦合）；仅增强默认键值表（无法承载调用端组件，不满足"内容组件"诉求）。

**2026-10-10 演进**：真实需求出现——调用端要"页面始终只挂载一个悬浮框实例 + 异步 API 数据渲染"，单例复用与卸载时序恰是调用端最难写对的部分。方案 B 已落地：Vue `#tooltip` 作用域插槽、React `renderTooltip` render-prop，封装层托管常驻宿主（移出仅隐藏不卸载），core 回调仍是基础能力、优先级低于插槽/render-prop。core 不引入 async formatter（竞态/取消语义由插槽根组件用 watch/useEffect + AbortController 自管更自然），见 ADR-0002。

**2026-10-12 演进**：第三层需求出现——调用端不想用内置悬浮框，要完全自己实现（如 anchor 给 floating-ui / radix）。落地为悬停事件缝：core `onNodeHover(node, ctx)` / `onNodeHoverEnd(node)`，**配置即停用内置**（互斥判定简单直觉，不引入独立 enabled 开关），ctx 扩展 `element`（节点 g 引用，实时 rect 可 anchor）与 `aggregate`（聚合标记，事件模式聚合照发、由调用端区分）。时序语义刻意"薄"：移出立即（防抖是内置悬浮框的概念，自接管端要防抖自己实现）、直切只发新 hover、重渲染发 end（对齐内置锚点失效语义）、destroy 不发。封装层 Vue 用函数 prop（`@node-hover` 监听器编译后落在 `props.onNodeHover`，与 emits 声明的类型不可见问题兼容）、React 用条件透传 props（不能恒传包装函数——core 以 onNodeHover 是否存在判定模式）。
