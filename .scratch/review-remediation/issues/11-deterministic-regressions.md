# 11：确定性悬浮框测试与风险路径验证

Status: resolved
Priority: P2
Blocked by: 01, 04, 05, 06

## 实施

将 tooltip 延时/淡出用例从真实 sleep 改为 Vitest fake timers，明确推进 Promise、rAF 和观察器回调，保证每例还原计时器与 mock。不可用增加等待余量代替确定性时序。补充此前报告指出的高风险公共行为验证，不为实现细节增加镜像测试。

## 验收

- [x] showDelay/hideDelay/fade 的阈值前后、取消、换节点、重渲染、销毁均有确定性断言。
- [x] resize 后居中/缩放行为建立公共 DOM 验证，先记录预期契约。
- [x] exportImage 的 Image 加载/canvas 失败仍释放 blob URL，拒绝或错误行为明确。
- [x] destroy 后异步工作不再产出 DOM/回调；逐项评估其他命令是否应 no-op，未明确契约时不盲目断言全部安全。
- [x] 浏览器实测滚轮/拖拽及 zoomToFit，不能只以 jsdom 替代真实输入验证。
- [x] 根测试覆盖 core/Vue/React，重复运行只针对原不确定时序用例；最终记录全套检查结果。

## 验收记录（2026-10-13）

确定性计时器、resize、导出失败/编码期间销毁、销毁后命令及两封装导出委托均通过。PNG 改 Blob URL 并取得实际完整图文件；滚轮/拖拽通过。最终最低版本检查与 195 测试通过。下载接口限制见 verification.md。详见 ../verification.md 与 ../minimum-validation.log。
