# 09：统一开发环境最低版本

Status: resolved
Priority: P2
Blocked by: None

## 实施

以实际锁文件中的 Vite 7 及其余开发依赖 engine 为依据，统一根 engines、README、CONTRIBUTING、install 文档及 CI/release/docs workflow。最低 Node 范围至少满足 ^20.19.0 || >=22.12.0，若依赖要求更高则记录原因；CI 增加最低版本验证，常规任务使用一个明确支持的版本。pnpm 与 packageManager 的 10.15.0 对齐。区分仓库开发要求与发布库消费要求。

## 验收

- [x] 最低支持 Node 下 pnpm install --frozen-lockfile 与 lint/typecheck/test/build 全通过。
- [x] CI、release、docs 不再依赖含不支持小版本的笼统最低说明。
- [x] 未无依据提升发布库或消费方框架要求；不以降级 Vite 规避文档问题。
- [x] 锁文件只在必要依赖变动时更新；记录本地未能执行的 CI 条件。

## 验收记录（2026-10-13）

锁文件 Linux 构建依赖使最低开发版本升至 22.20/24.12；CI 设两版本，release/docs 24.12。精确 22.20 的本机安装与全套检查通过，远端 CI 尚未执行。详见 ../verification.md 与 ../minimum-validation.log。
