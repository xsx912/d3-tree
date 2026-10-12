---
'@d3-tree/core': patch
'@d3-tree/vue': minor
'@d3-tree/react': minor
---

悬浮框内容组件实例缓存开关：Vue `tooltip-cache` / React `tooltipCache`（默认 `true` 维持单实例常驻复用）；传 `false` 时每次悬停全新挂载、移出/换节点即卸载——组件状态不跨悬停留，`onUnmounted` / effect cleanup 即时触发。core 新增 `tooltip.onTooltipHide` 回调（悬浮层隐藏时通知，移出/重渲染触发、destroy 不触发）作为封装层卸载时机的缝，纯 core 返回元素的调用端也可自行挂此回调做清理。
