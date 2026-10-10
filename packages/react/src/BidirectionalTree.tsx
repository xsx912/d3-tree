import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { CSSProperties } from 'react'
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
  TreeInstance,
  TreeNodeData,
  TreeOptions,
  TreeTexts,
} from '@d3-tree/core'

export interface BidirectionalTreeProps {
  data: TreeNodeData
  duration?: number
  fadeOpacity?: number
  rowHeight?: number
  columnGap?: number
  visibleChildrenLimit?: number
  linkStyle?: LinkStyle
  linkColor?: LinkColor
  linkWidth?: number
  linkPathGenerator?: (link: LinkRenderContext) => string
  orientation?: Orientation
  colorByGroup?: boolean
  /** 点击节点本体是否触发折叠切换；选取/编辑模式可置 false */
  toggleOnNodeClick?: boolean
  nodeSize?: NodeSizeFn
  nodeRenderer?: NodeRenderer
  nodeTemplate?: NodeTemplate
  nodeColor?: (node: TreeNodeData) => string | undefined
  tooltipFormatter?: (node: TreeNodeData) => string
  loadChildren?: (parent: TreeNodeData) => Promise<TreeNodeData[]>
  onLoadError?: (error: unknown, parent: TreeNodeData) => void
  /** 主题定制：浅合并到内置主题 */
  theme?: Partial<Theme>
  /** 内置文案定制（聚合节点/徽标提示），用于国际化 */
  texts?: TreeTexts
  /** 文本度量注入（测试确定性） */
  measureText?: TextMeasurer
  onNodeClick?: (node: TreeNodeData) => void
  onNodeToggle?: (node: TreeNodeData, collapsed: boolean) => void
  onNodeSelect?: (node: TreeNodeData) => void
  onGroupsChange?: (groups: Array<{ name: string; color: string }>) => void
  className?: string
  style?: CSSProperties
}

/** 组件 ref 暴露的命令式 API（与 core 实例方法一一对应） */
export interface BidirectionalTreeHandle {
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
  setToggleOnNodeClick(enabled: boolean): void
}

/**
 * 双向树图谱 React 组件。
 *
 * ```tsx
 * <BidirectionalTree ref={tree} data={data} colorByGroup
 *   onNodeSelect={onSelect} onGroupsChange={onGroups} />
 * ```
 */
export const BidirectionalTree = forwardRef<BidirectionalTreeHandle, BidirectionalTreeProps>(
  function BidirectionalTree(props, ref) {
    const hostRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<TreeInstance | null>(null)
    const optionsRef = useRef<TreeOptions | null>(null)
    // 最新 props 引用：事件回调始终读到最新，避免因回调变化重建实例
    const propsRef = useRef(props)
    propsRef.current = props

    // 配置类 props（不含 data 与回调）变化时重建实例
    const {
      duration,
      fadeOpacity,
      rowHeight,
      columnGap,
      visibleChildrenLimit,
      linkStyle,
      linkColor,
      linkWidth,
      linkPathGenerator,
      orientation,
      colorByGroup,
      nodeSize,
      nodeRenderer,
      nodeTemplate,
      nodeColor,
      tooltipFormatter,
      loadChildren,
      toggleOnNodeClick,
      measureText,
      theme: themeOverride,
      texts,
    } = props
    useEffect(() => {
      if (!hostRef.current) return
      const options: TreeOptions = {
        data: propsRef.current.data,
        duration,
        fadeOpacity,
        rowHeight,
        columnGap,
        visibleChildrenLimit,
        linkStyle,
        linkColor,
        linkWidth,
        linkPathGenerator,
        orientation,
        colorByGroup,
        nodeSize,
        nodeRenderer,
        nodeTemplate,
        nodeColor,
        tooltip: tooltipFormatter ? { formatter: tooltipFormatter } : undefined,
        loadChildren,
        onLoadError: (error, parent) => propsRef.current.onLoadError?.(error, parent),
        toggleOnNodeClick,
        measureText,
        theme: themeOverride,
        texts,
        onNodeClick: node => propsRef.current.onNodeClick?.(node),
        onNodeToggle: (node, collapsed) => propsRef.current.onNodeToggle?.(node, collapsed),
        onNodeSelect: node => propsRef.current.onNodeSelect?.(node),
        onGroupsChange: groups => propsRef.current.onGroupsChange?.(groups),
      }
      optionsRef.current = options
      chartRef.current = createBidirectionalTree(hostRef.current, options)
      return () => {
        chartRef.current?.destroy()
        chartRef.current = null
        optionsRef.current = null
      }
      // data 走独立 effect，事件回调经 propsRef 读最新闭包
    }, [
      duration,
      fadeOpacity,
      rowHeight,
      columnGap,
      visibleChildrenLimit,
      linkStyle,
      linkColor,
      linkWidth,
      linkPathGenerator,
      orientation,
      colorByGroup,
      nodeSize,
      nodeRenderer,
      nodeTemplate,
      nodeColor,
      tooltipFormatter,
      loadChildren,
      toggleOnNodeClick,
      measureText,
      themeOverride,
      texts,
    ])

    // data 变化 → setData（保持实例与折叠/搜索状态语义由 core 处理）
    const data = props.data
    const firstData = useRef(true)
    useEffect(() => {
      if (firstData.current) {
        firstData.current = false
        return
      }
      chartRef.current?.setData(data)
    }, [data])

    useImperativeHandle(
      ref,
      () => ({
        toggle: id => chartRef.current?.toggle(id),
        expandAll: () => chartRef.current?.expandAll(),
        collapseAll: () => chartRef.current?.collapseAll(),
        addChild: (parentId, node, side) =>
          chartRef.current?.addChild(parentId, node, side) ?? false,
        removeChild: id => chartRef.current?.removeChild(id) ?? false,
        zoomToFit: () => chartRef.current?.zoomToFit(),
        setVisibleGroups: groups => chartRef.current?.setVisibleGroups(groups),
        search: keyword => chartRef.current?.search(keyword) ?? 0,
        clearSearch: () => chartRef.current?.clearSearch(),
        exportImage: options => chartRef.current?.exportImage(options) ?? Promise.resolve(),
        setToggleOnNodeClick: enabled => {
          if (optionsRef.current) optionsRef.current.toggleOnNodeClick = enabled
        },
      }),
      [],
    )

    return (
      <div
        ref={hostRef}
        className={props.className}
        style={{ width: '100%', height: '100%', ...props.style }}
      />
    )
  },
)
