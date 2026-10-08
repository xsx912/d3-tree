# 节点自定义

三层入口，优先级 `nodeRenderer` > `nodeTemplate` > 默认渲染。自定义模式下 **+/− 徽标、折叠动画、连线、tooltip、搜索、导出全部继续工作**。

## nodeSize —— 几何接管

```ts
nodeSize: (data, variant) =>
  variant === 'root' ? { width: 236, height: 64 } : { width: 176, height: 52 }
```

布局、连线端点、包围盒全部按你的尺寸计算；垂直模式下深度行距按各行最大高度累计。

## nodeRenderer —— 任意 SVG（导出无损）

```ts
nodeRenderer: ({ group, data, width, height, side, depth }) => {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', `${-width / 2}`)
  rect.setAttribute('y', `${-height / 2}`)
  rect.setAttribute('width', `${width}`)
  rect.setAttribute('height', `${height}`)
  rect.setAttribute('rx', '22')
  rect.setAttribute('fill', '#fff')
  group.appendChild(rect)
  // 圆形头像、多段文本、图标……任意 SVG 内容
}
```

## nodeTemplate —— HTML 模板（最便捷）

```ts
nodeSize: () => ({ width: 180, height: 52 }),
nodeTemplate: data => `
  <div style="width:100%;height:100%;background:#fff;border:1px solid #E4E7ED;
    border-radius:8px;box-sizing:border-box;display:flex;align-items:center;gap:10px;">
    <div style="width:6px;align-self:stretch;background:#5B8FF9;"></div>
    <div>
      <div style="font-size:14px;font-weight:600;">${data.name}</div>
      <div style="font-size:11px;color:#909399;">${data.group ?? ''}</div>
    </div>
  </div>`
```

渲染进 foreignObject（XHTML 命名空间，序列化与 PNG 导出兼容）。**导出 PNG 时模板需内联样式**（外部 CSS 不会进入导出产物）。

Vue / React 组件以同名 props 透传：`node-size` / `node-renderer` / `node-template`。

::: warning 几何约束
请勿用 CSS 修改节点高度——连线端点按布局几何计算，强改会错位。需要非默认高度时一律走 `nodeSize`。
:::
