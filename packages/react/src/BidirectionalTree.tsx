import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { CSSProperties } from 'react'
import { createBidirectionalTree } from '@d3-tree/core'
import type {
  ExportImageOptions,
  LinkStyle,
  Side,
  TreeInstance,
  TreeNodeData,
  TreeOptions,
} from '@d3-tree/core'

export interface BidirectionalTreeProps {
  data: TreeNodeData
  duration?: number
  rowHeight?: number
  columnGap?: number
  visibleChildrenLimit?: number
  linkStyle?: LinkStyle
  colorByGroup?: boolean
  /** 点击节点本体是否触发折叠切换；选取/编辑模式可置 false */
  toggleOnNodeClick?: boolean
  nodeColor?: (node: TreeNodeData) => string | undefined
  tooltipFormatter?: (node: TreeNodeData) => string
  loadChildren?: (parent: TreeNodeData) => Promise<TreeNodeData[]>
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
      rowHeight,
      columnGap,
      visibleChildrenLimit,
      linkStyle,
      colorByGroup,
      nodeColor,
      tooltipFormatter,
      loadChildren,
      toggleOnNodeClick,
    } = props
    useEffect(() => {
      if (!hostRef.current) return
      const options: TreeOptions = {
        data: propsRef.current.data,
        duration,
        rowHeight,
        columnGap,
        visibleChildrenLimit,
        linkStyle,
        colorByGroup,
        nodeColor,
        tooltip: tooltipFormatter ? { formatter: tooltipFormatter } : undefined,
        loadChildren,
        toggleOnNodeClick,
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      duration,
      rowHeight,
      columnGap,
      visibleChildrenLimit,
      linkStyle,
      colorByGroup,
      nodeColor,
      tooltipFormatter,
      loadChildren,
      toggleOnNodeClick,
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
