# 修复验收记录

日期：2026-10-13。基线：10e707b。修改保留在当前工作区，未执行发布。

## 自动验证

精确 Node v22.20.0 / pnpm 10.15.0 / Windows 下执行 verify-minimum.cjs，最终退出码 0。完整输出见 minimum-validation.log。

- pnpm install --frozen-lockfile：通过，锁文件一致。
- pnpm lint：通过。
- pnpm typecheck：通过，新增 Vue/React 测试及配置也纳入检查。
- pnpm test：core 189 + React 3 + Vue 3 = 195 项全部通过，共 23 个测试文件。
- pnpm build：三库 ESM/CJS/d.ts、demo、docs 全部通过。
- git diff --check：通过；src 内临时 DEBUG 日志已清除。

新增回归先复现再修复：过期请求/同引用换代、旧搜索类、自定义内容更新、虚拟 loading 冲突、容器样式恢复、动态 Vue 插槽、React 实例身份与开关、基础 ARIA。补测根/普通节点变体切换、自定义组 class 修改、聚合文案与尺寸上下文、销毁后的命令/异步工作、resize、PNG Image/canvas/编码失败、两封装 ref 导出委托。悬浮框使用 fake timers，精确核对显示、防抖、淡出阈值前后。

最终脚本调用示例（第二个参数按本机 pnpm CLI 实际路径填写）：

```powershell
pnpm --package=node@22.20.0 dlx node .scratch/review-remediation/verify-minimum.cjs D:/nvm/nvm/v22.23.2/node_modules/pnpm/dist/pnpm.cjs
```

## 浏览器回归

Codex 内置浏览器，Windows / Chromium 155，本地 Vite 开发服务。

| 功能 | 证据与结果 |
| --- | --- |
| 水平/垂直布局 | 示例中心均呈现双侧树；AX 显示一个树所有者，DOM 提供显式层级 |
| 全展开/收起 | 原生页收起后 11 个节点，展开后 38 个节点；React 页面命令及搜索正常（DOM 退出动画期间计数不能当最终节点数） |
| 聚合释放 | 点击展开 (2) 后 IoT/显示技术进入，剩余另一聚合保持 |
| 搜索与清理 | 手机命中 1 个节点，其余淡化；清空后无 hit/dimmed 类 |
| 分组筛选 | 去掉医疗后显示节点从 38 减至 31 |
| HTML/SVG 自定义内容 | 两页视觉渲染正常；SVG 页 38 个自定义内容子组 |
| 懒加载 | 初始 loading 1，成功后清为 0；远程节点进入；模拟失败后提示可重试，取消失败模式后展开成功 |
| 滚轮缩放 | scale 从 0.4321 增至 1.0297 |
| 拖拽平移 | transform 平移由约 (-100.31,-227.23) 变为 (-20.31,-197.23)，scale 保持 |
| React 增删 | 选取模式新增测试节点 1 个，按删除确认流程移除后为 0，正常模式恢复 |
| Vue/React 悬浮卡 | 两页显示组件内容；最终 React 页一个 tree、38 个节点、悬浮卡可见，无 console error |
| SVG 导出 | Vue 页实际取得产业链图谱-Vue.svg（41334 bytes） |
| PNG 转换/下载 | 独立 core 验证页完整示例实际取得 review-smoke.png，266350 bytes，2000×1508；检查 PNG 签名与视觉内容正常，副本为 export-smoke.png |

截图：react-regression.png。浏览器验证期间发现 data URL PNG 未实际落盘，改用 canvas.toBlob + Blob URL；公共 API 导出测试和真实下载均验证这一转换。

## 验证限制

- 内置浏览器的下载等待接口存在长等待/超时：Vue 页真实调用已确认进入 core 并生成 268796-byte PNG Blob、Promise 完成，但该页的最终下载文件未捕获。因此不将 Vue 页 PNG 文件落盘标为已人工确认。core PNG 文件已实际取得，Vue/React 的真实 core 委托由组件集成测试覆盖。
- 减少动态效果的加载 CSS 规则及已有 matchMedia 行为已核对；未更改系统偏好作全套人工测试。
- 无屏幕阅读器人工测试，不承诺完整 ARIA tree 交互符合性；CI 的 Linux 与 Node 24.12.0 任务已配置，尚未在远端执行。
- 性能记录为单轮开发态同步调用测量，见 performance-smoke.json；5000 节点创建约 228—272ms、搜索约 370—421ms。无改动前基线，不构成性能回归结论；未测深链。宽树直接挂根、均衡树分叉 4，limit=5 不触发聚合，因此这些数据也不能用于评价聚合的性能收益。

## 本轮决策与剩余事项

01—11 已交付修复、回归与文档/changeset；02 增加可选 nodeRenderer 清理返回值，按 minor 定级，避免重新渲染框架内容时遗留资源。03 同时隔离 root/node/aggregate 内部身份，保持公共 ID 原值。

12—15 维持 needs-triage，并记录以下边界：

- 12：暂保留搜索整份数据的现有契约；搜索与过滤的新组合语义需要单独决定，已知隐藏命中不可定位的情况仍存在。
- 13：补充 HTML 信任/转义与无环数据约定；不新增 sanitizer 或公开 escapeHtml，不在本轮新增循环数据校验，非法循环输入仍可能递归溢出。
- 14：已建立可重复测量入口与单轮记录；深链、重复采样、布局/DOM 分解与模块拆分单独实施。
- 15：完整方向键/roving tabindex、键盘悬浮框与辅助技术矩阵仍超出原规格范围；本轮只修基础所有权与层级、默认对比度及加载动效偏好。
