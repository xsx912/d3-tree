import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type { BidirectionalTreeHandle, TreeNodeData } from '@d3-tree/react'
import { industryData } from '../data'

type PickMode = 'none' | 'add' | 'remove'

const DEFAULT_HINT = '点击节点可折叠/展开；滚轮缩放、拖拽平移'

export default function App() {
  const tree = useRef<BidirectionalTreeHandle | null>(null)
  const seq = useRef(0)

  const [mode, setMode] = useState<PickMode>('none')
  const [picked, setPicked] = useState<TreeNodeData | null>(null)
  const [newName, setNewName] = useState('')
  const [hint, setHint] = useState(DEFAULT_HINT)
  const [searchKw, setSearchKw] = useState('')
  const [groups, setGroups] = useState<Array<{ name: string; color: string }>>([])
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set())

  const enterMode = useCallback((next: PickMode) => {
    setMode(next)
    setPicked(null)
    tree.current?.setToggleOnNodeClick(next === 'none')
    setHint(next === 'none' ? DEFAULT_HINT : '选取模式：请点击目标节点')
  }, [])

  const onNodeSelect = useCallback(
    (node: TreeNodeData) => {
      if (mode === 'none') return
      setPicked(node)
      setHint(
        mode === 'add'
          ? `已选父节点「${node.name}」，输入名称后确认`
          : `已选节点「${node.name}」，再次点击“删除节点”确认删除`,
      )
    },
    [mode],
  )

  const confirmAdd = useCallback(() => {
    const name = newName.trim()
    if (!picked || !name) {
      setHint('请先选取父节点并输入名称')
      return
    }
    const ok = tree.current?.addChild(picked.id, {
      id: `custom-${Date.now()}-${seq.current++}`,
      name,
    })
    setHint(ok ? `已在「${picked.name}」下追加「${name}」` : '追加失败：父节点不存在')
    setNewName('')
    enterMode('none')
  }, [newName, picked, enterMode])

  const onRemove = useCallback(() => {
    if (mode === 'remove' && picked) {
      const ok = tree.current?.removeChild(picked.id)
      setHint(ok ? `已删除「${picked.name}」` : '该节点不可删除（根节点）')
      enterMode('none')
      return
    }
    enterMode('remove')
  }, [mode, picked, enterMode])

  const onSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const kw = e.target.value.trim()
    setSearchKw(e.target.value)
    if (!kw) {
      tree.current?.clearSearch()
      setHint(DEFAULT_HINT)
      return
    }
    const hits = tree.current?.search(kw) ?? 0
    setHint(hits > 0 ? `「${kw}」命中 ${hits} 个节点` : `「${kw}」无命中`)
  }, [])

  const onGroupsChange = useCallback((gs: Array<{ name: string; color: string }>) => {
    setGroups(gs)
    setActiveGroups(new Set(gs.map(g => g.name)))
  }, [])

  const toggleGroup = useCallback((name: string) => {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      tree.current?.setVisibleGroups(next.size ? [...next] : null)
      return next
    })
  }, [])

  return (
    <>
      <header>
        <h1>双向树图谱 · React 组件</h1>
        <nav>
          <a href="/index.html">原生</a>
          <a href="/vue.html">Vue</a>
          <a href="/react.html">React</a>
          <a href="/custom.html">自定义</a>
        </nav>
      </header>
      <div id="toolbar">
        <button onClick={() => enterMode('add')}>追加子节点</button>
        {mode === 'add' && (
          <>
            <input
              value={newName}
              placeholder="新节点名称"
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmAdd()}
            />
            <button className="primary" onClick={confirmAdd}>
              确认追加
            </button>
          </>
        )}
        {mode !== 'none' && <button onClick={() => enterMode('none')}>取消</button>}
        <button disabled={mode === 'add'} onClick={onRemove}>
          删除节点
        </button>
        <span className="divider" />
        <input value={searchKw} placeholder="搜索节点…" onChange={onSearch} />
        <button
          onClick={() => tree.current?.exportImage({ format: 'svg', filename: '产业链图谱-React' })}
        >
          导出 SVG
        </button>
        <button
          onClick={() =>
            tree.current?.exportImage({ format: 'png', scale: 2, filename: '产业链图谱-React' })
          }
        >
          导出 PNG
        </button>
        <span className="divider" />
        <button
          onClick={() => {
            tree.current?.expandAll()
            tree.current?.zoomToFit()
          }}
        >
          全展开
        </button>
        <button
          onClick={() => {
            tree.current?.collapseAll()
            tree.current?.zoomToFit()
          }}
        >
          全收起
        </button>
        <button onClick={() => tree.current?.zoomToFit()}>适配视窗</button>
        <span id="hint" className={mode !== 'none' ? 'active' : undefined}>
          {hint}
        </span>
        <div id="legend">
          {groups.map(g => (
            <span
              key={g.name}
              className={`chip${activeGroups.has(g.name) ? '' : ' off'}`}
              onClick={() => toggleGroup(g.name)}
            >
              <span className="dot" style={{ background: g.color }} />
              {g.name}
            </span>
          ))}
        </div>
      </div>
      <div id="chart">
        <BidirectionalTree
          ref={tree}
          data={industryData}
          colorByGroup
          onNodeSelect={onNodeSelect}
          onGroupsChange={onGroupsChange}
        />
      </div>
    </>
  )
}
