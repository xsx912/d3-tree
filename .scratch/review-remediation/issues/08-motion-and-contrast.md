# 08：加载动画偏好与默认文字对比度

Status: resolved
Priority: P2
Blocked by: None

## 实施

prefers-reduced-motion 为 reduce 时停用 loading 无限脉冲，以静态描边保留加载提示。对默认 aggregateText/badgeText、分组着色文字与背景计算实际对比度，按文字尺寸核对阈值后调整默认值或自动选择前景；不采用报告中的未核验数字。调用端主题覆盖保持有效。

## 验收

- [x] reduce 与正常偏好下 CSS/实际加载表现正确；不影响已有悬浮框淡入淡出偏好。
- [x] 记录默认调色板每组及聚合/徽标文字对比度，普通文本以 4.5:1 为目标。
- [x] 水平/垂直、分组着色与搜索状态做浏览器视觉检查。
- [x] 新默认视觉同步必要文档与截图，添加 core patch changeset。

## 验收记录（2026-10-13）

默认聚合/徽标文字改深灰；十六进制分组背景选择黑/白字，实际默认颜色对比度测试达到 4.5；加载 CSS 添加减少动态效果规则。系统偏好人工测试限制见 verification.md。详见 ../verification.md 与 ../minimum-validation.log。
