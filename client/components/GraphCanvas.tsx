import { useId, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { GRAPH_HEIGHT, GRAPH_WIDTH } from '../../shared/graph'
import type { Graph, GraphNode } from '../../shared/graph'
import type { Step } from '../algorithms/traversal'
import { edgeKey } from '../edgeKey'

export type Tool = 'node' | 'edge'
type Point = { x: number; y: number }
const radius = 22
const inset = 25
const states = {
  unvisited: 'Unvisited', frontier: 'In frontier', active: 'Active', visited: 'Visited', path: 'Path',
}
const xTicks = [100, 200, 300, 400, 500, 600, 700]
const yTicks = [100, 200, 300, 400]

export function GraphLegend() {
  return <ul className="legend" aria-label="Graph color legend">
    {Object.entries(states).map(([status, label]) => <li key={status}><i className={`state-${status}`} />{label}</li>)}
  </ul>
}

function moveToward(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
  return { x: from.x + (to.x - from.x) * distance / length, y: from.y + (to.y - from.y) * distance / length }
}

function edgeGeometry(source: Point, target: Point, offset: number, loop: boolean) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.hypot(dx, dy)
  // A loop also keeps edges visible when two distinct nodes are dragged together.
  if (loop || distance < 1) {
    const height = 61 + Math.abs(offset)
    const { x, y } = source
    return {
      line: `M ${x - 15} ${y - 17} C ${x - 51} ${y - height}, ${x + 51} ${y - height}, ${x + 16} ${y - 18}`,
      label: { x, y: y - height * 0.75 - 4 },
    }
  }
  const center = { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 }
  const control = { x: center.x - dy / distance * offset, y: center.y + dx / distance * offset }
  const start = moveToward(source, control, Math.min(radius, distance / 3))
  const end = moveToward(target, control, Math.min(radius + 3, distance / 3))
  return {
    line: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    label: { x: (start.x + 2 * control.x + end.x) / 4, y: (start.y + 2 * control.y + end.y) / 4 },
  }
}

function WeightInput({ label, weight, onCommit }: { label: string; weight: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  return <input className="edge-weight" aria-label={label} type="text" inputMode="decimal" maxLength={24}
    value={draft ?? String(weight)} onFocus={(event) => event.target.select()}
    onChange={(event) => setDraft(event.target.value)}
    onBlur={() => {
      if (draft?.trim() && Number.isFinite(Number(draft))) onCommit(Number(draft))
      setDraft(null)
    }}
    onKeyDown={(event) => {
      if (event.key === 'Enter') event.currentTarget.blur()
      if (event.key === 'Escape') { setDraft(null); event.stopPropagation() }
    }}
  />
}

interface CanvasProps {
  graph: Graph
  step: Step | undefined
  start: string
  target: string
  tool: Tool
  selected: string | null
  onAddNode: (point: Point) => void
  onMoveNode: (id: string, point: Point) => void
  onNodeClick: (id: string) => void
  onRemoveNode: (id: string) => void
  onWeight: (id: string, weight: number) => void
}

export function GraphCanvas({ graph, step, start, target, tool, selected, onAddNode, onMoveNode, onNodeClick, onRemoveNode, onWeight }: CanvasProps) {
  const markers = useId()
  const grid = useId()
  const svg = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ pointer: number; node: GraphNode; origin: Point; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]))
  const visited = new Set(step?.visitedNodes)
  const frontier = new Set(step?.frontier)
  const pathNodes = new Set(step?.path?.nodes)
  const pathEdges = new Set(step?.path?.edges)
  const edgeGroups = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const key = edgeKey(edge.source, edge.target, false)
    const group = edgeGroups.get(key) ?? []
    group.push(edge.id)
    edgeGroups.set(key, group)
  }

  function graphPoint(event: { clientX: number; clientY: number }) {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) return null
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  }

  function move(event: PointerEvent<SVGGElement>) {
    const current = gesture.current
    if (!current || current.pointer !== event.pointerId || tool !== 'node') return
    const point = graphPoint(event)
    if (!point) return
    const dx = point.x - current.origin.x
    const dy = point.y - current.origin.y
    if (!current.moved && Math.hypot(dx, dy) < 5) return
    current.moved = true
    setDragging(current.node.id)
    onMoveNode(current.node.id, {
      x: Math.max(inset, Math.min(GRAPH_WIDTH - inset, current.node.x + dx)),
      y: Math.max(inset, Math.min(GRAPH_HEIGHT - inset, current.node.y + dy)),
    })
  }

  return (
    <div className={`canvas-shell ${tool === 'edge' ? 'connect-mode' : ''}`}>
      <svg ref={svg} className="graph-canvas" viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="group" aria-label="Interactive graph canvas"
        onClick={(event) => {
          if (event.target !== event.currentTarget || tool !== 'node') return
          const point = graphPoint(event)
          if (!point || point.x < 0 || point.x > GRAPH_WIDTH || point.y < 0 || point.y > GRAPH_HEIGHT) return
          onAddNode({ x: Math.max(inset, Math.min(GRAPH_WIDTH - inset, point.x)), y: Math.max(inset, Math.min(GRAPH_HEIGHT - inset, point.y)) })
        }}>
        <defs>
          <pattern id={grid} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 H 0 V 20" fill="none" stroke="var(--grid)" strokeWidth="1" />
          </pattern>
          {Object.keys(states).map((status) => (
            <marker key={status} id={`${markers}-${status}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path className={`graph-arrow state-${status}`} d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          ))}
        </defs>
        <rect width={GRAPH_WIDTH} height={GRAPH_HEIGHT} fill={`url(#${grid})`} pointerEvents="none" />
        <g className="plot-ruler" aria-hidden="true">
          {xTicks.map((x) => <g key={x} transform={`translate(${x},0)`}>
            <path className="major-gridline" d={`M 0 0 V ${GRAPH_HEIGHT}`} />
            <path className="ruler-notch" d="M 0 0 V 6" />
            <text y="17" textAnchor="middle">{x}</text>
          </g>)}
          {yTicks.map((y) => <g key={y} transform={`translate(0,${y})`}>
            <path className="major-gridline" d={`M 0 0 H ${GRAPH_WIDTH}`} />
            <path className="ruler-notch" d="M 0 0 H 6" />
            <text x="9" y="4">{y}</text>
          </g>)}
        </g>
        {graph.edges.map((edge) => {
          const source = nodes.get(edge.source)
          const targetNode = nodes.get(edge.target)
          if (!source || !targetNode) return null
          const group = edgeGroups.get(edgeKey(edge.source, edge.target, false)) ?? []
          const offset = (group.indexOf(edge.id) - (group.length - 1) / 2) * 38 * (edge.source <= edge.target ? 1 : -1)
          const geometry = edgeGeometry(source, targetNode, offset, edge.source === edge.target)
          const status = pathEdges.has(edge.id) ? 'path' : step?.activeEdge === edge.id ? 'active' : 'unvisited'
          return <g key={edge.id}>
            <path className={`graph-edge state-${status}`} data-edge={edge.id} d={geometry.line}
              markerEnd={graph.isDirected ? `url(#${markers}-${status})` : undefined} />
            {graph.isWeighted && <foreignObject x={geometry.label.x - 23} y={geometry.label.y - 12} width="46" height="24">
              <WeightInput label={`Weight ${source.label} to ${targetNode.label}`} weight={edge.weight} onCommit={(weight) => onWeight(edge.id, weight)} />
            </foreignObject>}
          </g>
        })}
        {graph.nodes.map((node) => {
          const status = pathNodes.has(node.id) ? 'path' : step?.activeNode === node.id ? 'active'
            : frontier.has(node.id) ? 'frontier' : visited.has(node.id) ? 'visited' : 'unvisited'
          const marker = node.id === start && node.id === target ? 'Start and target' : node.id === start ? 'Start' : node.id === target ? 'Target' : ''
          return <g key={node.id} transform={`translate(${node.x},${node.y})`} data-node={node.id}
            className={`graph-node state-${status}${node.id === selected ? ' is-selected' : ''}${node.id === dragging ? ' is-dragging' : ''}`}
            role="button" aria-label={`Node ${node.label}`} aria-pressed={node.id === selected} tabIndex={0}
            onPointerDown={(event) => {
              if (event.button !== 0 || gesture.current) return
              const origin = graphPoint(event)
              if (!origin) return
              gesture.current = { pointer: event.pointerId, node, origin, moved: false }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={move}
            onPointerUp={(event) => {
              const current = gesture.current
              if (!current || current.pointer !== event.pointerId) return
              gesture.current = null
              setDragging(null)
              if (!current.moved) onNodeClick(node.id)
            }}
            onLostPointerCapture={() => { gesture.current = null; setDragging(null) }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNodeClick(node.id) }
              if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); onRemoveNode(node.id) }
            }}>
            {(node.id === selected || marker || status === 'active') && <circle className="node-ring" r={radius + 5} />}
            <circle r={radius + 5} fill="transparent" />
            <circle className="node-disc" r={radius} />
            <text className="node-label" textAnchor="middle" dominantBaseline="central">{node.label.length > 5 ? `${node.label.slice(0, 4)}…` : node.label}</text>
            {marker && <text className="node-marker" y={node.y > GRAPH_HEIGHT - 54 ? -radius - 13 : radius + 21} textAnchor="middle">{marker}</text>}
          </g>
        })}
      </svg>
      {graph.nodes.length === 0 && <div className="canvas-empty">
        <strong>Add your first node</strong>
        <span>Click anywhere on the grid to start.</span>
      </div>}
    </div>
  )
}
