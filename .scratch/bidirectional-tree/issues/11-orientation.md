# 11: 布局方向 orientation（水平 / 垂直上下分侧）

**What to build:** `orientation: 'horizontal' | 'vertical'`（默认 horizontal 向后兼容）。垂直形态为水平布局的坐标转置：根居中，side 映射上半区（原 left）/下半区（原 right），深度沿 y 轴按"行"对齐（行起点 = 前序各行最大高度累计 + columnGap），兄弟沿 x 轴以 rowHeight 排布；直角折线变为 垂直-水平-垂直；+/− 徽标置于节点上（上半区）/下（下半区）外侧；聚合箭头 `↑ 展开 (N)` / `展开 (N) ↓`。折叠/聚合/搜索/导出/增删/自定义节点全部行为在两种方向下一致。demo 提供方向切换。

**Blocked by:** None（基于 01-10 能力）

**Status:** resolved

- [x] 默认 horizontal，既有 52 测试零改动全绿（向后兼容证明）
- [x] 垂直：上半区/下半区分侧正确（y 坐标符号独立推导断言）
- [x] 垂直：深度按行对齐、兄弟沿 x 以 rowHeight 间距排布
- [x] 垂直：连线为 V-H-V 直角折线；徽标上/下外侧；聚合箭头 ↑/↓
- [x] 折叠/搜索/导出/zoomToFit/自定义节点在垂直模式工作
- [x] Vue/React 透传 orientation（配置变化重建）
- [x] demo 方向切换可用
