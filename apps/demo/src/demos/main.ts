import './center.css'
import dataSrc from '../data.ts?raw'
import { allItems, categories } from './registry'
import { sources } from './sources'
import type { DemoItem, DemoStack } from './types'

const sidebar = document.querySelector<HTMLDivElement>('#sidebar')!
const canvas = document.querySelector<HTMLDivElement>('#canvas')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const hintEl = document.querySelector<HTMLDivElement>('#hint')!
const panel = document.querySelector<HTMLDivElement>('#panel')!
const panelTitle = document.querySelector<HTMLHeadingElement>('#panel-title')!
const panelDesc = document.querySelector<HTMLParagraphElement>('#panel-desc')!
const panelCode = document.querySelector<HTMLElement>('#panel-code code')!
const panelToggle = document.querySelector<HTMLButtonElement>('#panel-toggle')!
const fileTabs = document.querySelector<HTMLDivElement>('#file-tabs')!

let cleanup: (() => void) | null = null
let currentItem: DemoItem | null = null
/** 技术栈（面板头部切换）与当前查看的文件（代码块上方切换） */
let stack: DemoStack = 'html'
let showData = false

const MAIN_FILE: Record<DemoStack, string> = {
  html: 'BidirectionalTree.html',
  vue: 'BidirectionalTree.vue',
  react: 'BidirectionalTree.tsx',
}

function setHint(text: string): void {
  hintEl.textContent = text
  hintEl.hidden = !text
}

/** 代码块上方的文件按钮随技术栈变化：当前栈的主文件 + data.ts */
function renderFileTabs(): void {
  const main = document.createElement('button')
  main.textContent = MAIN_FILE[stack]
  main.classList.toggle('active', !showData)
  main.onclick = () => {
    showData = false
    renderFileTabs()
    renderCode()
  }
  const data = document.createElement('button')
  data.textContent = 'data.ts'
  data.classList.toggle('active', showData)
  data.onclick = () => {
    showData = true
    renderFileTabs()
    renderCode()
  }
  fileTabs.replaceChildren(main, data)
}

/** 按当前技术栈与文件填充源码：主文件与画布功能一一对应；data.ts 即示例引入数据的实际值 */
function renderCode(): void {
  if (!currentItem) return
  panelCode.textContent = showData ? dataSrc : (sources[currentItem.id]?.[stack] ?? '')
  panelCode.parentElement!.scrollTop = 0
}

/** 切换示例：清理上一个 → 清空画布/浮层 → 挂载 → 填充说明与源码 */
function select(id: string, pushHash = true): void {
  const item = allItems.find(i => i.id === id) ?? allItems[0]
  if (!item) return
  cleanup?.()
  cleanup = null
  canvas.innerHTML = ''
  overlay.innerHTML = ''
  overlay.hidden = true
  setHint('')

  cleanup = item.setup({ canvas, overlay, setHint })
  if (overlay.childElementCount > 0) overlay.hidden = false

  panelTitle.textContent = item.title
  panelDesc.textContent = item.desc
  currentItem = item
  renderCode()

  for (const btn of sidebar.querySelectorAll<HTMLButtonElement>('button[data-id]')) {
    btn.classList.toggle('active', btn.dataset.id === item.id)
  }
  if (pushHash && location.hash !== `#${item.id}`) {
    history.replaceState(null, '', `#${item.id}`)
  }
}

// ---- 左侧目录 ----
  for (const category of categories) {
  const group = document.createElement('div')
  group.className = 'cat'
  const label = document.createElement('div')
  label.className = 'cat-label'
  label.textContent = category.label
  group.appendChild(label)
  for (const item of category.entries) {
    const btn = document.createElement('button')
    btn.dataset.id = item.id
    btn.textContent = item.title
    btn.onclick = () => select(item.id)
    group.appendChild(btn)
  }
  sidebar.appendChild(group)
}

// ---- 源码面板折叠 ----
panelToggle.onclick = () => {
  const collapsed = document.body.classList.toggle('panel-collapsed')
  panelToggle.textContent = collapsed ? '‹ 源码' : '›'
}

// ---- 技术栈切换（面板头部）：联动下方文件按钮与代码 ----
const stackTabs = document.querySelectorAll<HTMLButtonElement>('#stack-tabs button')
stackTabs.forEach(btn => {
  btn.onclick = () => {
    stack = btn.dataset.stack as typeof stack
    stackTabs.forEach(b => {
      b.classList.toggle('active', b === btn)
      b.setAttribute('aria-selected', String(b === btn))
    })
    renderFileTabs()
    renderCode()
  }
})
renderFileTabs()

// ---- 源码面板拖拽调宽 ----
const panelDrag = document.querySelector<HTMLDivElement>('#panel-drag')!
let dragging = false
let dragStartX = 0
let dragStartWidth = 0
panelDrag.addEventListener('pointerdown', e => {
  dragging = true
  dragStartX = e.clientX
  dragStartWidth = panel.getBoundingClientRect().width
  panelDrag.classList.add('dragging')
  e.preventDefault()
})
window.addEventListener('pointermove', e => {
  if (!dragging) return
  // 面板在右侧，向左拖增大宽度
  const width = Math.min(720, Math.max(280, dragStartWidth + (dragStartX - e.clientX)))
  panel.style.width = `${width}px`
})
window.addEventListener('pointerup', () => {
  if (!dragging) return
  dragging = false
  panelDrag.classList.remove('dragging')
})
panelDrag.addEventListener('dblclick', () => {
  panel.style.width = ''
})

// ---- 复制源码 ----
document.querySelector<HTMLButtonElement>('#panel-copy')!.onclick = async () => {
  await navigator.clipboard.writeText(panelCode.textContent ?? '')
  const copyBtn = document.querySelector<HTMLButtonElement>('#panel-copy')!
  copyBtn.textContent = '已复制'
  setTimeout(() => (copyBtn.textContent = '复制'), 1200)
}

// ---- hash 深链 ----
const initial = location.hash.slice(1)
select(initial && allItems.some(i => i.id === initial) ? initial : 'horizontal', false)
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1)
  if (id && allItems.some(i => i.id === id)) select(id, false)
})
