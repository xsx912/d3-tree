# 产业链图谱 · 交互演示

下面是嵌入文档的**活组件**（非截图）——基于 `@d3-tree/vue` 的 `<BidirectionalTree>`，可以直接操作：

- 点击节点或 **+/−** 徽标折叠/展开（250ms 过渡，子树自点击处长出/回拢）
- 顶栏搜索（命中及祖先链高亮、其余淡化、自动定位）；图例芯片筛选分组
- 一键切换**垂直布局**（上下分侧）与**连线样式**（折线/直线/曲线）
- 滚轮缩放、拖拽平移、适配视窗、导出 PNG

<script setup>
import Playground from './Playground.vue'
</script>

<Playground />

::: tip 提示
超过 `visibleChildrenLimit`（默认 5）的子节点会聚合为「展开 (N)」，点击分批释放；悬停节点查看 tooltip 详情。
:::
