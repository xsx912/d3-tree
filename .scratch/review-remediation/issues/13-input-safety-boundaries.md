# 13：明确 HTML 与循环数据输入边界

Status: needs-triage
Priority: P2
Blocked by: None

## 待评估

formatter/nodeTemplate 是有意开放的 HTML 缝；默认 tooltip 已转义，formatter JSDoc 指定调用端负责转义。先确认不可信字段插值的场景，补安全示例；不能将所有 innerHTML 定为独立漏洞或默认转义破坏富内容能力。

循环 children 可导致递归溢出，但“树”输入是否需要运行时拒绝需定义。推荐在创建/setData/addChild/异步合并的数据边界校验循环，先决定是否拒绝重复 ID/共享子树及错误通知规则；避免只保护首帧遗漏其他入口。

## 形成 ready-for-agent 的条件

- [ ] nodeTemplate 与 formatter 的信任/转义约定一致，示例不直接插入不可信值。
- [ ] 决定是否导出 escapeHtml；若新增工具，注明公开 API/minor 成本，不默认引入 sanitizer。
- [ ] 循环输入错误策略与性能预算明确，失败操作不得部分改写当前数据。
- [ ] 区分循环、重复 ID、共享对象，给出针对公共入口的验证矩阵。

## 本轮评估（2026-10-13）

保持 needs-triage。现有契约、已完成证据与未实施范围见 ../verification.md 的“本轮决策与剩余事项”。不作为本轮确认缺陷修复的隐含依赖。
