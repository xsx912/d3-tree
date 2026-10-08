# 10: 节点内容与样式完全自定义（nodeRenderer + nodeTemplate + nodeSize）

**What to build:** 用户可完全接管节点的内容与外观：`nodeSize(data, variant)` 控制节点几何（宽高，替代内置文字度量）；`nodeRenderer(ctx)` 拿到节点分组（原点中心的 SVGGElement）画任意 SVG 内容（导出无损）；`nodeTemplate(data, variant)` 返回 HTML 字符串/元素渲染进 foreignObject（图标/图片/富文本门槛最低，导出 PNG 需模板内联样式）。优先级 nodeRenderer > nodeTemplate > 默认渲染；+/− 徽标、折叠动画、连线、tooltip、搜索高亮在自定义模式下全部继续工作。demo 新增"自定义"页演示卡片式 HTML 节点与 SVG 图标节点。

**Blocked by:** None（基于已完成的 01-09 能力之上）

**Status:** resolved

- [x] nodeSize 生效：节点宽高、列对齐、包围盒均按自定义几何计算
- [x] nodeRenderer 替代默认渲染，收到 group/data/variant/side/depth/width/height 上下文
- [x] nodeTemplate 渲染进 foreignObject（XHTML 命名空间保证序列化/导出兼容），nodeRenderer 优先
- [x] 自定义模式下颜色刷新不侵入用户内容；徽标按自定义宽度定位；折叠/搜索/导出正常
- [x] Vue/React 封装透传三个 props（配置变化重建）
- [x] demo custom.html + 四页导航更新
- [x] jsdom 测试覆盖上述行为
