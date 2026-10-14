---
'@d3-tree/core': minor
'@d3-tree/vue': minor
'@d3-tree/react': minor
---

新增移入显示延时 tooltip.showDelay（默认 300，悬停停留才出现）

- 悬停停留 N 毫秒后才出现——扫过节点不再弹窗；期间移出取消计时、换节点重启计时；设 `0` 回到移入即刻显示；
- 与 `hideDelay`/`fadeDuration` 组成完整的显隐节奏控制（显示延时 → 淡入 → 防抖 → 淡出）；
- Vue `tooltip-show-delay` / React `tooltipShowDelay` 同名透传；悬停事件缝（`onNodeHover`）不受影响（事件忠实转发，无延时）。
