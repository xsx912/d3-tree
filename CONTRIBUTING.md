# 贡献指南

感谢关注 d3-tree！欢迎以 Issue / Pull Request 的形式参与贡献。

## 开发环境

```bash
pnpm install        # 安装依赖（需要 Node >= 18 与 pnpm >= 10）
pnpm dev            # demo 三页（Vite，默认 5183 端口）
pnpm docs:dev       # 文档站（VitePress）
pnpm test           # Vitest（packages/core）
pnpm typecheck      # tsc --noEmit（三包）
pnpm lint           # ESLint
pnpm build          # tsup 构建三包
```

仓库为 pnpm monorepo：`packages/core`（框架无关核心）、`packages/vue`、`packages/react` 为发布包，`apps/demo`、`apps/docs` 为演示与文档站（不发布）。

## 提交规范

- 使用 Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` 等）。
- **所有影响发布包的 PR 必须附带 changeset**：在仓库根目录执行 `pnpm changeset`，按提示选择包与 bump 级别（`patch` / `minor` / `major`），生成 `.changeset/*.md` 一并提交。
- 提交前请确保 `pnpm lint && pnpm typecheck && pnpm test` 全部通过（CI 会再跑一遍）。

## 核心包开发约定

- `packages/core/src/layout.ts` 是纯函数布局引擎，禁止引入 DOM 依赖；渲染逻辑归 `chart.ts`。
- 公共 API 变更需同步更新 `types.ts` 的 JSDoc、README 配置表与 `apps/docs/guide/api.md`。
- 新行为需附带 Vitest 用例；文本度量请注入 `measureText` 保证断言确定性。

## 发布流程（维护者）

1. 合并到 `main` 后，changesets bot 会发起 **Version PR**（聚合所有 changeset、升级版本号、更新 CHANGELOG）。
2. 维护者合并 Version PR，CI 自动执行 `changeset publish` 发布到 npm（带 provenance）并打 tag。
3. 文档站随 `main` 自动部署到 GitHub Pages。

## 行为准则

参与贡献即表示同意遵守 [行为准则](CODE_OF_CONDUCT.md)。
