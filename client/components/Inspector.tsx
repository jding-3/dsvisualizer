import { useEffect, useRef } from 'react'
import { ArrowRight, ListTree, Route, SquareTerminal } from 'lucide-react'
import type { Algorithm, Step } from '../algorithms/traversal'
import type { Graph } from '../../shared/graph'

const legend = [
  ['unvisited', 'Unvisited'], ['frontier', 'In frontier'], ['active', 'Active'], ['visited', 'Visited'], ['path', 'Path'],
] as const

interface InspectorProps {
  graph: Graph
  algorithm: Algorithm
  start: string
  target: string
  setAlgorithm: (algorithm: Algorithm) => void
  setStart: (id: string) => void
  setTarget: (id: string) => void
  steps: Step[]
  index: number
  seek: (step: number) => void
}

export function Inspector({ graph, algorithm, start, target, setAlgorithm, setStart, setTarget, steps, index, seek }: InspectorProps) {
  const log = useRef<HTMLOListElement>(null)
  const current = useRef<HTMLLIElement>(null)
  const step = steps[index]
  const stack = algorithm === 'dfs'
  const labels = new Map(graph.nodes.map(({ id, label }) => [id, label]))
  const name = (id: string) => labels.get(id) ?? id

  useEffect(() => {
    const parent = log.current
    const item = current.current
    if (!parent || !item) return
    const upper = item.offsetTop - parent.scrollTop
    const lower = upper + item.offsetHeight
    if (upper < 0) parent.scrollTop += upper
    if (lower > parent.clientHeight) parent.scrollTop += lower - parent.clientHeight
  }, [index, steps.length])

  return <aside className="panel inspector" aria-label="Algorithm inspector">
    <header className="inspector-heading"><div className="heading-icon"><ListTree size={17} /></div><h2>Inspector</h2></header>
    <section className="inspector-section algorithm-section">
      <h3>Algorithm</h3>
      <div className="algorithm-picker" role="group" aria-label="Algorithm">
        <button aria-pressed={!stack} onClick={() => setAlgorithm('bfs')}><b>BFS</b><span>Breadth-first</span></button>
        <button aria-pressed={stack} onClick={() => setAlgorithm('dfs')}><b>DFS</b><span>Depth-first</span></button>
      </div>
      <div className="endpoints">
        <label>Start node<select aria-label="Start node" value={start} disabled={!graph.nodes.length} onChange={(event) => setStart(event.target.value)}>
          {!graph.nodes.length && <option value="">—</option>}
          {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select></label>
        <label>Target node<select aria-label="Target node" value={target} disabled={!graph.nodes.length} onChange={(event) => setTarget(event.target.value)}>
          {!graph.nodes.length && <option value="">—</option>}
          {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select></label>
      </div>
      {graph.isWeighted && <p className="weight-note">BFS and DFS follow edges without using their weights.</p>}
    </section>
    <section className="inspector-section frontier-section">
      <div className="section-heading"><h3>{stack ? 'Stack' : 'Queue'}</h3><span>{stack ? 'LIFO' : 'FIFO'}</span></div>
      <div className="frontier-list" aria-label={stack ? 'Current stack, top first' : 'Current queue, front first'}>
        {step?.frontier.length ? (stack ? [...step.frontier].reverse() : step.frontier).map((id, position) => (
          <span key={id} className={position === 0 ? 'frontier-first' : ''} title={position === 0 ? (stack ? 'Top of stack' : 'Front of queue') : undefined}>{name(id)}</span>
        )) : <p>{stack ? 'Stack' : 'Queue'} is empty</p>}
      </div>
      <span className="frontier-caption">{stack ? 'Top → bottom' : 'Front → back'}</span>
    </section>
    <section className="inspector-section log-section">
      <div className="section-heading"><h3><SquareTerminal size={15} /> Step log</h3><span>{steps.length ? `${index + 1} / ${steps.length}` : '0 / 0'}</span></div>
      {steps.length ? <ol className="step-log" ref={log} aria-label="Completed steps">
        {steps.slice(0, index + 1).map(({ description }, position) => <li ref={position === index ? current : null} key={position}>
          <button aria-current={position === index ? 'step' : undefined} onClick={() => seek(position)}>
            <span>{String(position + 1).padStart(2, '0')}</span><span>{description}</span>
          </button>
        </li>)}
      </ol> : <p className="log-empty">Add a node to start a traversal.</p>}
      {step?.path && <div className="path-result"><Route size={14} /><span>{step.path.nodes.map((id, position) => (
        <span key={id}>{position > 0 && <ArrowRight size={11} />}{name(id)}</span>
      ))}</span></div>}
    </section>
    <section className="inspector-section legend-section">
      <h3>Legend</h3>
      <ul className="legend">{legend.map(([status, label]) => <li key={status}><i className={`state-${status}`} />{label}</li>)}</ul>
    </section>
  </aside>
}
