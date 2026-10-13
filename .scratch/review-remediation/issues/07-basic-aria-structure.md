# 07：修正基础树语义与层级信息

Status: resolved
Priority: P2
Blocked by: 02, 03

## 问题与范围

平级 SVG 节点有 treeitem 但无 tree/group 所有者，层级不能由 DOM 推断。完整导航在原规格范围外，本工单只补基础结构，不承诺完整 ARIA tree 交互符合性。

## 实施

为真实 treeitem 建立 tree/group 所有权，并为平铺结构提供有效 aria-level、posinset、setsize，基于当前显示布局反映双侧层级、过滤与聚合状态。明确聚合节点的操作语义及其在所有权结构中的位置，避免只加一个 tree role 就宣称完整支持。更新时刷新 accessible name 与 expanded。

## 验收

- [x] 检查初始、折叠、聚合释放、分组过滤、setData 后的所有权、层级和同层位置。
- [x] 根节点与左右/上下侧形成同一棵树；聚合操作可被正确识别。
- [x] 徽标继续避免重复聚焦；Enter/Space 行为保留。
- [x] jsdom 结构验证加浏览器 accessibility tree 抽查，记录实际验证平台。
- [x] 文档说明基础支持及限制；添加 core patch changeset。

## 验收记录（2026-10-13）

节点由 tree 拥有，显式 level/posinset/setsize；聚合动作也作 treeitem。结构测试及 Windows Chromium AX 抽查通过；完整辅助技术支持见 15。详见 ../verification.md 与 ../minimum-validation.log。
