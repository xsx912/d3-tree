---
'@d3-tree/core': minor
'@d3-tree/vue': minor
'@d3-tree/react': minor
---

悬浮框显隐节奏可配：新增淡入淡出过渡与防抖延时两个配置项

- `tooltip.fadeDuration`（默认 150ms，0 关闭）：显示淡入、隐藏淡出；系统"减少动态效果"偏好下未显式配置时自动关闭；淡出完成才真正隐藏并触发 `onTooltipHide`，淡出中移回节点/弹窗会取消；
- `tooltip.hideDelay`（默认 150ms）：移出节点/弹窗后的防抖隐藏延时，期间移入弹窗取消隐藏；
- Vue/React 封装层同名 prop 透传（`tooltip-fade-duration` / `tooltip-hide-delay`、`tooltipFadeDuration` / `tooltipHideDelay`）。
