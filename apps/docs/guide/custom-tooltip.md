# 悬浮框自定义

鼠标悬停节点时，图表在容器内显示跟随光标的悬浮框（聚合节点除外）。缺省渲染节点名 + `properties` 键值表；通过 `tooltip.formatter` 可完全接管内容。

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

## 框架封装

Vue / React 以 `tooltip-formatter` / `tooltip-class-name`（React 为 `tooltipFormatter` / `tooltipClassName`）props 透传，语义与 core 一致：

```vue
<BidirectionalTree :data="data" :tooltip-formatter="formatter" tooltip-class-name="biz-tip" />
```

注意：封装层把 formatter 视为配置项——**函数身份变化会销毁重建实例**。需要热切换内容时，保持函数身份稳定（Vue 在 setup 作用域定义一次；React 用 `useCallback` + ref 读最新值）。

完整示例见示例中心（`apps/demo`）的「悬浮框内容自定义」，三种技术栈的可粘贴源码与画布一一对应。
