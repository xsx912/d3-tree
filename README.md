# d3-tree · 双向树图谱

基于 [d3 v7](https://d3js.org/) 的**横向双向树图谱**库：根节点居中，子树向左右两侧展开，适合呈现企业产业链、组织架构、思维导图等"中心实体 + 双侧分类下钻"的层级数据。

像 d3 本身一样**框架无关**——核心零框架依赖，另附 Vue 3 / React 薄封装：

| 包 | 说明 |
| --- | --- |
| `@d3-tree/core` | 框架无关核心（本仓库全部能力的实现处） |
| `@d3-tree/vue` | Vue 3 组件 `<BidirectionalTree>` |
| `@d3-tree/react` | React 18/19 组件 `<BidirectionalTree>` |

**特性**

- 双向布局：变宽圆角矩形节点、按列对齐、直角折线连线（可选贝塞尔）、左半区徽标在左/右半区在右
- 双方向：`orientation: 'horizontal'`（左右分侧，默认）或 `'vertical'`（上下分侧，水平布局的坐标转置；兄弟间距按节点宽度自适应防叠边）
- 折叠展开：对齐官方 [collapsible-tree](https://observablehq.com/@d3/collapsible-tree)（250ms 过渡，子树自点击处长出/回拢），节点本体与 +/− 徽标均可点击
- 懒加载聚合：子节点超限聚合为"展开 (N)"分批释放，`loadChildren` 异步回调缝可接远程 API
- 缩放平移 + `zoomToFit`；分组着色 + tooltip + 图例筛选；搜索高亮定位（含祖先链）；导出 PNG/SVG；编程式增删节点
- 主题与文案可配：`theme` 浅合并覆盖任意视觉字段（背景/节点/连线/徽标/调色板），`texts` 国际化内置文案
- 可访问性基线：节点键盘可操作（Enter/Space）、ARIA role/label/expanded、响应系统"减少动态效果"偏好
- TypeScript 全量类型，Vitest 覆盖公共 API（92 例），ESLint + changesets + GitHub Actions 全链路工程化

## 快速开始

```bash
pnpm install
pnpm dev         # demo 三页 + 自定义页（Vite，默认 5183 端口）
pnpm docs:dev    # 文档站（VitePress：安装/活示例/API）
pnpm docs:build  # 文档站静态产物（apps/docs/.vitepress/dist，可托管任意静态服务）
pnpm test        # vitest（core 92 例）
pnpm lint        # eslint
pnpm build       # tsup 构建三包（ESM + CJS）
```

## 原生使用（@d3-tree/core）

```ts
import { createBidirectionalTree } from '@d3-tree/core'

const chart = createBidirectionalTree(document.querySelector('#chart')!, {
  data: {
    id: 'root',
    name: '小米科技有限责任公司',
    children: [
      { id: 'hw', name: '智能硬件', side: 'right', children: [/* … */] },
      { id: 'fin', name: '金融科技', side: 'left' },
    ],
  },
  colorByGroup: true,          // 按 group 字段着色
  visibleChildrenLimit: 5,     // 超出聚合为“展开 (N)”
  onNodeClick: node => console.log(node),
})

chart.search('手机')           // 命中高亮 + 定位
chart.addChild('hw', { id: 'tv', name: '智能电视' }, 'right')
chart.exportImage({ format: 'png', scale: 2, filename: '图谱' })
chart.destroy()
```

## Vue 3（@d3-tree/vue）

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
    @node-click="onNodeClick"
    @groups-change="groups => (legend = groups)"
  />
</template>
```

模板 ref 暴露全部命令方法（`search` / `addChild` / `exportImage` / `zoomToFit` / `setVisibleGroups` / `setToggleOnNodeClick` 等）。

## React（@d3-tree/react）

```tsx
import { useRef } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle } from '@d3-tree/react'

export function Chart({ data }) {
  const tree = useRef<BidirectionalTreeHandle>(null)
  return (
    <BidirectionalTree
      ref={tree}
      data={data}
      colorByGroup
      onNodeClick={node => console.log(node)}
    />
  )
}
```

`data` 变化走 `setData`（保留实例）；其余配置 props 变化自动重建实例（实例内的缩放/搜索/展开状态会随之重置）；回调始终读最新闭包。

## 开源治理

- **License**：[MIT](LICENSE)
- **贡献**：见 [CONTRIBUTING.md](CONTRIBUTING.md)（开发环境 / 提交规范 / changeset 流程）
- **安全**：漏洞请勿公开 Issue，走 [SECURITY.md](SECURITY.md) 的私密报告渠道
- **行为准则**：[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **版本管理**：changesets 管理（`pnpm changeset` 声明变更 → 合并 Version PR 自动发布，npm provenance 可验证）
- **CI**：GitHub Actions 覆盖 lint / typecheck / test / build，文档站随 main 自动部署

## 数据模型

```ts
interface TreeNodeData {
  id: string                          // 全局唯一，作 join key
  name: string                        // 节点文字（宽度自适应度量）
  group?: string                      // 分组：着色 / 图例筛选 / 搜索
  side?: 'left' | 'right'             // 仅根的直接子节点生效；缺省按数量均分
  collapsed?: boolean                 // 初始折叠态
  properties?: Record<string, string | number | boolean | null>  // tooltip 详情
  children?: TreeNodeData[]
}
```

## 配置项（options）

| 选项 | 类型 / 默认 | 说明 |
| --- | --- | --- |
| `data` | `TreeNodeData`（必填） | 层级数据 |
| `duration` | `number` / `250` | 过渡动画时长（ms），`0` 关闭动画 |
| `fadeOpacity` | `number` / `1` | 展开/收起的淡入淡出透明度（0~1，超出钳制）：展开时新节点与连线从该值淡入至 1，收起时淡出至该值后移除；`1` 即纯位移动画 |
| `rowHeight` | `number` / `48` | 同层兄弟纵向步距 |
| `columnGap` | `number` / `48` | 深度列水平间距 |
| `visibleChildrenLimit` | `number` / `5` | 每父节点可见子节点上限，超出聚合"展开 (N)"；`0` 不聚合 |
| `linkStyle` | `'orthogonal' \| 'diagonal' \| 'straight'` / `'orthogonal'` | 连线：直角折线 / 贝塞尔 / 直线 |
| `orientation` | `'horizontal' \| 'vertical'` / `'horizontal'` | 布局方向：左右分侧 / 上下分侧（垂直下 rowHeight/columnGap 语义对调：兄弟间距/深度行距） |
| `linkColor` | `string \| (link) => string` / `'#C0C4CC'` | 连线颜色：颜色串或按连线两端信息（source/target 的 data/几何等）返回 |
| `linkWidth` | `number` / `1` | 连线宽度（px） |
| `linkPathGenerator` | `(link) => string` | 完全自定义连线：返回 SVG path 的 d，优先于 linkStyle（不做形变插值） |
| `colorByGroup` | `boolean` / `false` | 按 group 调色板着色（白字） |
| `nodeColor` | `(node) => string` | 自定义节点填充，优先于分组色 |
| `tooltip.formatter` | `(node) => string` | tooltip HTML 内容（默认名称 + properties 键值表，自动转义） |
| `loadChildren` | `(parent) => Promise<TreeNodeData[]>` | 点击"展开 (N)"时异步拉取子节点并入数据 |
| `onLoadError` | `(error, parent) => void` | loadChildren 拉取失败回调；缺省仅静默复位 loading 态 |
| `theme` | `Partial<Theme>` / 内置主题 | 主题定制：浅合并覆盖背景、节点、连线、徽标、调色板等任意字段 |
| `texts` | `TreeTexts` / 中文 | 内置文案定制（聚合"展开 (N)"、徽标悬停提示），用于国际化 |
| `toggleOnNodeClick` | `boolean` / `true` | `false` 时点击节点仅触发回调（编辑选取模式） |
| `measureText` | `(text, variant) => number` | 文本度量注入（测试确定性） |
| `onNodeClick` / `onNodeToggle` / `onNodeSelect` / `onGroupsChange` | 回调 | 节点交互与图例数据事件 |

## 实例方法

| 方法 | 说明 |
| --- | --- |
| `setData(data)` | 整体替换数据并过渡 |
| `toggle(id)` | 切换折叠态（根不可折叠） |
| `expandAll()` / `collapseAll()` | 全展开（含释放聚合）/ 收起至一级板块 |
| `addChild(parentId, node, side?)` | 追加子节点；父为根时可指定分侧；折叠父自动展开 |
| `removeChild(id)` | 删除节点及子树（根不可删） |
| `search(kw)` / `clearSearch()` | 命中 + 祖先链高亮、其余淡化、定位首个命中（折叠/聚合自动展开）；返回命中数 |
| `setVisibleGroups(groups \| null)` | 分组过滤（连同子树） |
| `zoomToFit()` | 适配视口（只缩小不放大） |
| `exportImage({ format, scale, filename })` | 导出 SVG / PNG（默认 png、2x） |
| `destroy()` | 移除 SVG、tooltip、样式与监听 |

## 视觉定制

默认视觉对齐企业图谱参考稿：根节点 `#1E6EFF` 蓝底白字加大、普通节点白底 `#DCDFE6` 描边、连线 `#C0C4CC` 直角折线、`+/−` 徽标与"展开 (N)"聚合节点。渲染元素均携带稳定类名（`d3t-node--root|node|aggregate`、`d3t-side--left|right`、`d3t-group--<group>`、`d3t-hit`、`d3t-dimmed` 等），可直接用 CSS 覆盖样式。

### 节点内容完全自定义

需要图标、头像、多行、富内容时，三个 options 完全接管节点（优先级 `nodeRenderer` > `nodeTemplate` > 默认渲染；`+/−` 徽标、折叠动画、连线、tooltip、搜索、导出在自定义模式下全部继续工作）：

```ts
// 1) 几何：nodeSize 决定宽高（布局/连线/包围盒随之适配）
nodeSize: (data, variant) =>
  variant === 'root' ? { width: 236, height: 64 } : { width: 176, height: 52 },

// 2) SVG 自定义渲染（导出 PNG/SVG 无损）——demo 见 /custom.html "SVG 图标"模式
nodeRenderer: ({ group, data, width, height, side, depth }) => {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', `${-width / 2}`) // …任意 SVG 内容
  group.appendChild(rect)
},

// 3) HTML 模板（渲染进 foreignObject，图标字体/图片/富文本最便捷；导出 PNG 需模板内联样式）
nodeTemplate: data => `
  <div style="display:flex;...">
    <img src="logo.png" width="20"/> <b>${data.name}</b>
  </div>`,
```

Vue/React 组件以同名 props 透传（`node-size` / `node-renderer` / `node-template`）。

### 连线自定义

```ts
// 内置三态
linkStyle: 'straight',                       // 折线 orthogonal（默认）/ 直线 straight / 曲线 diagonal

// 按目标节点分组着色（配合 colorByGroup 图例色）
linkColor: link => palette[link.target.data.group ?? ''] ?? '#C0C4CC',
linkWidth: 1.5,

// 完全自定义路径（回调收到 source/target 端点几何与数据，方向感知）
linkPathGenerator: ({ source, target }) =>
  `M${source.x},${source.y}Q${(source.x + target.x) / 2},${source.y} ${target.x},${target.y}`,
```

## 工程结构与工单

pnpm monorepo（`packages/core|vue|react` + `apps/demo`）。需求规格与实施工单见 [`.scratch/bidirectional-tree/`](.scratch/bidirectional-tree/)（spec + 9 张 tracer-bullet 工单，`issues/` 目录含验收清单）。
