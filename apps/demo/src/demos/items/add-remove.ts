import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeNodeData, TreeOptions } from '@d3-tree/core'
import { industryData } from '../../data'
import type { DemoItem } from '../types'

export const addRemove: DemoItem = {
  id: 'add-remove',
  title: '动态增删节点',
  desc: 'addChild(parentId, node) 追加（折叠的父节点自动展开，让新节点立即可见）、removeChild(id) 删除子树（根不可删）。选取模式下置 toggleOnNodeClick:false，点击只选取不折叠。',
  setup({ canvas, overlay, setHint }) {
    // 本示例会改数据，用拷贝避免污染其他示例
    const options: TreeOptions = { data: structuredClone(industryData), colorByGroup: true }
    const tree = createBidirectionalTree(canvas, options)
    tree.zoomToFit()
    setHint('选择模式后点击目标节点')

    type Mode = 'none' | 'add' | 'remove'
    let mode: Mode = 'none'
    let picked: TreeNodeData | null = null
    let seq = 0

    const input = document.createElement('input')
    input.placeholder = '新节点名称'
    input.hidden = true
    const confirmBtn = document.createElement('button')
    confirmBtn.textContent = '确认追加'
    confirmBtn.className = 'primary'
    confirmBtn.hidden = true
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = '取消'
    cancelBtn.hidden = true
    overlay.append(input, confirmBtn, cancelBtn)

    const setMode = (next: Mode): void => {
      mode = next
      picked = null
      // core 在点击时实时读该开关，无需重建实例
      options.toggleOnNodeClick = next === 'none'
      input.hidden = next !== 'add'
      confirmBtn.hidden = next !== 'add'
      cancelBtn.hidden = next === 'none'
      setHint(next === 'none' ? '选择模式后点击目标节点' : '选取模式：请点击目标节点')
    }

    options.onNodeSelect = (node: TreeNodeData): void => {
      if (mode === 'none') return
      picked = node
      setHint(
        mode === 'add'
          ? `已选父节点「${node.name}」，输入名称后确认`
          : `已选节点「${node.name}」，再次点击“删除节点”确认`,
      )
    }

    const pickBtn = document.createElement('button')
    const removeBtn = document.createElement('button')
    pickBtn.textContent = '追加子节点'
    pickBtn.onclick = () => setMode('add')
    removeBtn.textContent = '删除节点'
    removeBtn.onclick = () => {
      if (mode === 'remove' && picked) {
        setHint(
          tree.removeChild(picked.id) ? `已删除「${picked.name}」` : '该节点不可删除（根节点）',
        )
        setMode('none')
        return
      }
      setMode('remove')
    }
    cancelBtn.onclick = () => setMode('none')
    confirmBtn.onclick = () => {
      const name = input.value.trim()
      if (!picked || !name) {
        setHint('请先选取父节点并输入名称')
        return
      }
      const ok = tree.addChild(picked.id, { id: `custom-${Date.now()}-${seq++}`, name })
      setHint(ok ? `已在「${picked.name}」下追加「${name}」` : '追加失败：父节点不存在')
      input.value = ''
      setMode('none')
    }
    input.addEventListener('keydown', e => e.key === 'Enter' && confirmBtn.click())
    overlay.prepend(removeBtn, pickBtn)

    return () => tree.destroy()
  },
}
