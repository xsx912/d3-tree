# 01: 脚手架 + 静态双向树最小闭环

**What to build:** 仓库从零搭起 pnpm monorepo（core/vue/react 三包 + demo 应用，tsup/vitest/prettier 就绪），且 `@d3-tree/core` 的 `createBidirectionalTree(container, { data })` 能在 vanilla demo 页渲染一棵**静态**双向树：根节点居中蓝底白字加大、子树按 side 分左右两侧、白底灰边自适应宽度圆角矩形节点、浅灰直角折线连线、同深度子节点按列对齐；demo 使用产业链风格中文示例数据（对齐视觉参考稿：小米式企业产业链）。

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `pnpm install`、`pnpm build`、`pnpm test` 在全新克隆下全绿
- [x] vanilla demo 页（Vite）渲染双向树，视觉要素齐全：蓝根、白节点灰边、直角折线、左右分侧、列对齐、宽度自适应
- [x] 文本宽度度量可通过 options 注入（默认离屏 canvas measureText），注入后节点宽度可预测
- [x] 根的直接子节点无 `side` 时按数量自动均分左右
- [x] 示例数据为产业链风格（企业 → 左右产业板块 → 细分），含足够深度（≥3 层）
- [x] 公共 API 初始渲染有 vitest（jsdom）测试：分侧正确、节点/连线数量正确
