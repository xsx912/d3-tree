# 04：React 回调与交互开关稳定更新

Status: resolved
Priority: P2
Blocked by: 01

## 问题

创建 effect 依赖 onNodeHover/onNodeHoverEnd 的函数身份及 toggleOnNodeClick。内联回调或开关变化导致整树重建，与 propsRef 晚绑定意图和 Vue 热更新行为不一致。

## 实施

回调经 propsRef 读最新函数；重建依赖只体现自接管模式是否启用，避免 hoverEnd 存在性/身份变化造成无必要重建。toggleOnNodeClick 经 optionsRef 热更新，保留 ref 命令语义。renderTooltip、renderer、theme 等配置另有语义，不能一律移出依赖。建立最小 React+jsdom 集成测试脚本并纳入根测试。

## 验收

- [x] 父组件反复提供新内联 hover/end 函数，SVG 实例、缩放、折叠、搜索保持，事件读取最新闭包。
- [x] 动态增加/删除 hoverEnd 后事件行为正确，无实例重建。
- [x] 开关 prop 更新后实例保持且点击切换规则立即生效；ref 命令仍有效。
- [x] 自接管模式开/关正确切换内置悬浮框，StrictMode 挂载/清理无重复实例。
- [x] 文档明确热更新与重建边界；添加 React patch changeset。

## 验收记录（2026-10-13）

React 自接管模式布尔值控制重建，悬停回调读取最新 props；点击开关热更新。组件生命周期、StrictMode 和导出委托测试通过。详见 ../verification.md 与 ../minimum-validation.log。
