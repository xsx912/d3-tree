# 08: React 封装 + React demo 页

**What to build:** `@d3-tree/react` 包提供 `<BidirectionalTree>` 组件（React 18 函数组件 + forwardRef）：props 覆盖 data 与常用 options 与事件回调（onNodeClick 等），props 变化经 diff 后映射到图表实例命令；ref 暴露与 Vue 封装一致的命令方法集合。新增 demo React 页与原生/Vue 页共用示例数据与工具栏，效果一致；严格模式与组件卸载时正确 destroy、无重复实例。

**Blocked by:** 06（搜索导出——core API 齐备后再封装）

**Status:** resolved

- [x] demo react 页渲染效果与原生页一致（同一数据/工具栏功能全可用）
- [x] props 变化即时生效，事件回调可绑定
- [x] ref 命令方法全部可用（与 Vue 封装同集）
- [x] 组件卸载/严格模式重挂载后无残留、无重复实例
