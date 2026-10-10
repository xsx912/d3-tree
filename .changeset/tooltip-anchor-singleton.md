---
'@d3-tree/core': minor
'@d3-tree/vue': minor
'@d3-tree/react': minor
---

悬浮框定位从「跟随光标」改为「锚定节点」：出现在节点外侧（垂直布局方向感知为上/下）、容器边缘自动翻转、缩放/平移时跟随节点、不再随鼠标移动；默认悬浮框与自定义内容行为一致。Vue 封装新增 `#tooltip` 作用域插槽（`{ node, ctx }`）、React 封装新增 `renderTooltip` render-prop——封装层托管**单实例**宿主（Vue `render()` 携带 appContext / React 常驻 `createRoot`）：hover 只更新内容不重挂载、移出仅隐藏，异步拉取/缓存放插槽（render-prop）根组件内实现。`@d3-tree/react` 新增 peerDependency `react-dom`。
