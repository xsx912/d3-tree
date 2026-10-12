# 悬浮框自定义

鼠标悬停节点时，图表在容器内显示悬浮框（聚合节点除外）。**悬浮框锚定节点**：出现在节点外侧（水平布局：左节点→左侧、右/根→右侧；垂直布局方向感知为上/下），容器边缘自动翻转，缩放/平移时跟随节点，不随光标移动。**悬浮层可交互**：鼠标移入弹窗内容区不隐藏，可以点击其中的按钮/链接（防抖窗口默认 150ms，可用 `tooltip.hideDelay` 调整；移出节点或弹窗后隐藏）——弹窗里放操作按钮、链接、复选框都可行。显隐带**淡入淡出**过渡（`tooltip.fadeDuration`，默认 150ms，`0` 关闭；系统开启"减少动态效果"且未显式配置时自动关闭），淡出完成后悬浮框才真正隐藏。缺省渲染节点名 + `properties` 键值表；通过 `tooltip.formatter` 可完全接管内容。

## tooltip.formatter —— 字符串或元素

```ts
createBidirectionalTree(el, {
  data,
  tooltip: {
    // 返回 HTML 字符串：按 HTML 解析，转义由调用端负责
    formatter: node => `<b>${node.name}</b><div>${node.properties?.['定位'] ?? ''}</div>`,
  },
})
```

返回 **DOM 元素**则原样挂入悬浮层，可承载任意组件宿主——Vue / React 组件渲染进一个宿主元素后返回即可：

```ts
// Vue：把 SFC 组件渲染进宿主元素
import { createApp, h } from 'vue'
import NodeCard from './NodeCard.vue'

formatter: (node, ctx) => {
  const host = document.createElement('div')
  createApp({ render: () => h(NodeCard, { node, ctx }) }).mount(host)
  return host
}
```

```ts
// React：createRoot 渲染进宿主元素
import { createRoot } from 'react-dom/client'
import { NodeCard } from './NodeCard'

formatter: (node, ctx) => {
  const host = document.createElement('div')
  createRoot(host).render(<NodeCard node={node} ctx={ctx} />)
  return host
}
```

formatter 在**每次 mouseenter 时调用**，内容随节点切换；分支读闭包变量即可热切换内容形态，无需重建实例。注意：旧内容被替换时库不调用任何卸载钩子——React `createRoot` 宿主等需要清理的场景，由调用端在 formatter 内自行管理（如复用同一宿主元素）。

::: tip 性能：复用单实例
不要每次 formatter 都新建 app/root——**复用同一个宿主元素**，内部只更新响应式状态或重渲染，DOM 层面只是节点挪位，组件实例不会重挂载。更好的方式是直接用封装层的组件 API（下两节），单实例由封装层托管。
:::

## TooltipContext

第二个参数是节点在当前视图中的位置与状态：

```ts
interface TooltipContext {
  depth: number                    // 深度（根为 0）
  side: 'left' | 'right' | 'center'
  collapsed: boolean               // 本地子级已折叠不显示（与"未加载"区分）
}
```

## tooltip.className —— 样式挂载点

```ts
tooltip: { className: 'biz-tip' }
```

`biz-tip` 会追加到悬浮层（基类 `d3t-tooltip` 保留）。内置外壳（背景/边框/圆角/阴影/padding）以内联样式提供，class 规则需 `!important` 才能覆盖：

```css
.biz-tip { border-radius: 10px !important; }
```

## Vue：#tooltip 作用域插槽

`@d3-tree/vue` 提供作用域插槽，插槽内容即悬浮框内容；**封装层托管单实例宿主**（常驻挂载、hover 只更新 props、移出仅隐藏不卸载），携带 appContext 保留 provide/inject：

```vue
<BidirectionalTree :data="data" tooltip-class-name="biz-tip">
  <template #tooltip="{ node, ctx }">
    <NodeCard :node="node" :ctx="ctx" />
  </template>
</BidirectionalTree>
```

插槽与 `tooltipFormatter` 同时提供时插槽优先。

## React：renderTooltip render-prop

`@d3-tree/react` 提供 render-prop；**封装层托管常驻 `createRoot`**（单实例，hover 只重渲染，卸载时机在组件卸载/重建时）：

```tsx
const renderTooltip = useCallback(
  (node: TreeNodeData, ctx: TooltipContext) => <NodeCard node={node} ctx={ctx} />,
  [],
)

<BidirectionalTree data={data} renderTooltip={renderTooltip} tooltipClassName="biz-tip" />
```

注意两点：函数身份变化会销毁重建整树（建议 `useCallback`）；返回树的根组件类型保持稳定（一直渲染 `NodeCard`）才能复用实例。`renderTooltip` 优先于 `tooltipFormatter`。react-dom 是 `@d3-tree/react` 的 peerDependency。

## 状态隔离：关闭实例缓存

默认（`tooltip-cache` / `tooltipCache` 为 `true`）内容组件**单实例常驻复用**：hover 只更新 props、移出仅隐藏，性能最优。若组件依赖 setup 重新执行（入场动画、独立状态），或希望状态不跨悬停留、卸载即时触发，传 `false` 关闭缓存——**每次悬停全新挂载，移出/换节点即卸载**：

```vue
<!-- 关闭缓存：每次悬停全新挂载、隐藏即卸载（onUnmounted 即时触发） -->
<BidirectionalTree :data="data" :tooltip-cache="false">
  <template #tooltip="{ node, ctx }">…</template>
</BidirectionalTree>
```

React 同理：`<BidirectionalTree renderTooltip={renderTooltip} tooltipCache={false} />`（effect cleanup 即时触发）。底层实现：core 的 `tooltip.onTooltipHide` 回调在悬浮层隐藏（移出/重渲染）时通知封装层卸载；纯 core 用户返回元素时可自行挂这个回调做清理。

## 异步内容：拉取 + 缓存 + 过期丢弃

单实例常驻后，异步详情放在插槽/render-prop 的**根组件**里最自然：`watch/useEffect` 监听节点 id → 拉取 → 命中缓存秒出；过期响应丢弃（Vue 用序号守卫，React 用 effect cleanup 的 stale 标记，真实业务可用 AbortController）：

```ts
// Vue：插槽根组件内
watch(() => props.node.id, () => {
  const mySeq = ++seq
  detail.value = null
  mockFetchNodeDetail(props.node).then(d => {
    if (mySeq !== seq) return // 悬停已切到其他节点，丢弃
    detail.value = d
  })
}, { immediate: true })
```

```ts
// React：卡片组件内
useEffect(() => {
  let stale = false
  setDetail(null)
  mockFetchNodeDetail(node).then(d => { if (!stale) setDetail(d) })
  return () => { stale = true }
}, [node.id])
```

加载期间渲染骨架屏占位即可（悬浮框已锚定节点；内容替换或尺寸变化——异步数据到达、字体/图片晚到撑高——由 core 自动重算锚定位置，不会压到节点）。完整示例见示例中心（`apps/demo`）的「异步数据悬浮卡（单实例）」，三种技术栈的可粘贴源码与画布一一对应。
