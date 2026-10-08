# 连线自定义

## 内置三态 linkStyle

```ts
linkStyle: 'straight'   // orthogonal 直角折线（默认） / straight 直线 / diagonal 贝塞尔
```

水平与垂直布局下均方向感知；enter/exit 过渡在三种内置线型间均可形变插值。

## linkColor / linkWidth

```ts
// 颜色串
linkColor: '#E8684A'

// 按连线两端信息回调（如按目标节点分组取色）
linkColor: link => palette[link.target.data.group ?? ''] ?? '#C0C4CC'

linkWidth: 1.5
```

颜色与线宽逐 path 设置为内联属性，仍可被 CSS `.d3t-link { stroke: … }` 覆盖。

## linkPathGenerator —— 完全自定义

```ts
linkPathGenerator: ({ source, target }) =>
  `M${source.x},${source.y}Q${(source.x + target.x) / 2},${source.y} ${target.x},${target.y}`
```

回调收到 `LinkRenderContext`（source/target 端点的 data、variant、side、depth 与几何），返回 SVG path 的 `d`，优先于 `linkStyle`。因自定义路径命令结构未知，enter/exit 不做形变插值（直接呈现）；节点过渡动画不受影响。

Vue / React 以 `link-color` / `link-width` / `link-path-generator` props 透传。
