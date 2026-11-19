import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderOpen, Grid3X3, Link2, MousePointer2, Pencil, RotateCcw, Share2, Trash2 } from 'lucide-react'
import { MAX_TITLE_LENGTH } from '../shared/graph'
import { traverse } from './algorithms/traversal'
import type { Algorithm } from './algorithms/traversal'
import { getGraph, saveGraph } from './api'
import { AdjacencyMatrix } from './components/AdjacencyMatrix'
import { GraphCanvas, GraphLegend } from './components/GraphCanvas'
import { SavedGraphs, ShareGraph } from './components/GraphDialogs'
import { Inspector } from './components/Inspector'
import { Playback } from './components/Playback'
import { useGraphEditor } from './hooks/useGraphEditor'
import { usePlayback } from './hooks/usePlayback'
import { emptyGraph, sampleGraph } from './sample'

const shareId = /^\/graph\/([^/]+)\/?$/.exec(window.location.pathname)?.[1]

export function App() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs')
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const [savedOpen, setSavedOpen] = useState(false)
  const [share, setShare] = useState<{ url: string; copied: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(shareId))
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const editor = useGraphEditor(shareId ? emptyGraph : sampleGraph, () => setRevision((value) => value + 1), setMessage)
  const load = useRef(editor.load)
  const graph = editor.graph

  useEffect(() => {
    if (!shareId) return
    const controller = new AbortController()
    getGraph(shareId, controller.signal).then((saved) => {
      const { title, isDirected, isWeighted, nodes, edges } = saved
      load.current({ title, isDirected, isWeighted, nodes, edges })
      setLoading(false)
    }).catch((error: Error) => {
      if (controller.signal.aborted) return
      setLoadError(error.message)
      setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  async function shareGraph() {
    setSaving(true)
    setMessage('')
    try {
      const { id } = await saveGraph({ ...graph, title: graph.title.trim() || 'Untitled graph' })
      const url = new URL(`/graph/${id}`, window.location.origin).href
      let copied = false
      try {
        await navigator.clipboard.writeText(url)
        copied = true
      } catch {
        // The dialog exposes the link for manual copying when the browser blocks access.
      }
      setShare({ url, copied })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this graph.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="/" aria-label="GraphLab home"><img src="/graphlab.svg" alt="" width="34" height="34" /> GraphLab</a>
        <div className="header-actions">
          <button className="button" onClick={() => setSavedOpen(true)}><FolderOpen size={17} /><span>Saved graphs</span></button>
          <button className="button primary" onClick={shareGraph} disabled={saving || loading || !graph.nodes.length}><Share2 size={16} /><span>{saving ? 'Saving…' : 'Save & share'}</span></button>
        </div>
      </div>
    </header>
    <main className="workspace">
      <div className="workspace-heading">
        <h1 className="title-field">
          <input className="title-input" aria-label="Graph title" maxLength={MAX_TITLE_LENGTH} value={graph.title} disabled={loading}
            placeholder="Untitled graph" onChange={(event) => editor.setTitle(event.target.value)}
            onBlur={() => editor.setTitle(graph.title.trim() || 'Untitled graph')} />
          <Pencil size={16} aria-hidden="true" />
        </h1>
        <div className="workspace-actions">
          <button className="button subdued" disabled={loading} onClick={() => { editor.loadSample(); setMessage(''); setLoadError('') }}><RotateCcw size={15} /> Load sample graph</button>
          <button className="button subdued clear-button" disabled={loading || !graph.nodes.length} onClick={() => { editor.clear(); setMessage('') }}><Trash2 size={15} /> Clear graph</button>
        </div>
      </div>
      {loading && <p className="feedback" role="status">Loading saved graph…</p>}
      {loadError && <div className="feedback" role="alert"><span>{loadError}</span>
        <button className="button" onClick={() => { setLoadError(''); setLoading(true); setAttempt(attempt + 1) }}>Retry</button>
      </div>}
      {message && <div className="feedback" role="status"><span>{message}</span><button className="button" onClick={() => setMessage('')}>Dismiss</button></div>}
      <Workspace revision={revision} editor={editor} algorithm={algorithm} loading={loading} onAlgorithm={(value) => {
        if (value === algorithm) return
        setAlgorithm(value)
        setRevision((current) => current + 1)
      }} />
    </main>
    {savedOpen && <SavedGraphs onClose={() => setSavedOpen(false)} />}
    {share && <ShareGraph url={share.url} initiallyCopied={share.copied} onClose={() => setShare(null)} />}
  </>
}

function Workspace({ editor, algorithm, revision, loading, onAlgorithm }: {
  editor: ReturnType<typeof useGraphEditor>; algorithm: Algorithm; revision: number; loading: boolean; onAlgorithm: (algorithm: Algorithm) => void
}) {
  const { graph, start, target, tool, selected } = editor
  const [matrixOpen, setMatrixOpen] = useState(false)
  const steps = useMemo(() => traverse(graph, algorithm, start, target), [graph, algorithm, start, target])
  const playback = usePlayback(steps.length, revision)
  const toolHint = tool === 'node' ? 'Click to add a node. Drag to move it.'
    : selected ? 'Select the destination node.' : 'Select two nodes to connect them.'
  const graphSize = `${graph.nodes.length} ${graph.nodes.length === 1 ? 'node' : 'nodes'}, ${graph.edges.length} ${graph.edges.length === 1 ? 'edge' : 'edges'}`

  return <div className="workspace-grid">
    <section className="graph-panel" aria-label="Graph editor">
      <header className="canvas-toolbar">
        <div className="canvas-controls">
          <div className="tool-picker" role="group" aria-label="Canvas tool">
            <button disabled={loading} aria-pressed={tool === 'node'} onClick={() => editor.setTool('node')}><MousePointer2 size={15} /> Edit nodes</button>
            <button disabled={loading} aria-pressed={tool === 'edge'} onClick={() => editor.setTool('edge')}><Link2 size={15} /> Connect</button>
          </div>
          {selected && tool === 'node' && <button className="icon-button delete-node" aria-label="Delete selected node" title="Delete selected node" onClick={() => editor.removeNode(selected)}><Trash2 size={15} /></button>}
        </div>
        <div className="graph-options">
          <button type="button" role="switch" aria-label="Directed graph" aria-checked={graph.isDirected} disabled={loading} onClick={editor.toggleDirected}>Directed <span className="switch" /></button>
          <button type="button" role="switch" aria-label="Weighted graph" aria-checked={graph.isWeighted} disabled={loading} onClick={editor.toggleWeighted}>Weighted <span className="switch" /></button>
          <button type="button" className="matrix-trigger" aria-label="Adjacency matrix" aria-haspopup="dialog" disabled={loading} onClick={() => setMatrixOpen(true)}><Grid3X3 size={15} /> Matrix</button>
        </div>
      </header>
      <div className={`plot${loading ? ' canvas-loading' : ''}`} inert={loading || undefined}>
        <GraphCanvas graph={graph} step={steps[playback.index]} start={start} target={target} tool={tool} selected={selected}
          onAddNode={editor.addNode} onMoveNode={editor.moveNode} onNodeClick={editor.clickNode} onRemoveNode={editor.removeNode} onWeight={editor.setWeight} />
      </div>
      <footer className="canvas-footer"><span>{toolHint}</span><span>{graphSize}</span></footer>
      <GraphLegend />
    </section>
    <Playback playback={playback} length={steps.length} />
    <Inspector graph={graph} algorithm={algorithm} start={start} target={target} setAlgorithm={onAlgorithm}
      setStart={editor.setStart} setTarget={editor.setTarget} steps={steps} index={playback.index} seek={playback.seek} />
    {matrixOpen && <AdjacencyMatrix graph={graph} onAdd={editor.addEdge} onRemove={editor.removeEdge}
      onReverse={editor.reverseEdge} onClose={() => setMatrixOpen(false)} />}
  </div>
}
