# 05：Vue 动态悬浮框插槽安全切换

Status: resolved
Priority: P2
Blocked by: None

## 问题

slots.tooltip 只在 create 时决定 formatter；TooltipSlotHost 每次直接调用当前 slot，条件删除后会调用 undefined，动态增加也不会启用插槽路径。

## 实施

渲染时判空并处理插槽有无变化，删除时清理宿主并回退 formatter/默认内容。Vue slots 对象不能假定可通过普通 watch 响应；在真实父组件条件插槽更新中验证检测机制，必要时使用更新生命周期同步配置。维持 ADR 的单实例宿主、缓存开关与自接管优先级。

## 验收

- [x] 补最小 Vue 组件集成测试环境；有→无→有条件插槽切换，hover 不抛错且内容来源正确。
- [x] 已显示悬浮框期间删插槽，组件清理与浮层隐藏正确。
- [x] 保留插槽仅更新函数/数据时展示新闭包，无多余实例。
- [x] tooltipCache 两模式、formatter 回退、自接管模式、最终卸载均正确。
- [x] 根 pnpm test 执行 Vue 测试；添加 Vue patch changeset。

## 验收记录（2026-10-13）

插槽判空，onUpdated 检查有无变化并重建/回退；缓存两模式和组件清理由真实 Vue 集成测试覆盖。详见 ../verification.md 与 ../minimum-validation.log。
