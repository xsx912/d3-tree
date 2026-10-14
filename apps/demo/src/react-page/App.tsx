import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { BidirectionalTree } from '@d3-tree/react'
import type {
  BidirectionalTreeHandle,
  TooltipContext,
  TreeNodeData,
} from '@d3-tree/react'
import { industryData } from '../data'

type PickMode = 'none' | 'add' | 'remove'

const DEFAULT_HINT = '点击节点可折叠/展开；滚轮缩放、拖拽平移'

const SIDE_NAMES: Record<string, string> = { left: '左侧', right: '右侧', center: '中枢' }

/** 悬浮卡内容组件：内部计数器用于验证缓存模式下组件状态是否跨悬停留 */
function TooltipCard({ node, ctx, onMount, onUnmount }: {
  node: TreeNodeData
  ctx: TooltipContext
  onMount: (name: string) => void
  onUnmount: (name: string) => void
}) {
  const [count, setCount] = useState(0)
  const nameRef = useRef(node.name)
  nameRef.current = node.name
  useEffect(() => {
    onMount(node.name)
    return () => onUnmount(nameRef.current)
    // 挂载/卸载严格对应 createRoot 新实例/unmount，不随节点切换重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div style={{ minWidth: 220 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{node.name}</div>
      <div style={{ color: '#409EFF', fontSize: 12, marginBottom: 8 }}>
        L{ctx.depth} · {SIDE_NAMES[ctx.side] ?? ctx.side} · {ctx.collapsed ? '已收起' : '展开中'}
      </div>
      <button
        style={{ fontSize: 12, padding: '2px 10px', cursor: 'pointer' }}
        onClick={() => setCount(c => c + 1)}
      >
        内部状态：{count}（点我 +1）
      </button>
    </div>
  )
}

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

  // ---- 悬浮框实例缓存验证（renderTooltip + tooltipCache 开关） ----
  const [tooltipCache, setTooltipCache] = useState(true)
  const [tipShowDelay, setTipShowDelay] = useState(300)
  const [tipHideDelay, setTipHideDelay] = useState(150)
  const [tipFadeDuration, setTipFadeDuration] = useState(150)
  const [tipMounts, setTipMounts] = useState(0)
  const [tipUnmounts, setTipUnmounts] = useState(0)
  const [tipLogs, setTipLogs] = useState<string[]>([])

  const pushTipLog = useCallback((msg: string) => {
    const t = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    setTipLogs(l => [...l, `${t} ${msg}`].slice(-6))
  }, [])

  const onTipMount = useCallback((name: string) => {
    setTipMounts(m => m + 1)
    pushTipLog(`挂载「${name}」`)
  }, [pushTipLog])

  const onTipUnmount = useCallback((name: string) => {
    setTipUnmounts(m => m + 1)
    pushTipLog(`卸载「${name}」`)
  }, [pushTipLog])

  const renderTooltip = useCallback(
    (node: TreeNodeData, ctx: TooltipContext) => (
      <TooltipCard node={node} ctx={ctx} onMount={onTipMount} onUnmount={onTipUnmount} />
    ),
    [onTipMount, onTipUnmount],
  )

  const toggleTipCache = useCallback(() => {
    const next = !tooltipCache
    setTooltipCache(next)
    pushTipLog(`实例缓存切换为「${next ? '开' : '关'}」，整树按配置重建`)
  }, [tooltipCache, pushTipLog])

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
          <a href="/index.html">示例中心</a>
          <a href="/vue.html">Vue</a>
          <a href="/react.html" className="active" aria-current="page">
            React
          </a>
        </nav>
      </header>
      <div id="toolbar">
        <div className="tb-group" role="group" aria-label="编辑">
          <span className="tb-label">编辑</span>
          <div className="tb-controls">
            <button onClick={() => enterMode('add')}>追加子节点</button>
            <button disabled={mode === 'add'} onClick={onRemove}>
              删除节点
            </button>
            {mode === 'add' && (
              <>
                <input
                  value={newName}
                  placeholder="新节点名称"
                  aria-label="新节点名称"
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmAdd()}
                />
                <button className="primary" onClick={confirmAdd}>
                  确认追加
                </button>
              </>
            )}
            {mode !== 'none' && <button onClick={() => enterMode('none')}>取消</button>}
          </div>
        </div>
        <span className="divider" />
        <div className="tb-group" role="group" aria-label="搜索">
          <span className="tb-label">搜索</span>
          <div className="tb-controls">
            <input value={searchKw} placeholder="关键词…" aria-label="搜索节点" onChange={onSearch} />
          </div>
        </div>
        <span className="divider" />
        <div className="tb-group" role="group" aria-label="导出">
          <span className="tb-label">导出</span>
          <div className="tb-controls">
            <button
              onClick={() => tree.current?.exportImage({ format: 'svg', filename: '产业链图谱-React' })}
            >
              SVG
            </button>
            <button
              onClick={() =>
                tree.current?.exportImage({ format: 'png', scale: 2, filename: '产业链图谱-React' })
              }
            >
              PNG
            </button>
          </div>
        </div>
        <span className="divider" />
        <div className="tb-group" role="group" aria-label="视图">
          <span className="tb-label">视图</span>
          <div className="tb-controls">
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
          </div>
        </div>
        <span className="divider" />
        <div className="tb-group" role="group" aria-label="悬浮框">
          <span className="tb-label">悬浮框</span>
          <div className="tb-controls">
            <button className={tooltipCache ? undefined : 'primary'} onClick={toggleTipCache}>
              实例缓存：{tooltipCache ? '开' : '关'}
            </button>
            <label className="tb-check">
              显示
              <input
                type="number"
                min={0}
                step={50}
                style={{ width: 56 }}
                value={tipShowDelay}
                aria-label="移入显示延时（毫秒）"
                onChange={e => setTipShowDelay(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label className="tb-check">
              延时
              <input
                type="number"
                min={0}
                step={50}
                style={{ width: 56 }}
                value={tipHideDelay}
                aria-label="隐藏防抖延时（毫秒）"
                onChange={e => setTipHideDelay(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label className="tb-check">
              时长
              <input
                type="number"
                min={0}
                step={50}
                style={{ width: 56 }}
                value={tipFadeDuration}
                aria-label="淡入淡出时长（毫秒）"
                onChange={e => setTipFadeDuration(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <span className="tb-stat">
              挂载 {tipMounts} · 卸载 {tipUnmounts}
            </span>
          </div>
        </div>
        <span id="hint" className={mode !== 'none' ? 'active' : undefined}>
          {hint}
        </span>
        <div id="legend" aria-label="分组图例">
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
          renderTooltip={renderTooltip}
          tooltipCache={tooltipCache}
          tooltipShowDelay={tipShowDelay}
          tooltipHideDelay={tipHideDelay}
          tooltipFadeDuration={tipFadeDuration}
          onNodeSelect={onNodeSelect}
          onGroupsChange={onGroupsChange}
        />
      </div>
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          zIndex: 30,
          maxWidth: 280,
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid #EBEEF5',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          fontSize: 12,
          lineHeight: 1.8,
          color: '#606266',
          pointerEvents: 'none',
        }}
      >
        {tipLogs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </>
  )
}
