import { createBidirectionalTree } from '@d3-tree/core'
import type { TreeInstance, TreeNodeData } from '@d3-tree/core'
import { industryData } from './data'

const container = document.querySelector<HTMLDivElement>('#chart')
if (!container) throw new Error('#chart 容器不存在')

type PickMode = 'none' | 'add' | 'remove'
let mode: PickMode = 'none'
let picked: TreeNodeData | null = null
let seq = 0

const hint = document.querySelector<HTMLSpanElement>('#hint')!
const nameInput = document.querySelector<HTMLInputElement>('#node-name')!
const confirmBtn = document.querySelector<HTMLButtonElement>('#btn-confirm')!
const cancelBtn = document.querySelector<HTMLButtonElement>('#btn-cancel')!
const addBtn = document.querySelector<HTMLButtonElement>('#btn-add')!
const removeBtn = document.querySelector<HTMLButtonElement>('#btn-remove')!

const defaultHint = '点击节点可折叠/展开；滚轮缩放、拖拽平移'
const legendEl = document.querySelector<HTMLDivElement>('#legend')!
const activeGroups = new Set<string>()

const options = {
  data: industryData,
  colorByGroup: true,
  onNodeSelect: (node: TreeNodeData) => onNodePicked(node),
  onGroupsChange: (groups: Array<{ name: string; color: string }>) => {
    legendEl.innerHTML = ''
    for (const { name, color } of groups) {
      activeGroups.add(name)
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.innerHTML = `<span class="dot" style="background:${color}"></span>${name}`
      chip.addEventListener('click', () => {
        if (activeGroups.has(name)) {
          activeGroups.delete(name)
          chip.classList.add('off')
        } else {
          activeGroups.add(name)
          chip.classList.remove('off')
        }
        tree.setVisibleGroups(activeGroups.size ? [...activeGroups] : null)
      })
      legendEl.appendChild(chip)
    }
  },
}

const tree: TreeInstance = createBidirectionalTree(container, options)

function setMode(next: PickMode): void {
  mode = next
  picked = null
  const picking = next !== 'none'
  ;(options as { toggleOnNodeClick?: boolean }).toggleOnNodeClick = !picking
  nameInput.hidden = next !== 'add'
  confirmBtn.hidden = next !== 'add'
  cancelBtn.hidden = !picking
  addBtn.toggleAttribute('disabled', next === 'remove')
  removeBtn.toggleAttribute('disabled', next === 'add')
  hint.textContent = picking ? '选取模式：请点击目标节点' : defaultHint
  hint.classList.toggle('active', picking)
}

function onNodePicked(node: TreeNodeData): void {
  if (mode === 'none') return
  picked = node
  if (mode === 'add') {
    hint.textContent = `已选父节点「${node.name}」，输入名称后确认`
    nameInput.focus()
  } else {
    hint.textContent = `已选节点「${node.name}」，再次点击“删除节点”确认删除`
  }
}

function exitIfIdle(): boolean {
  if (mode === 'none') return true
  return false
}

addBtn.addEventListener('click', () => setMode('add'))
removeBtn.addEventListener('click', () => {
  if (mode === 'remove' && picked) {
    if (tree.removeChild(picked.id)) hint.textContent = `已删除「${picked.name}」`
    else hint.textContent = '该节点不可删除（根节点）'
    setMode('none')
    return
  }
  setMode('remove')
})
cancelBtn.addEventListener('click', () => setMode('none'))
confirmBtn.addEventListener('click', () => {
  if (exitIfIdle()) return
  const name = nameInput.value.trim()
  if (!picked || !name) {
    hint.textContent = '请先选取父节点并输入名称'
    return
  }
  const ok = tree.addChild(picked.id, { id: `custom-${Date.now()}-${seq++}`, name })
  hint.textContent = ok ? `已在「${picked.name}」下追加「${name}」` : '追加失败：父节点不存在'
  nameInput.value = ''
  setMode('none')
})
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmBtn.click()
})
const searchBox = document.querySelector<HTMLInputElement>('#search-box')!
searchBox.addEventListener('input', () => {
  const kw = searchBox.value.trim()
  if (!kw) {
    tree.clearSearch()
    hint.textContent = defaultHint
    return
  }
  const hits = tree.search(kw)
  hint.textContent = hits > 0 ? `「${kw}」命中 ${hits} 个节点` : `「${kw}」无命中`
})
document.querySelector<HTMLButtonElement>('#btn-export-svg')!.addEventListener('click', () => {
  tree.exportImage({ format: 'svg', filename: '产业链图谱' })
})
document.querySelector<HTMLButtonElement>('#btn-export-png')!.addEventListener('click', () => {
  tree.exportImage({ format: 'png', scale: 2, filename: '产业链图谱' })
})
document.querySelector<HTMLButtonElement>('#btn-expand')!.addEventListener('click', () => {
  tree.expandAll()
  tree.zoomToFit()
})
document.querySelector<HTMLButtonElement>('#btn-collapse')!.addEventListener('click', () => {
  tree.collapseAll()
  tree.zoomToFit()
})
document.querySelector<HTMLButtonElement>('#btn-fit')!.addEventListener('click', () => {
  tree.zoomToFit()
})
