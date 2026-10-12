import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
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
  /** 自定义悬浮框内容：返回 HTML 字符串或 DOM 元素（可承载组件宿主） */
  tooltipFormatter?: (node: TreeNodeData, ctx: TooltipContext) => string | HTMLElement
  /**
   * 悬浮框内容 render-prop：返回 ReactNode。封装层托管常驻 createRoot（单实例：
   * hover 只重渲染不重挂载，移出仅隐藏）。保持返回树的根组件类型稳定以复用实例；
   * 函数身份变化会销毁重建整树（建议 useCallback）。异步拉取/缓存放组件内
   * useEffect(node) 实现。
   */
  renderTooltip?: (node: TreeNodeData, ctx: TooltipContext) => ReactNode
  /** 追加到悬浮层的 class（内置外壳保留） */
  tooltipClassName?: string
  /**
   * 是否缓存悬浮框内容组件实例（renderTooltip 模式）：默认 true 单实例常驻复用
   * （hover 只重渲染，移出仅隐藏）；false 每次悬停全新挂载、隐藏即卸载——
   * 组件状态不跨悬停留、effect cleanup 即时触发。
   */
  tooltipCache?: boolean
  /** 移入节点后的显示延时（毫秒，默认 0 即刻显示）：悬停停留才出现，扫过节点不弹窗 */
  tooltipShowDelay?: number
  /** 移出节点/弹窗后的防抖隐藏延时（毫秒，默认 150）：期间移入弹窗取消隐藏；0 移出即藏 */
  tooltipHideDelay?: number
  /** 悬浮框显示/隐藏淡入淡出时长（毫秒，默认 150，0 关闭过渡）；"减少动态效果"偏好下默认关闭 */
  tooltipFadeDuration?: number
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
  /**
   * 悬停事件缝（自接管悬浮框）：配置后内置悬浮框整体停用，悬停/移出改由
   * 这两个回调通知（ctx 含节点元素引用与 aggregate 标记），完全自行渲染定位。
   * 移出立即触发、换节点直切只发新 hover、重渲染时触发 end、destroy 不触发。
   */
  onNodeHover?: (node: TreeNodeData, ctx: TooltipContext) => void
  /** 悬停移出回调（自接管模式）：参数为最后悬停的节点 */
  onNodeHoverEnd?: (node: TreeNodeData) => void
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
    // 悬浮内容的常驻宿主（renderTooltip 用）：createRoot 单实例，hover 只重渲染
    const tooltipLayerRef = useRef<{ host: HTMLDivElement; root: Root } | null>(null)
    // 卸载悬浮内容（幂等）：关闭实例缓存时的隐藏卸载；不缓存模式下 show 前清场
    const unmountTooltipLayer = (): void => {
      if (tooltipLayerRef.current) {
        tooltipLayerRef.current.root.unmount()
        tooltipLayerRef.current = null
      }
    }
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
      renderTooltip,
      tooltipClassName,
      tooltipCache,
      tooltipShowDelay,
      tooltipHideDelay,
      tooltipFadeDuration,
      loadChildren,
      toggleOnNodeClick,
      onNodeHover,
      onNodeHoverEnd,
      measureText,
      theme: themeOverride,
      texts,
    } = props
    useEffect(() => {
      if (!hostRef.current) return
      // 任一悬浮框定制项存在即组装配置对象（延时/时长不影响内容，也允许单独配置）
      const hasTooltipConfig = !!(
        renderTooltip || tooltipFormatter || tooltipClassName
        || tooltipShowDelay !== undefined
        || tooltipHideDelay !== undefined || tooltipFadeDuration !== undefined
      )
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
        // 自接管模式（onNodeHover）优先：配置即停用内置悬浮框（含 renderTooltip）
        tooltip: hasTooltipConfig && !onNodeHover
            ? {
                // render-prop 优先于 tooltipFormatter（更富的表达）
                formatter: renderTooltip
                  ? (node, ctx) => {
                      // 关闭缓存：卸载旧 root（幂等；换节点直切时也保证全新挂载）
                      if (tooltipCache === false) unmountTooltipLayer()
                      // 常驻宿主 + createRoot：hover 只重渲染（root 类型稳定即复用实例）
                      let layer = tooltipLayerRef.current
                      if (!layer) {
                        const host = document.createElement('div')
                        layer = { host, root: createRoot(host) }
                        tooltipLayerRef.current = layer
                      }
                      layer.root.render(renderTooltip(node, ctx))
                      return layer.host
                    }
                  : tooltipFormatter ?? undefined,
                className: tooltipClassName ?? undefined,
                showDelay: tooltipShowDelay ?? undefined,
                hideDelay: tooltipHideDelay ?? undefined,
                fadeDuration: tooltipFadeDuration ?? undefined,
                // 关闭实例缓存：隐藏即卸载内容组件
                onTooltipHide:
                  renderTooltip && tooltipCache === false ? unmountTooltipLayer : undefined,
              }
            : undefined,
        loadChildren,
        onLoadError: (error, parent) => propsRef.current.onLoadError?.(error, parent),
        toggleOnNodeClick,
        measureText,
        theme: themeOverride,
        texts,
        onNodeClick: node => propsRef.current.onNodeClick?.(node),
        onNodeToggle: (node, collapsed) => propsRef.current.onNodeToggle?.(node, collapsed),
        onNodeSelect: node => propsRef.current.onNodeSelect?.(node),
        // 悬停事件缝（自接管）：仅当调用端传入时启用（配置即停用内置悬浮框），
        // 不能恒传包装函数——core 以 onNodeHover 是否存在判定模式
        onNodeHover: onNodeHover
          ? (node, ctx) => propsRef.current.onNodeHover?.(node, ctx)
          : undefined,
        onNodeHoverEnd: onNodeHoverEnd
          ? (node) => propsRef.current.onNodeHoverEnd?.(node)
          : undefined,
        onGroupsChange: groups => propsRef.current.onGroupsChange?.(groups),
      }
      optionsRef.current = options
      chartRef.current = createBidirectionalTree(hostRef.current, options)
      return () => {
        chartRef.current?.destroy()
        chartRef.current = null
        optionsRef.current = null
        // 卸载悬浮内容宿主（重建/组件卸载时；hover 路径不经过这里，实例常驻）
        if (tooltipLayerRef.current) {
          tooltipLayerRef.current.root.unmount()
          tooltipLayerRef.current = null
        }
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
      renderTooltip,
      tooltipClassName,
      tooltipCache,
      tooltipShowDelay,
      tooltipHideDelay,
      tooltipFadeDuration,
      onNodeHover,
      onNodeHoverEnd,
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
