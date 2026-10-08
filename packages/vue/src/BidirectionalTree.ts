import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { createBidirectionalTree } from '@d3-tree/core'
import type {
  ExportImageOptions,
  LinkStyle,
  NodeRenderer,
  Orientation,
  NodeSizeFn,
  NodeTemplate,
  Side,
  TextMeasurer,
  TreeInstance,
  TreeNodeData,
  TreeOptions,
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
 */
export const BidirectionalTree = defineComponent({
  name: 'BidirectionalTree',
  props: {
    data: { type: Object as PropType<TreeNodeData>, required: true },
    duration: { type: Number, default: undefined },
    rowHeight: { type: Number, default: undefined },
    columnGap: { type: Number, default: undefined },
    visibleChildrenLimit: { type: Number, default: undefined },
    linkStyle: { type: String as PropType<LinkStyle>, default: undefined },
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
      type: Function as PropType<(node: TreeNodeData) => string>,
      default: undefined,
    },
    loadChildren: {
      type: Function as PropType<(parent: TreeNodeData) => Promise<TreeNodeData[]>>,
      default: undefined,
    },
    measureText: { type: Function as PropType<TextMeasurer>, default: undefined },
  },
  emits: ['node-click', 'node-toggle', 'node-select', 'groups-change'],
  setup(props, { emit, expose }) {
    const host = ref<HTMLDivElement>()
    let chart: TreeInstance | null = null
    let currentOptions: TreeOptions | null = null
    let toggleFlag = props.toggleOnNodeClick !== false

    function create(): void {
      if (!host.value) return
      currentOptions = {
        data: props.data,
        duration: props.duration,
        rowHeight: props.rowHeight,
        columnGap: props.columnGap,
        visibleChildrenLimit: props.visibleChildrenLimit,
        linkStyle: props.linkStyle,
        orientation: props.orientation,
        colorByGroup: props.colorByGroup,
        nodeSize: props.nodeSize ?? undefined,
        nodeRenderer: props.nodeRenderer ?? undefined,
        nodeTemplate: props.nodeTemplate ?? undefined,
        nodeColor: props.nodeColor ?? undefined,
        tooltip: props.tooltipFormatter ? { formatter: props.tooltipFormatter } : undefined,
        loadChildren: props.loadChildren ?? undefined,
        measureText: props.measureText,
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
        props.rowHeight,
        props.columnGap,
        props.visibleChildrenLimit,
        props.linkStyle,
        props.orientation,
        props.colorByGroup,
        props.nodeColor,
        props.nodeSize,
        props.nodeRenderer,
        props.nodeTemplate,
        props.tooltipFormatter,
        props.loadChildren,
        props.measureText,
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
        class: 'd3t-host',
        style: { width: '100%', height: '100%' },
      })
  },
})
