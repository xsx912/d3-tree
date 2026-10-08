# 05: 分组着色 + tooltip + 图例筛选

**What to build:** 节点按 `group` 字段着色（内置克制调色板，`nodeColor` 回调可覆盖，默认主题仍为参考稿蓝根白节点），根节点样式不受分组影响；悬停节点显示 tooltip 详情卡（容器内绝对定位 div，内容由 formatter 回调生成，默认渲染 properties 键值），离开消失；`setVisibleGroups(groups)` 隐藏非命中分组的节点及其子树（保留连线完整性），demo 工具栏以图例芯片点选筛选。

**Blocked by:** 02（折叠展开）

**Status:** ready-for-agent

- [ ] 相同 group 的节点着色一致，不同 group 颜色可区分；nodeColor 回调优先
- [ ] 悬停显示 tooltip、内容含节点名称与 properties 键值；移出即隐藏；formatter 自定义生效
- [ ] `setVisibleGroups(['A'])` 后仅 A 组（及其子树）可见，恢复全部也支持
- [ ] 图例芯片与 setVisibleGroups 联动，芯片含分组名与色点
- [ ] jsdom 测试：分组类名正确、tooltip 显示/隐藏、筛选后可见集合断言
