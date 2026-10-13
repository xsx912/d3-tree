# 10：文档、规格与发布说明收口

Status: resolved
Priority: P3
Blocked by: 01, 02, 03, 04, 05, 06, 07, 08, 09, 11

## 实施与验收

- [x] README/CONTRIBUTING 的 build 范围说明包含 demo/docs；测试覆盖描述避免写易过期的固定数量，若保留则以本轮实测更新。
- [x] install 私有 registry 指引改为实际 Changesets version/publish 流程，说明 registry/auth 配置与私有根包不发布；不执行发布。
- [x] 清楚区分尚未发布时的 file: 接入与未来 registry 安装；校正 demo 安装注释。
- [x] 规格 React peer 目标统一为 18/19；按 ADR 校正跟随鼠标等过期悬浮框描述，不把已演进实现误判为违规。
- [x] README/API/custom-tooltip 的 TooltipContext 补 element/aggregate，side 补 center。
- [x] 分组 CSS 类名文档说明 ASCII 净化、哈希后缀及中文示例，不承诺原 group 原样可作选择器。
- [x] 同步数据换代、节点回调更新、React 热更新、Vue 动态插槽、基础无障碍支持的最终契约。
- [x] tooltip-cache-toggle 的 core 新增公开 onTooltipHide 对齐 minor；检查本轮各包 changeset，避免文档变更错误触发发布。
- [x] docs 构建、链接与示例验证通过，记录实际检查结果。

## 验收记录（2026-10-13）

同步环境、构建/测试范围、Changesets 发布、React 18/19、TooltipContext、分组类名、回调更新及基础无障碍；纠正旧悬浮框/垂直布局描述与安装注释，添加修复 changeset 并调整旧 core 新接口为 minor。详见 ../verification.md 与 ../minimum-validation.log。
