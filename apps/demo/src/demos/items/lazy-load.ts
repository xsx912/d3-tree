import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeNodeData } from '@d3-tree/core'
import { lazyOrgData, mockFetchChildren } from '../../mock-api'
import type { DemoItem } from '../types'

export const lazyLoad: DemoItem = {
  id: 'lazy-load',
  title: '接口懒加载',
  desc: '节点标记 hasChildren 且本地无 children 时，点击展开触发 loadChildren 请求；本地已有下一级则纯本地切换不请求；返回空数组视为末级并清除标记。Mock 每次延迟 400~900ms、返回 6 个子节点。',
  setup({ canvas, overlay, setHint }) {
    let failMode = false
    let count = 0

    const label = document.createElement('label')
    label.className = 'tb-check'
    const check = document.createElement('input')
    check.type = 'checkbox'
    check.onchange = () => (failMode = check.checked)
    label.append(check, document.createTextNode('模拟接口失败'))

    const stat = document.createElement('span')
    stat.className = 'tb-stat'
    stat.textContent = 'Mock 请求：0 次'
    overlay.append(label, stat)

    const tree = createBidirectionalTree(canvas, {
      data: lazyOrgData,
      loadChildren: (parent: TreeNodeData) => {
        count += 1
        stat.textContent = `Mock 请求：${count} 次`
        setHint(`正在拉取「${parent.name}」的下一级…`)
        return failMode
          ? Promise.reject(new Error('模拟接口异常'))
          : mockFetchChildren(parent)
      },
      onLoadError: (_error, parent) => setHint(`「${parent.name}」拉取失败，可重试`),
      onNodeToggle: (node, collapsed) =>
        setHint(`「${node.name}」已${collapsed ? '折叠' : '展开'}`),
    })
    tree.zoomToFit()
    return () => tree.destroy()
  },
}
