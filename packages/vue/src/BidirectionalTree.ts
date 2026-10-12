import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  render,
  watch,
} from 'vue'
import type { PropType, StyleValue } from 'vue'
import { createBidirectionalTree } from '@d3-tree/core'
import type {
  ExportImageOptions,
  LinkColor,
  LinkRenderContext,
  LinkStyle,
  NodeRenderer,
  Orientation,
  NodeSizeFn,
  NodeTemplate,
  Side,
  TextMeasurer,
  Theme,
  TooltipContext,
  TreeInstance,
  TreeNodeData,
  TreeOptions,
  TreeTexts,
} from '@d3-tree/core'

/** 组件模板 ref 暴露的命令式 API（与 core 实例方法一一对应） */
export interface BidirectionalTreeExposed {
  toggle(id: string): void
  expandAll(): void
  collapseAll(): void
  addChild(parentId: string, node: TreeNodeData, side?: Side): boolean
  removeChild(id: string): boolean
  zoomToFit(): void
  setVisibleGroups(groups: string[] | null): void
  search(keyword: string): number
  clearSearch(): void
  exportImage(options?: ExportImageOptions): Promise<void>
  /** 选取/编辑模式：点击节点是否仍触发折叠 */
  setToggleOnNodeClick(enabled: boolean): void
}

/**
 * 双向树图谱 Vue 3 组件。
 *
 * ```vue
 * <BidirectionalTree ref="tree" :data="data" color-by-group
 *   @node-click="onClick" @groups-change="onGroups" />
 * ```
 *
 * 悬浮框内容可用 `#tooltip` 作用域插槽（`{ node, ctx }`）自定义：封装层托管
 * 单实例宿主（常驻挂载、hover 只更新 props、移出仅隐藏不卸载），插槽内可直接
 * 发请求/起定时器（异步拉取 + 缓存建议放在插槽根组件里 watch node 实现）。
 *
 * ```vue
 * <BidirectionalTree :data="data">
 *   <template #tooltip="{ node, ctx }">
 *     <NodeCard :node="node" :ctx="ctx" />
 *   </template>
 * </BidirectionalTree>
 * ```
 */
export const BidirectionalTree = defineComponent({
  name: 'BidirectionalTree',
  props: {
    data: { type: Object as PropType<TreeNodeData>, required: true },
    duration: { type: Number, default: undefined },
    fadeOpacity: { type: Number, default: undefined },
    rowHeight: { type: Number, default: undefined },
    columnGap: { type: Number, default: undefined },
    visibleChildrenLimit: { type: Number, default: undefined },
    linkStyle: { type: String as PropType<LinkStyle>, default: undefined },
    linkColor: {
      type: [String, Function] as PropType<LinkColor>,
      default: undefined,
    },
    linkWidth: { type: Number, default: undefined },
    linkPathGenerator: {
      type: Function as PropType<(link: LinkRenderContext) => string>,
      default: undefined,
    },
    orientation: { type: String as PropType<Orientation>, default: undefined },
    colorByGroup: { type: Boolean, default: false },
    toggleOnNodeClick: { type: Boolean, default: true },
    nodeSize: { type: Function as PropType<NodeSizeFn>, default: undefined },
    nodeRenderer: { type: Function as PropType<NodeRenderer>, default: undefined },
    nodeTemplate: { type: Function as PropType<NodeTemplate>, default: undefined },
    nodeColor: {
      type: Function as PropType<(node: TreeNodeData) => string | undefined>,
      default: undefined,
    },
    tooltipFormatter: {
      type: Function as PropType<(node: TreeNodeData, ctx: TooltipContext) => string | HTMLElement>,
      default: undefined,
    },
    tooltipClassName: { type: String, default: undefined },
    /**
     * 是否缓存悬浮框内容组件实例（#tooltip 插槽模式）：默认 true 单实例常驻复用
     * （hover 只更新 props，移出仅隐藏）；false 每次悬停全新挂载、隐藏即卸载——
     * 组件状态不跨悬停留、onUnmounted 即时触发。
     */
    tooltipCache: { type: Boolean, default: true },
    /** 移出节点/弹窗后的防抖隐藏延时（毫秒，默认 150）：期间移入弹窗取消隐藏；0 移出即藏 */
    tooltipHideDelay: { type: Number, default: undefined },
    /** 悬浮框显示/隐藏淡入淡出时长（毫秒，默认 150，0 关闭过渡）；"减少动态效果"偏好下默认关闭 */
    tooltipFadeDuration: { type: Number, default: undefined },
    loadChildren: {
      type: Function as PropType<(parent: TreeNodeData) => Promise<TreeNodeData[]>>,
      default: undefined,
    },
    onLoadError: {
      type: Function as PropType<(error: unknown, parent: TreeNodeData) => void>,
      default: undefined,
    },
    /** 主题定制：浅合并到内置主题 */
    theme: { type: Object as PropType<Partial<Theme>>, default: undefined },
    /** 内置文案定制（聚合节点/徽标提示），用于国际化 */
    texts: { type: Object as PropType<TreeTexts>, default: undefined },
    measureText: { type: Function as PropType<TextMeasurer>, default: undefined },
    /** 透传到宿主容器的类名与样式 */
    className: { type: String, default: undefined },
    style: { type: [String, Object, Array] as PropType<StyleValue>, default: undefined },
  },
  emits: ['node-click', 'node-toggle', 'node-select', 'groups-change', 'load-error'],
  setup(props, { emit, expose, slots }) {
    const host = ref<HTMLDivElement>()
    let chart: TreeInstance | null = null
    let currentOptions: TreeOptions | null = null
    let toggleFlag = props.toggleOnNodeClick !== false

    // ---- #tooltip 作用域插槽：单实例宿主（常驻挂载，hover 只换 props，移出仅隐藏不卸载） ----
    const instance = getCurrentInstance()
    let tooltipHostEl: HTMLDivElement | null = null
    // 根组件类型恒定：render() 再次调用走 patch，插槽内容所在实例不重挂载；
    // 每次渲染动态读 slots.tooltip（父组件更新插槽后闭包不持旧函数）
    const TooltipSlotHost = defineComponent({
      props: {
        node: { type: Object as PropType<TreeNodeData>, required: true },
        ctx: { type: Object as PropType<TooltipContext>, required: true },
      },
      render() {
        return (
          slots.tooltip as (props: { node: TreeNodeData; ctx: TooltipContext }) => unknown[]
        )({ node: this.node, ctx: this.ctx })
      },
    })

    /** 卸载插槽内容（幂等）：关闭实例缓存时的隐藏卸载；不缓存模式下 show 前清场 */
    function unmountTooltipSlot(): void {
      if (tooltipHostEl) render(null, tooltipHostEl)
    }

    function renderTooltipSlot(node: TreeNodeData, ctx: TooltipContext): HTMLElement {
      if (!tooltipHostEl) tooltipHostEl = document.createElement('div')
      // 不缓存：先卸载旧实例（幂等；换节点直切时也保证全新挂载）
      if (props.tooltipCache === false) unmountTooltipSlot()
      const vnode = h(TooltipSlotHost, { node, ctx })
      // 命令式 render 脱离父组件树：携带 appContext 保留 provide/inject 与全局注册
      if (instance) vnode.appContext = instance.appContext
      render(vnode, tooltipHostEl)
      return tooltipHostEl
    }

    function create(): void {
      if (!host.value) return
      // 任一悬浮框定制项存在即组装配置对象（延时/时长不影响内容，也允许单独配置）
      const hasTooltipConfig = !!(
        slots.tooltip || props.tooltipFormatter || props.tooltipClassName
        || props.tooltipHideDelay !== undefined || props.tooltipFadeDuration !== undefined
      )
      currentOptions = {
        data: props.data,
        duration: props.duration,
        fadeOpacity: props.fadeOpacity,
        rowHeight: props.rowHeight,
        columnGap: props.columnGap,
        visibleChildrenLimit: props.visibleChildrenLimit,
        linkStyle: props.linkStyle,
        linkColor: props.linkColor ?? undefined,
        linkWidth: props.linkWidth,
        linkPathGenerator: props.linkPathGenerator ?? undefined,
        orientation: props.orientation,
        colorByGroup: props.colorByGroup,
        nodeSize: props.nodeSize ?? undefined,
        nodeRenderer: props.nodeRenderer ?? undefined,
        nodeTemplate: props.nodeTemplate ?? undefined,
        nodeColor: props.nodeColor ?? undefined,
        tooltip: hasTooltipConfig
          ? {
              // 插槽优先于 tooltipFormatter（更富的表达）；两者都返回元素给 core 挂载
              formatter: slots.tooltip ? renderTooltipSlot : props.tooltipFormatter ?? undefined,
              className: props.tooltipClassName ?? undefined,
              hideDelay: props.tooltipHideDelay ?? undefined,
              fadeDuration: props.tooltipFadeDuration ?? undefined,
              // 关闭实例缓存：隐藏即卸载插槽内容（换节点直切由 formatter 内先卸载保证）
              onTooltipHide:
                slots.tooltip && props.tooltipCache === false ? unmountTooltipSlot : undefined,
            }
          : undefined,
        loadChildren: props.loadChildren ?? undefined,
        onLoadError: (error, parent) => emit('load-error', error, parent),
        measureText: props.measureText,
        theme: props.theme ?? undefined,
        texts: props.texts ?? undefined,
        toggleOnNodeClick: toggleFlag,
        onNodeClick: node => emit('node-click', node),
        onNodeToggle: (node, collapsed) => emit('node-toggle', node, collapsed),
        onNodeSelect: node => emit('node-select', node),
        onGroupsChange: groups => emit('groups-change', groups),
      }
      chart = createBidirectionalTree(host.value, currentOptions)
    }

    function destroy(): void {
      chart?.destroy()
      chart = null
      currentOptions = null
      // 卸载插槽宿主（重建/组件销毁时；hover 路径不经过这里，实例常驻）
      if (tooltipHostEl) {
        render(null, tooltipHostEl)
        tooltipHostEl = null
      }
    }

    onMounted(create)
    onBeforeUnmount(destroy)

    // data 原地替换走 setData（保持动画与折叠状态语义由 core 处理）
    watch(
      () => props.data,
      data => {
        if (data) chart?.setData(data)
      },
    )

    // 交互开关热更新（不重建实例）
    watch(
      () => props.toggleOnNodeClick,
      v => {
        toggleFlag = v !== false
        if (currentOptions) currentOptions.toggleOnNodeClick = toggleFlag
      },
    )

    // 其余配置变化重建实例
    watch(
      () => [
        props.duration,
        props.fadeOpacity,
        props.rowHeight,
        props.columnGap,
        props.visibleChildrenLimit,
        props.linkStyle,
        props.linkColor,
        props.linkWidth,
        props.linkPathGenerator,
        props.orientation,
        props.colorByGroup,
        props.nodeColor,
        props.nodeSize,
        props.nodeRenderer,
        props.nodeTemplate,
        props.tooltipFormatter,
        props.tooltipClassName,
        props.tooltipCache,
        props.tooltipHideDelay,
        props.tooltipFadeDuration,
        props.loadChildren,
        props.measureText,
        props.theme,
        props.texts,
      ],
      () => {
        destroy()
        create()
      },
    )

    const exposed: BidirectionalTreeExposed = {
      toggle: id => chart?.toggle(id),
      expandAll: () => chart?.expandAll(),
      collapseAll: () => chart?.collapseAll(),
      addChild: (parentId, node, side) => chart?.addChild(parentId, node, side) ?? false,
      removeChild: id => chart?.removeChild(id) ?? false,
      zoomToFit: () => chart?.zoomToFit(),
      setVisibleGroups: groups => chart?.setVisibleGroups(groups),
      search: keyword => chart?.search(keyword) ?? 0,
      clearSearch: () => chart?.clearSearch(),
      exportImage: options => chart?.exportImage(options) ?? Promise.resolve(),
      setToggleOnNodeClick: enabled => {
        toggleFlag = enabled
        if (currentOptions) currentOptions.toggleOnNodeClick = enabled
      },
    }
    expose(exposed)

    return () =>
      h('div', {
        ref: host,
        class: ['d3t-host', props.className],
        style: [{ width: '100%', height: '100%' }, props.style],
      })
  },
})
