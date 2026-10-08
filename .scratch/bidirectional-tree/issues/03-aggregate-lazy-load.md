# 03: "展开 (N)"聚合懒加载 + loadChildren 缝 + 全展开/全收起

**What to build:** 子节点数超过 `visibleChildrenLimit`（默认 5）时，只渲染前一批，剩余聚合为"展开 (N)"灰色虚拟节点（左侧前缀 "<"、右侧后缀 ">"）；点击聚合节点分批释放下一批，取尽后聚合节点退出。提供 `loadChildren(parent) => Promise<子节点数组>` 异步回调缝：配置时点击聚合节点先回调拉取再合并渲染（加载中显示等待态）。工具栏提供全展开 `expandAll()` 与全收起 `collapseAll()`。

**Blocked by:** 02（折叠展开）

**Status:** resolved

- [x] 8 个子节点的父节点渲染为 5 个普通节点 + 1 个"展开 (3)"
- [x] 点击聚合节点释放下一批（再 +3 后聚合节点消失，无多余节点）
- [x] `visibleChildrenLimit: 0` 时完全不聚合
- [x] 配置 loadChildren 时点击聚合节点触发回调一次，返回的子节点并入数据并渲染
- [x] `collapseAll()` / `expandAll()` 对整树生效（含聚合释放）
- [x] jsdom 测试：分批数量、取尽消失、回调被调用与合并、全展开/收起
