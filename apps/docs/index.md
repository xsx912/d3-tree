---
layout: home

hero:
  name: d3-tree
  text: 基于 d3 v7 的双向树图谱
  tagline: 根居中、子树左右展开（或上下分侧）。框架无关核心 + Vue / React 薄封装，开箱即用。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/install
    - theme: alt
      text: 在线演示
      link: /demos/basic
    - theme: alt
      text: API 参考
      link: /guide/api

features:
  - icon: 🌳
    title: 双向布局
    details: 变宽圆角节点按列对齐、直角折线连线、左右（或上下）分侧，徽标折叠对齐官方 collapsible-tree 动画。
  - icon: 📦
    title: 懒加载聚合
    details: 子节点超限聚合为「展开 (N)」分批释放，loadChildren 异步回调缝直连远程 API。
  - icon: 🎨
    title: 完全自定义
    details: nodeRenderer（SVG）/ nodeTemplate（HTML）/ nodeSize 完全接管节点；linkColor / linkPathGenerator 自定义连线。
  - icon: 🔍
    title: 搜索与导出
    details: 命中高亮定位（含祖先链自动展开）、分组着色图例筛选、一键导出 PNG / SVG。
  - icon: 🧩
    title: 三框架一致
    details: 原生 createBidirectionalTree、Vue 3 组件、React 18/19 组件共享同一核心与类型。
  - icon: 🧪
    title: 测试覆盖
    details: 66 个 Vitest 用例走单缝公共 API，期望值几何独立推导。
---
