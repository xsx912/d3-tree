---
'@d3-tree/core': patch
---

修复 `theme` 覆盖值的类型过严：`Theme` 此前按 `as const` 字面量推导，`options.theme` / 封装组件 `theme` prop 只接受与默认值完全相同的字面量，传入任何自定义颜色都会编译报错。现开放为 `string`/`number`/`string[]`，运行时行为不变。
