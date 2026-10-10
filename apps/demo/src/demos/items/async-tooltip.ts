import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeInstance, TreeOptions } from '@d3-tree/core'
import { clearDetailCache, mockFetchNodeDetail } from '../../mock-api'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

const SIDE_NAMES: Record<string, string> = { left: '左侧', right: '右侧', center: '中枢' }

export const asyncTooltip: DemoItem = {
  id: 'async-tooltip',
  title: '异步数据悬浮卡（单实例）',
  desc: '悬浮框锚定节点（不再跟随光标）；内容为常驻单实例：悬停只换数据不重挂载。首次悬停经 Mock 接口拉取详情（骨架屏占位），过期响应按序号丢弃；同节点再次悬停命中缓存秒出。',
  setup({ canvas, overlay, setHint }) {
    // ---- 常驻单实例宿主：formatter 每次返回同一个 div，只更新内部内容 ----
    const host = document.createElement('div')
    host.style.cssText = 'min-width:220px;font-size:12px;line-height:1.9'
    // 过期守卫：慢请求回来时悬停已切到其他节点则丢弃（纯 core 无 AbortController 时的等价手法）
    let seq = 0

    function renderSkeleton(nodeName: string): void {
      host.innerHTML =
        `<div style="font-weight:600;margin-bottom:6px">${nodeName}</div>` +
        '<div style="color:#909399">详情加载中…</div>'
    }

    function renderDetail(nodeName: string, side: string, depth: number, detail: Record<string, string>): void {
      const rows = Object.entries(detail)
        .map(([k, v]) => `<div><span style="color:#909399">${k}：</span>${v}</div>`)
        .join('')
      host.innerHTML =
        `<div style="font-weight:600;border-bottom:1px solid #EBEEF5;padding-bottom:4px;margin-bottom:6px">${nodeName}</div>` +
        `<div style="color:#409EFF;margin-bottom:4px">L${depth} · ${side}</div>${rows}`
    }

    const options: TreeOptions = {
      data: industryData,
      colorByGroup: true,
      tooltip: {
        className: 'async-tip',
        formatter: (node, ctx) => {
          const mySeq = ++seq
          renderSkeleton(node.name)
          mockFetchNodeDetail(node).then(detail => {
            if (mySeq !== seq) return
            renderDetail(node.name, SIDE_NAMES[ctx.side] ?? ctx.side, ctx.depth, detail)
          })
          return host
        },
      },
    }
    const tree: TreeInstance = createBidirectionalTree(canvas, options)
    tree.zoomToFit()

    const btn = document.createElement('button')
    btn.textContent = '清空详情缓存'
    btn.onclick = () => {
      clearDetailCache()
      setHint('缓存已清空：再次悬停节点将重新走异步接口')
    }
    overlay.appendChild(btn)
    setHint('悬停节点查看异步悬浮卡；同节点第二次悬停命中缓存秒出')
    return () => tree.destroy()
  },
}
