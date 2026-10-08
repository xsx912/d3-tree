# 04: 缩放平移 + zoomToFit + 追加/删除节点

**What to build:** 图谱支持滚轮缩放与拖拽平移（d3.zoom），`zoomToFit()` 一键将整棵树收进视口；数据层支持编程式增删——`addChild(parentId, node, side?)` 定位父节点插入（父为折叠态时自动展开）并带过渡重排，`removeChild(id)` 移除节点并收拢过渡；`setData(newData)` 整体替换保持过渡。demo 工具栏提供"追加子节点"流程（点按钮进入选取模式→点节点选父→填名称确认）与"删除选中节点"。`onNodeSelect` 事件供选取模式使用。

**Blocked by:** 02（折叠展开）

**Status:** ready-for-agent

- [ ] 滚轮缩放以指针为中心、拖拽平移流畅，缩放范围有限制（如 0.1–4）
- [ ] `zoomToFit()` 后内容包围盒完整落在视口内（含边距）
- [ ] `addChild` 后新节点以过渡动画出现在正确分侧/列位置；父节点原为折叠态则自动展开
- [ ] `removeChild` 后节点消失且兄弟位置收拢过渡
- [ ] `setData` 替换整树数据并平滑过渡到新布局
- [ ] demo：追加节点（含选父交互）与删除节点全流程可用
- [ ] jsdom 测试：addChild/removeChild/setData 后节点集合与位置断言；zoomToFit 变换包含包围盒
