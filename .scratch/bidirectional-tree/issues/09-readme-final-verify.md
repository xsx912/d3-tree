# 09: README 文档 + 全量构建测试收尾

**What to build:** 根 README 覆盖：项目简介（配效果图位置说明）、快速开始（pnpm i/dev/build/test）、三种接入方式的用法代码（原生 `createBidirectionalTree`、Vue 组件、React 组件）、完整 options/命令 API 表、视觉定制（配色/linkStyle/度量注入）、工单目录说明。收尾跑全量 `pnpm build` + `pnpm test` + 类型检查，三页浏览器视觉验证（对照参考稿：蓝根/折线/徽标/展开(N)；折叠动画对照官方示例）。

**Blocked by:** 07（Vue 封装）, 08（React 封装）

**Status:** ready-for-agent

- [ ] README 三种用法示例代码准确（与实际导出一致）
- [ ] options 与命令方法文档齐全、含默认值
- [ ] `pnpm build`、`pnpm test`、类型检查全绿
- [ ] 三页浏览器截图视觉验证通过（风格对齐参考稿、动画行为对齐官方示例）
