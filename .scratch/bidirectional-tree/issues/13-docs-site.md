# 13: VitePress 文档站（安装 / 活示例 / API 说明）

**What to build:** `apps/docs` VitePress 站点：首页 hero（项目简介/特性卡/快速开始）、安装指南（pnpm/file: 接入、三框架用法）、**嵌入活组件的交互演示页**（Vue 组件直嵌 Markdown，可折叠/搜索/切方向/切线型）、完整 API 参考（options/实例方法/自定义上下文类型）、节点与连线自定义指南、双方向布局说明。构建产物纯静态可托管 GitHub Pages/Vercel。

**Blocked by:** None

**Status:** resolved

- [x] `pnpm docs:dev` 本地可跑；`pnpm --filter docs build` 产出静态站点
- [x] 首页/导航/侧边栏中文完整，含本地搜索
- [x] 演示页为活组件（真实交互：折叠徽标、搜索高亮、方向与线型切换、图例筛选）
- [x] API 页覆盖全部 options 与实例方法（与类型定义一致）
- [x] 浏览器视觉验证通过
