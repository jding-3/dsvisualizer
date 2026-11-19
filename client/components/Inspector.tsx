import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Route } from 'lucide-react'
import type { Algorithm, Step } from '../algorithms/traversal'
import type { Graph } from '../../shared/graph'

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
  playback: ReactNode
}

export function Inspector({ graph, algorithm, start, target, setAlgorithm, setStart, setTarget, steps, index, seek, playback }: InspectorProps) {
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

  return <aside className="inspector" aria-label="Algorithm inspector">
    <section className="inspector-section algorithm-section">
      <h2 className="traversal-heading">Traversal</h2>
      <div className="algorithm-picker" role="group" aria-label="Algorithm">
        <button aria-pressed={!stack} aria-label="BFS Breadth-first" onClick={() => setAlgorithm('bfs')}><b>BFS</b><span>Breadth-first</span></button>
        <button aria-pressed={stack} aria-label="DFS Depth-first" onClick={() => setAlgorithm('dfs')}><b>DFS</b><span>Depth-first</span></button>
      </div>
      <div className="endpoints">
        <label>Start<select aria-label="Start node" value={start} disabled={!graph.nodes.length} onChange={(event) => setStart(event.target.value)}>
          {!graph.nodes.length && <option value="">Select a node</option>}
          {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select></label>
        <label>Target<select aria-label="Target node" value={target} disabled={!graph.nodes.length} onChange={(event) => setTarget(event.target.value)}>
          {!graph.nodes.length && <option value="">Select a node</option>}
          {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select></label>
      </div>
      {graph.isWeighted && <p className="weight-note">BFS and DFS use edge connections only.</p>}
    </section>
    {playback}
    <section className="inspector-section frontier-section">
      <div className="section-heading"><h3>{stack ? 'Stack' : 'Queue'}</h3><span>{stack ? 'Top first' : 'Front first'}</span></div>
      <div className="frontier-list" aria-label={stack ? 'Current stack, top first' : 'Current queue, front first'}>
        {step?.frontier.length ? (stack ? [...step.frontier].reverse() : step.frontier).map((id, position) => (
          <span key={id} className={position === 0 ? 'frontier-first' : ''} title={position === 0 ? (stack ? 'Top of stack' : 'Front of queue') : undefined}>{name(id)}</span>
        )) : <p>{stack ? 'Stack' : 'Queue'} is empty</p>}
      </div>
    </section>
    <section className="inspector-section log-section">
      <h3>Step log</h3>
      {steps.length ? <ol className="step-log" ref={log} aria-label="Completed steps">
        {steps.slice(0, index + 1).map(({ description }, position) => <li ref={position === index ? current : null} key={position}>
          <button aria-current={position === index ? 'step' : undefined} onClick={() => seek(position)}>
            <span>{position + 1}</span><span>{description}</span>
          </button>
        </li>)}
      </ol> : <p className="log-empty">Add a node to start a traversal.</p>}
      {step?.path && <div className="path-result"><Route size={14} /><span>{step.path.nodes.map((id, position) => (
        <span key={id}>{position > 0 && <ArrowRight size={11} />}{name(id)}</span>
      ))}</span></div>}
    </section>
  </aside>
}
