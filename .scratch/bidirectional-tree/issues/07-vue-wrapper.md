# 07: Vue 3 封装 + Vue demo 页

**What to build:** `@d3-tree/vue` 包提供 `<BidirectionalTree>` 组件（Vue 3 `<script setup>`）：props 覆盖 data 与常用 options（nodeColor、visibleChildrenLimit、duration 等）与事件（node-click/node-toggle/node-select），props 变化响应式映射到图表实例对应命令；模板 ref 暴露命令方法（addChild/removeChild/search/exportImage/zoomToFit/collapseAll/expandAll/setVisibleGroups）。新增 demo Vue 页与原生页共用示例数据与工具栏，效果一致；组件卸载时自动 destroy。

**Blocked by:** 06（搜索导出——core API 齐备后再封装）

**Status:** resolved

- [x] demo vue 页渲染效果与原生页一致（同一数据/工具栏功能全可用）
- [x] props 响应式：改 data/visibleChildrenLimit 等即时生效
- [x] ref 命令方法全部可用（搜索、追加、导出、适配视窗等）
- [x] 事件回调在 Vue 模板中可绑定
- [x] 组件卸载后无残留 DOM 与监听
