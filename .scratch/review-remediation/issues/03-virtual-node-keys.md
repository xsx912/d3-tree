# 03：隔离虚拟节点 key 与用户 ID

Status: resolved
Priority: P2
Blocked by: 02

## 问题

聚合节点 __agg__${parentId} 与任意用户字符串 ID 共享渲染 key、布局映射及 loading 命名空间。

## 实施

用带类型且可无歧义编码的内部 key 区分真实/聚合节点，统一用于布局映射、join、连线、位置缓存与 loading。公共 ID 保持原值；折叠、搜索、增删、事件及 parentId 查找不得错误改用内部 key。不以新增保留前缀限制用户数据。

## 验收

- [x] 合法用户 ID 为 __agg__a、带分隔符/中文/编码前缀时，真实节点与聚合节点同时存在且连线正确。
- [x] 点击聚合、真实节点、懒加载互不干扰；重复展开/收起 join 稳定。
- [x] root/左右两侧及同 ID 换数据的缓存映射正确。
- [x] 所有命令与回调继续接受/返回用户 ID；真实重复 ID 的告警保留。
- [x] 现有聚合、折叠、布局、搜索测试通过；添加 core patch changeset。

## 验收记录（2026-10-13）

root/node/aggregate 使用 JSON 元组内部 key；join、连线、缓存和 loading 一致，公共方法仍用用户 ID。覆盖合成同名、编码/分隔符/中文 ID。详见 ../verification.md 与 ../minimum-validation.log。
