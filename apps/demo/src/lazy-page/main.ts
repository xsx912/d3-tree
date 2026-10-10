import { createBidirectionalTree } from '@d3-tree/core'
import { lazyOrgData, mockFetchChildren } from '../mock-api'

const container = document.querySelector<HTMLDivElement>('#chart')
if (!container) throw new Error('#chart 容器不存在')

const hint = document.querySelector<HTMLSpanElement>('#hint')!
const reqCount = document.querySelector<HTMLSpanElement>('#req-count')!
const failToggle = document.querySelector<HTMLInputElement>('#fail-toggle')!

const defaultHint =
  '点击节点展开/收起：本地已有下一级则直接本地切换（不请求）；带 + 徽标且无下一级时自动请求 Mock 接口拉取（模拟 400~900ms 延迟，加载中节点呈虚线闪烁）'

let requestCount = 0

const tree = createBidirectionalTree(container, {
  data: lazyOrgData,
  // 业务只需提供 loadChildren 缝：聚合节点被点击时 core 自动转 loading 态并等待并入
  loadChildren: parent => {
    requestCount++
    reqCount.textContent = `Mock 请求：${requestCount} 次`
    hint.textContent = `正在从 Mock 接口拉取「${parent.name}」的下一级…`
    if (failToggle.checked) {
      return Promise.reject(new Error('模拟网络异常（HTTP 500）'))
    }
    return mockFetchChildren(parent).then(batch => {
      hint.textContent = batch.length
        ? `已为「${parent.name}」追加 ${batch.length} 个远程节点（每个自带一层可继续懒加载的明细）`
        : `「${parent.name}」已是末级，接口未返回更多节点`
      return batch
    })
  },
  onLoadError: (error, parent) => {
    hint.textContent = `加载失败：${(error as Error).message}（父节点「${parent.name}」）；取消勾选"模拟接口失败"后可重试`
  },
})

document.querySelector<HTMLButtonElement>('#btn-fit')!.addEventListener('click', () => {
  tree.zoomToFit()
})
