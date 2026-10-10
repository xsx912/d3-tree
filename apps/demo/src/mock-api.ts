import type { TreeNodeData } from '@d3-tree/core'

/**
 * Mock 远程接口：模拟"懒加载下一级"的后端服务。
 *
 * 语义对齐 core 的 loadChildren 缝，两个触发时机都会打到这个接口：
 * ① 点击「展开 (N)」聚合节点（本地子节点超限聚合时）；
 * ② 点击带 hasChildren 标记的节点展开（本地无 children，需判断后请求）。
 *
 * 返回的远程节点仅携带 hasChildren 标记、不携带真实子级——是否真的有下一级
 * 由再次点击时的接口结果决定；到达 MOCK_MAX_DEPTH 后返回空数组，节点退化为
 * 末级叶子（hasChildren 标记被清除，徽标消失）。
 */

/** 每次请求返回的子节点数 */
const FANOUT = 6
/** 最大层级（根为 L0），达到后接口返回空数组 */
export const MOCK_MAX_DEPTH = 5

/** 层级登记表：生成时写入，loader 据此判断是否已到末级 */
const depthOf = new WeakMap<TreeNodeData, number>()
/** 每个父节点的请求批次号（同父节点多次加载时生成不同的 id） */
const batchSeq = new Map<string, number>()

function section(id: string, name: string, childNames: string[]): TreeNodeData {
  return {
    id,
    name,
    properties: { 来源: '本地初始数据', 层级: 'L1' },
    children: childNames.map((childName, i) => {
      const child: TreeNodeData = {
        id: `${id}-${i + 1}`,
        name: childName,
        hasChildren: true, // 本地无 children：点击展开时经 Mock 接口拉取下一级
      }
      depthOf.set(child, 2)
      return child
    }),
  }
}

/** 懒加载示例的初始数据：只有两级，更深的层级全部来自 Mock 接口 */
export const lazyOrgData: TreeNodeData = (() => {
  const root: TreeNodeData = {
    id: 'hq',
    name: '集团总部',
    properties: { 说明: '点击节点展开/收起：无下一级时自动请求 Mock 接口' },
    children: [
      section('east', '华东分公司', [
        '市场营销中心',
        '客户成功部',
        '解决方案部',
        '交付实施部',
        '生态合作部',
        '渠道管理部',
        '商务投标部',
        '行政支持部',
      ]),
      section('south', '华南分公司', [
        '市场拓展部',
        '大客户部',
        '售前技术部',
        '实施交付部',
        '运维服务部',
        '培训认证部',
        '供应链部',
        '财务共享部',
      ]),
      section('lab', '创新研究院', [
        '架构研究组',
        '算法研究组',
        '数据平台组',
        '安全实验室',
        'IoT 实验室',
        '仿真推演组',
        '标准与专利组',
        '前沿探索组',
      ]),
    ],
  }
  depthOf.set(root, 0)
  for (const child of root.children ?? []) depthOf.set(child, 1)
  return root
})()

/** 模拟接口：返回 parent 的下一级子节点（仅带 hasChildren 标记，不携带孙级） */
export function mockFetchChildren(parent: TreeNodeData): Promise<TreeNodeData[]> {
  const latency = 400 + Math.random() * 500
  const depth = depthOf.get(parent) ?? 0
  return new Promise(resolve => {
    setTimeout(() => {
      if (depth >= MOCK_MAX_DEPTH) {
        resolve([])
        return
      }
      const seq = (batchSeq.get(parent.id) ?? 0) + 1
      batchSeq.set(parent.id, seq)
      const hasDeeper = depth + 1 < MOCK_MAX_DEPTH
      resolve(
        Array.from({ length: FANOUT }, (_, i) => {
          const node: TreeNodeData = {
            id: `${parent.id}~r${seq}n${i + 1}`,
            name: `远程节点 ${depth + 1}-${seq}.${i + 1}`,
            properties: {
              来源: 'Mock API',
              层级: `L${depth + 1}`,
              接口延迟: `${Math.round(latency)}ms`,
            },
            hasChildren: hasDeeper,
          }
          depthOf.set(node, depth + 1)
          return node
        }),
      )
    }, latency)
  })
}
