# 水平与垂直布局

`orientation: 'horizontal' | 'vertical'`，默认水平（左右分侧）。

## 垂直形态（上下分侧）

垂直 = 水平布局的**坐标转置**：

- 根居中，`side: 'left'` 映射**上半区**、`'right'` 映射**下半区**（缺省均分规则不变）
- 深度沿 y 轴按**行**对齐：行起点 = 前序各行最大节点高度累计 + `columnGap`
- 兄弟沿 x 轴排布，间距 = `rowHeight` 与相邻节点半宽之和的较大者（防横向矩形叠边）
- 直角折线转为**垂直-水平-垂直**；+/− 徽标置于节点上（上半区）/ 下（下半区）外侧；聚合箭头 `↑ 展开 (N)` / `展开 (N) ↓`

```ts
createBidirectionalTree(el, { data, orientation: 'vertical' })
```

::: tip 参数语义对调
垂直模式下 `rowHeight` 表示**兄弟水平间距**、`columnGap` 表示**深度行距**（与水平模式相对）。
:::

## 运行时切换

core 的 `orientation` 为实例级配置——切换即重建实例（demo 的「垂直布局」按钮即 `destroy()` 后重建并 `zoomToFit()`）。Vue / React 组件修改 `orientation` prop 会自动重建。
