# 06: 搜索高亮定位 + 导出 PNG/SVG

**What to build:** `search(keyword)` 对节点 name 与 properties 字符串值做包含匹配：命中节点及其全部祖先链高亮、其余节点淡化，视口自动平移缩放定位到首个命中节点；`clearSearch()` 复原。`exportImage({ format, scale, filename })`：SVG 为内联计算样式后的序列化下载；PNG 经 SVG→canvas（默认 2x）导出。demo 工具栏提供搜索框（输入即搜、清空复原）与导出按钮。

**Blocked by:** 04（缩放平移——搜索定位依赖 zoom 能力）

**Status:** resolved

- [x] 搜索命中的节点与其祖先链带高亮类名，非相关节点淡化
- [x] 视口移动使首个命中节点出现在可视区域中央附近
- [x] 无命中时不清空现有高亮并给出可查询的结果状态（如回调/返回值）
- [x] `clearSearch()` 后所有淡化/高亮复原
- [x] 导出 SVG 文件可独立打开且视觉与画布一致（样式内联）
- [x] 导出 PNG 为 2x 分辨率、内容完整
- [x] jsdom 测试：命中集合与祖先链高亮断言、clearSearch 复原、SVG 导出字符串包含节点文本
