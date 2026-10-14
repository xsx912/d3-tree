# @d3-tree/react

## 1.0.0

### Minor Changes

- 72ae7c5: 悬浮框定位从「跟随光标」改为「锚定节点」：出现在节点外侧（垂直布局方向感知为上/下）、容器边缘自动翻转、缩放/平移时跟随节点、不再随鼠标移动；默认悬浮框与自定义内容行为一致。Vue 封装新增 `#tooltip` 作用域插槽（`{ node, ctx }`）、React 封装新增 `renderTooltip` render-prop——封装层托管**单实例**宿主（Vue `render()` 携带 appContext / React 常驻 `createRoot`）：hover 只更新内容不重挂载、移出仅隐藏，异步拉取/缓存放插槽（render-prop）根组件内实现。`@d3-tree/react` 新增 peerDependency `react-dom`。
- d7ae00a: 悬浮框内容组件实例缓存开关：Vue `tooltip-cache` / React `tooltipCache`（默认 `true` 维持单实例常驻复用）；传 `false` 时每次悬停全新挂载、移出/换节点即卸载——组件状态不跨悬停留，`onUnmounted` / effect cleanup 即时触发。core 新增 `tooltip.onTooltipHide` 回调（悬浮层隐藏时通知，移出/重渲染触发、destroy 不触发）作为封装层卸载时机的缝，纯 core 返回元素的调用端也可自行挂此回调做清理。
- 43ba636: 悬浮框内容组件化自定义：`tooltip.formatter` 放宽为 `(node, ctx) => string | HTMLElement`（此前仅 HTML 字符串）——返回 DOM 元素时原样挂入悬浮层，可承载 Vue `render()` / React `createRoot()` 渲染的组件宿主。新增 `TooltipContext`（`depth` / `side` / `collapsed`，formatter 第二参数）与 `tooltip.className`（追加到悬浮层的样式挂载点，内置外壳保留）。Vue / React 封装新增 `tooltipClassName` prop，`tooltipFormatter` 签名同步放宽。触发行为（跟鼠标、边缘翻转、聚合节点不显示）不变。
- c61bfa9: 悬浮框显隐节奏可配：新增淡入淡出过渡与防抖延时两个配置项

  - `tooltip.fadeDuration`（默认 150ms，0 关闭）：显示淡入、隐藏淡出；系统"减少动态效果"偏好下未显式配置时自动关闭；淡出完成才真正隐藏并触发 `onTooltipHide`，淡出中移回节点/弹窗会取消；
  - `tooltip.hideDelay`（默认 150ms）：移出节点/弹窗后的防抖隐藏延时，期间移入弹窗取消隐藏；
  - Vue/React 封装层同名 prop 透传（`tooltip-fade-duration` / `tooltip-hide-delay`、`tooltipFadeDuration` / `tooltipHideDelay`）。

- 56d990e: 新增悬停事件缝：调用端可完全自接管悬浮框

  - core `onNodeHover(node, ctx)` / `onNodeHoverEnd(node)`：配置 `onNodeHover` 即**停用内置悬浮框**（外壳/锚定/防抖/淡入淡出），悬停与移出由回调通知，渲染定位全归调用端（如 floating-ui / radix）；
  - `TooltipContext` 新增 `element`（节点 SVG g 元素引用，实时 rect、缩放后不过期，可直接 anchor）与 `aggregate`（聚合节点标记——事件模式聚合照发）；
  - 时序：事件忠实转发浏览器序列（移出立即触发 end、无防抖；直切时先收前节点 end 再收新 hover）、重渲染时触发 end、destroy 不触发；`onNodeHoverEnd` 需与 `onNodeHover` 成对配置；
  - Vue `@node-hover` / `:on-node-hover`、React `onNodeHover` / `onNodeHoverEnd` props 透传，事件优先于 `#tooltip` 插槽 / `renderTooltip`。

- 4d6906c: 新增移入显示延时 tooltip.showDelay（默认 300，悬停停留才出现）

  - 悬停停留 N 毫秒后才出现——扫过节点不再弹窗；期间移出取消计时、换节点重启计时；设 `0` 回到移入即刻显示；
  - 与 `hideDelay`/`fadeDuration` 组成完整的显隐节奏控制（显示延时 → 淡入 → 防抖 → 淡出）；
  - Vue `tooltip-show-delay` / React `tooltipShowDelay` 同名透传；悬停事件缝（`onNodeHover`）不受影响（事件忠实转发，无延时）。

### Patch Changes

- e51b8f6: 修复数据换代后的异步加载/搜索残留、稳定 ID 自定义内容更新及聚合 key 冲突；nodeRenderer 新增可选清理返回值，在刷新、退出和销毁时释放内容资源。补基础树所有权与层级、默认文字对比度、减少动态效果规则，并恢复容器定位样式。

  React 悬停事件回调经最新 props 调用、点击开关热更新；Vue 条件悬浮框插槽切换安全回退。新增两框架组件集成测试。

  PNG 使用 canvas.toBlob 与 Blob URL 下载，避免 data URL 下载受浏览器限制；销毁后命令不再修改数据或发起下载，失败转换保持 URL 清理。

- Updated dependencies [0e3953f]
- Updated dependencies [792e509]
- Updated dependencies [e51b8f6]
- Updated dependencies [95ce2c2]
- Updated dependencies [10e707b]
- Updated dependencies [72ae7c5]
- Updated dependencies [d7ae00a]
- Updated dependencies [43ba636]
- Updated dependencies [c61bfa9]
- Updated dependencies [56d990e]
- Updated dependencies [9a7be2c]
- Updated dependencies [abd2c22]
- Updated dependencies [4d6906c]
- Updated dependencies [0a5b8ea]
  - @d3-tree/core@0.2.0
