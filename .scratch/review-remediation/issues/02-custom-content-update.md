# 02：更新稳定 ID 的自定义节点内容

Status: resolved
Priority: P2
Blocked by: 01

## 问题

nodeRenderer/nodeTemplate 仅在 enter 执行；相同 ID 的名称、字段、尺寸或布局上下文变化后，内容与布局不一致。默认节点 aria-label 等 enter 阶段属性也需检查更新。

## 实施

建立独立的自定义内容承载区，与库管理的徽标及节点事件分离。在数据替换或渲染上下文变化时刷新自定义内容，保持 nodeRenderer > nodeTemplate > 默认渲染优先级。明确回调可被再次调用、group 内容归属及调用端组件清理边界；不能盲目反复 append 或删除徽标。若必须新增公开清理 API，先在工单记录接口与版本决策。

## 验收

- [x] 两种自定义方式同 ID 更新 name/properties 后显示新内容。
- [x] nodeSize、side/depth/variant 与聚合计数变化后内容几何和文案一致。
- [x] 多次更新无内容/徽标重复，data-d3t-toggle、选中、搜索、导出仍正常。
- [x] 复用节点的 aria-label、class、data-id 等与当前数据/布局一致。
- [x] 更新生命周期写入 types JSDoc、自定义节点文档；按接口变化添加 changeset。

## 验收记录（2026-10-13）

独立内容子组按重绘更新，支持清理返回值；同 ID 名称/尺寸/侧/深度、聚合计数、变体与自定义 class 均有回归。新增公开清理返回值按 core minor 定级。详见 ../verification.md 与 ../minimum-validation.log。
