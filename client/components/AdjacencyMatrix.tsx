import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react'
import { MAX_EDGES } from '../../shared/graph'
import type { Graph, GraphEdge } from '../../shared/graph'
import { edgeKey } from '../edgeKey'

interface MatrixProps {
  graph: Graph
  onPreview: (pair: { source: string; target: string } | null) => void
  onAdd: (source: string, target: string) => void
  onRemove: (id: string) => void
  onReverse: (id: string) => void
}

const arrowOffsets: Record<string, [number, number] | undefined> = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
}

export function AdjacencyMatrix({ graph, onPreview, onAdd, onRemove, onReverse }: MatrixProps) {
  const { nodes, edges, isDirected, isWeighted } = graph
  const [selection, setSelection] = useState<{ source: string; target: string } | null>(null)
  const row = nodes.findIndex(({ id }) => id === selection?.source)
  const column = nodes.findIndex(({ id }) => id === selection?.target)
  const cell = row >= 0 && column >= 0 ? { row, column } : {
    row: Math.max(0, nodes.findIndex(({ id }) => id === edges[0]?.source)),
    column: edges.length ? nodes.findIndex(({ id }) => id === edges[0].target) : Math.min(1, nodes.length - 1),
  }
  const body = useRef<HTMLTableSectionElement>(null)
  const connections = new Map<string, GraphEdge[]>()
  const between = (source: string, target: string) => connections.get(edgeKey(source, target, isDirected)) ?? []
  for (const edge of edges) {
    const key = edgeKey(edge.source, edge.target, isDirected)
    const existing = connections.get(key) ?? []
    existing.push(edge)
    connections.set(key, existing)
  }

  const source = nodes[cell.row]
  const target = nodes[cell.column]
  const selected = source && target ? between(source.id, target.id) : []
  const reversible = isDirected && source?.id !== target?.id
  const hasOppositeEdge = Boolean(reversible && source && target && between(target.id, source.id).length)
  const atEdgeLimit = edges.length >= MAX_EDGES

  function focusCell(row: number, column: number) {
    body.current?.rows[row]?.cells[column + 1]?.querySelector('button')?.focus()
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, row: number, column: number) {
    const offset = arrowOffsets[event.key]
    if (!offset) return
    event.preventDefault()
    focusCell(row + offset[0], column + offset[1])
  }

  return <section className="matrix-panel" aria-labelledby="matrix-heading">
    <header className="matrix-heading">
      <h2 id="matrix-heading">Adjacency matrix</h2>
      {nodes.length > 0 && <span>{isDirected ? 'Rows → columns' : 'Mirrored edges'}</span>}
    </header>
    {nodes.length === 0 ? <p className="matrix-empty">Add a node to start editing edges.</p> : <>
      <div className="matrix-scroll">
        <table className="edge-matrix" aria-label="Graph connections">
          <thead><tr><th scope="col">{isDirected ? 'From / to' : 'Node'}</th>{nodes.map((node, index) => (
            <th key={node.id} scope="col" className={cell.column === index ? 'matrix-selected-heading' : undefined}><span title={node.label}>{node.label}</span></th>
          ))}</tr></thead>
          <tbody ref={body}>{nodes.map((from, row) => <tr key={from.id}>
            <th scope="row" className={cell.row === row ? 'matrix-selected-heading' : undefined}><span title={from.label}>{from.label}</span></th>
            {nodes.map((to, column) => {
              const entries = between(from.id, to.id)
              const count = entries.length
              const active = cell.row === row && cell.column === column
              const value = count > 1 ? `×${count}` : count ? (isWeighted ? entries[0].weight : 1) : (isWeighted ? '–' : 0)
              const detail = count === 0 ? 'No edge' : count > 1 ? `${count} edges` : isWeighted ? `Weight ${entries[0].weight}` : 'Edge exists'
              return <td key={to.id}>
                <button type="button" className={count ? 'matrix-cell has-edge' : 'matrix-cell'} aria-pressed={active}
                  aria-label={`${from.label} to ${to.label}`} aria-description={detail} title={detail} tabIndex={active ? 0 : -1}
                  onMouseEnter={() => onPreview({ source: from.id, target: to.id })}
                  onMouseLeave={() => onPreview(null)}
                  onFocus={(event) => {
                    setSelection({ source: from.id, target: to.id })
                    if (event.currentTarget.matches(':focus-visible')) onPreview({ source: from.id, target: to.id })
                  }}
                  onBlur={() => onPreview(null)}
                  onClick={() => setSelection({ source: from.id, target: to.id })}
                  onKeyDown={(event) => moveFocus(event, row, column)}><span>{value}</span></button>
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      {source && target && <section className="matrix-edit" aria-label="Selected connection">
        <h3 title={`${source.label} ${isDirected ? '→' : '–'} ${target.label}`}>{source.label} {isDirected ? '→' : '–'} {target.label}</h3>
        {selected.length ? <>
          <ul className="matrix-edges">{selected.map((edge, index) => <li key={edge.id}>
            {selected.length > 1 && <span>{isWeighted ? `Weight ${edge.weight}` : `Edge ${index + 1}`}</span>}
            <div className="matrix-actions">
              {reversible && <button type="button" className="button" aria-label="Reverse edge" disabled={hasOppositeEdge} onClick={() => {
                onReverse(edge.id)
                focusCell(cell.column, cell.row)
              }}><ArrowRightLeft size={13} /> Reverse</button>}
              <button type="button" className="button clear-button" aria-label="Remove edge" onClick={() => {
                onRemove(edge.id)
                focusCell(cell.row, cell.column)
              }}><Trash2 size={13} /> Remove</button>
            </div>
          </li>)}</ul>
          {hasOppositeEdge && <p>Remove the opposite edge before reversing this one.</p>}
        </> : <div className="matrix-add">
          {atEdgeLimit && <p>This graph has reached the {MAX_EDGES}-edge limit.</p>}
          <button type="button" className="button" disabled={atEdgeLimit} onClick={() => {
            onAdd(source.id, target.id)
            focusCell(cell.row, cell.column)
          }}><Plus size={13} /> Add edge</button>
        </div>}
      </section>}
    </>}
  </section>
}
