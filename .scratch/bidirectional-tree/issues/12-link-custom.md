# 12: 连线颜色与样式自定义（straight / linkColor / linkWidth / linkPathGenerator）

**What to build:** 连线四层自定义：① `linkStyle` 增加 `'straight'`（直线，水平/垂直两方向）；② `linkColor`：CSS 颜色串或按连线两端信息（source/target 的 data/variant/side/depth/几何）返回颜色的回调，缺省保持 `#C0C4CC`；③ `linkWidth`：线宽，缺省 1；④ `linkPathGenerator`：返回 SVG path d 的完全自定义回调，优先于 linkStyle（自定义路径不做 enter/exit 形变插值，直接呈现）。Vue/React 同名 props 透传；demo 提供连线样式切换。

**Blocked by:** None（基于 01-11）

**Status:** resolved

- [x] linkStyle: 'straight' 水平/垂直两方向均为 M..L.. 直线，退化路径结构一致可插值
- [x] linkColor 字符串与回调（按端点分组着色）生效；缺省颜色不变（回归）
- [x] linkWidth 生效；颜色/线宽逐 path 设置（CSS 覆盖能力保留）
- [x] linkPathGenerator 返回值原样渲染并优先于 linkStyle；折叠/增删在自定义线下工作
- [x] Vue/React 透传三个 props
- [x] demo 连线样式切换（折线/直线/曲线）+ 分组着色示例
- [x] jsdom 测试覆盖上述（期望独立推导）
