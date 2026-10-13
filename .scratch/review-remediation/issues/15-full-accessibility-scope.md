# 15：评估完整键盘导航与辅助技术支持

Status: needs-triage
Priority: P2
Blocked by: 07

## 范围冲突

原 .scratch/bidirectional-tree/spec.md 明确将完整键盘导航与屏幕阅读器支持列为 Out of Scope。不能把 roving tabindex、方向键/Home/End、键盘悬浮框作为基础 ARIA 修复的隐含验收。

## 形成 ready-for-agent 的条件

- [ ] 选择是否扩展范围，并同步规格/必要 ADR；保留当前基础支持的限制说明。
- [ ] 定义双侧/垂直方向键规则、根节点、聚合动作、折叠/过滤后焦点归属、Home/End 与 Tab 离开行为。
- [ ] 定义可交互悬浮框的 focus/hover、Escape、隐藏和焦点恢复语义，兼容内置与自接管模式。
- [ ] 核验搜索是否仅依赖颜色传递命中；需要时设计非颜色提示及命中反馈，而非直接据报告认定符合性失败。
- [ ] 明确辅助技术/浏览器矩阵与人工验证步骤，自动测试不替代屏幕阅读器实测。

## 本轮评估（2026-10-13）

保持 needs-triage。现有契约、已完成证据与未实施范围见 ../verification.md 的“本轮决策与剩余事项”。不作为本轮确认缺陷修复的隐含依赖。
