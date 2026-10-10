---
'@d3-tree/core': minor
---

自定义节点支持 `data-d3t-toggle` 标记区域：`nodeTemplate` / `nodeRenderer` 内容中标记该属性的元素，点击时切换所属节点的折叠/展开态（同内置徽标语义——阻断冒泡、不触发选中回调、不受 `toggleOnNodeClick` 约束）。配合 `toggleOnNodeClick: false` 可实现"点击节点本体只回调、仅调用端指定区域可折叠展开"。
