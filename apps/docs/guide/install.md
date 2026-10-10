# 安装与接入

## 环境要求

- Node.js ≥ 18，pnpm ≥ 9（npm/yarn 亦可）
- 核心依赖 d3 v7 由 `@d3-tree/core` 自带；Vue / React 封装要求对应框架为 peer 依赖

## 安装

```bash
# 任意框架 / 无框架
pnpm add @d3-tree/core

# Vue 3 项目
pnpm add @d3-tree/vue @d3-tree/core vue

# React 18/19 项目
pnpm add @d3-tree/react @d3-tree/core react react-dom
```

> 本仓库尚未发布到 npm registry（见规格的 Out of Scope）。现阶段可通过 `file:` 协议本地接入：先在本仓库执行 `pnpm build`，再在你的项目中 `pnpm add file:D:/open-ode/d3-tree/packages/core`。若需发布私有 registry，运行 `pnpm -r build && pnpm publish` 即可。

## 原生接入

```ts
import { createBidirectionalTree } from '@d3-tree/core'

const chart = createBidirectionalTree(document.querySelector('#chart')!, {
  data: {
    id: 'root',
    name: '小米科技有限责任公司',
    children: [
      { id: 'hw', name: '智能硬件', side: 'right', children: [{ id: 'phone', name: '智能手机' }] },
      { id: 'fin', name: '金融科技', side: 'left' },
    ],
  },
  colorByGroup: true,        // 按 group 着色（可选）
  visibleChildrenLimit: 5,   // 超限聚合为「展开 (N)」
})

chart.search('手机')          // 高亮 + 定位
chart.addChild('hw', { id: 'tv', name: '智能电视' })  // 动态追加
chart.exportImage({ format: 'png', scale: 2 })        // 导出
chart.destroy()               // 卸载
```

## Vue 3 接入

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { BidirectionalTree } from '@d3-tree/vue'
import type { BidirectionalTreeExposed } from '@d3-tree/vue'

const tree = ref<BidirectionalTreeExposed | null>(null)
</script>

<template>
  <BidirectionalTree
    ref="tree"
    :data="data"
    color-by-group
    @node-click="n => console.log(n)"
    @groups-change="gs => (legend = gs)"
  />
</template>
```

模板 ref 暴露全部命令方法（`search` / `addChild` / `exportImage` / `zoomToFit` / `setVisibleGroups` / `setToggleOnNodeClick` 等）。

## React 接入

```tsx
import { useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle } from '@d3-tree/react'

export function Chart({ data }) {
  const tree = useRef<BidirectionalTreeHandle>(null)
  return (
    <BidirectionalTree ref={tree} data={data} colorByGroup
      onNodeClick={n => console.log(n)} />
  )
}
```

`data` 变化走 `setData` 保留实例；其余配置 props 变化自动重建；事件回调始终读最新闭包。

## 数据模型

```ts
interface TreeNodeData {
  id: string                    // 全局唯一，作渲染 key
  name: string                  // 节点文字（宽度自适应度量）
  group?: string                // 分组：着色 / 图例筛选 / 搜索
  side?: 'left' | 'right'       // 仅根的直接子节点生效；缺省按数量均分
  collapsed?: boolean           // 初始折叠态
  hasChildren?: boolean         // 标记"下一级未加载"：展示 + 徽标，点击展开触发 loadChildren 请求
  properties?: Record<string, string | number | boolean | null>  // tooltip 详情
  children?: TreeNodeData[]
}
```

完整的可配置项与命令式 API 见 [API 参考](/guide/api)。
