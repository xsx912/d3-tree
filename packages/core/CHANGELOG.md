# @d3-tree/core

## 0.2.0

### Minor Changes

- 0e3953f: 自定义节点支持 `data-d3t-toggle` 标记区域：`nodeTemplate` / `nodeRenderer` 内容中标记该属性的元素，点击时切换所属节点的折叠/展开态（同内置徽标语义——阻断冒泡、不触发选中回调、不受 `toggleOnNodeClick` 约束）。配合 `toggleOnNodeClick: false` 可实现"点击节点本体只回调、仅调用端指定区域可折叠展开"。
- 792e509: `fadeOpacity` 默认值由 1 调整为 0.25：展开/收起默认自带淡入淡出（新节点与连线从 0.25 淡入至 1、收起淡出至 0.25 后移除）。需要旧的纯位移动画时显式传 `fadeOpacity: 1` 关闭。

### Patch Changes

- 95ce2c2: 修复 `theme` 覆盖值的类型过严：`Theme` 此前按 `as const` 字面量推导，`options.theme` / 封装组件 `theme` prop 只接受与默认值完全相同的字面量，传入任何自定义颜色都会编译报错。现开放为 `string`/`number`/`string[]`，运行时行为不变。
