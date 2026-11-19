import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowRightLeft, Grid3X3, Plus, Trash2 } from 'lucide-react'
import { MAX_EDGES } from '../../shared/graph'
import type { Graph, GraphEdge } from '../../shared/graph'
import { edgeKey } from '../edgeKey'
import { Modal } from './GraphDialogs'

interface MatrixProps {
  graph: Graph
  onAdd: (source: string, target: string) => void
  onRemove: (id: string) => void
  onReverse: (id: string) => void
  onClose: () => void
}

const arrowOffsets: Record<string, [number, number] | undefined> = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
}

export function AdjacencyMatrix({ graph, onAdd, onRemove, onReverse, onClose }: MatrixProps) {
  const { nodes, edges, isDirected, isWeighted } = graph
  const [cell, setCell] = useState(() => ({
    row: Math.max(0, nodes.findIndex(({ id }) => id === edges[0]?.source)),
    column: edges.length ? Math.max(0, nodes.findIndex(({ id }) => id === edges[0].target)) : Math.min(1, nodes.length - 1),
  }))
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

  return <Modal title="Adjacency matrix" icon={<Grid3X3 size={19} />} onClose={onClose} className="matrix-modal">
    {nodes.length === 0 ? <p className="dialog-empty">Add a node to start editing edges.</p> : <>
      <p>{isDirected ? 'Rows are sources and columns are targets. Select a cell to edit its edge.' : 'An undirected edge appears in both mirrored cells. Select either cell to edit it.'}</p>
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
                  onFocus={() => setCell({ row, column })} onClick={() => setCell({ row, column })}
                  onKeyDown={(event) => moveFocus(event, row, column)}><span>{value}</span></button>
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      {source && target && <section className="matrix-edit" aria-label="Selected connection">
        <h3>{source.label} {isDirected ? '→' : '–'} {target.label}</h3>
        {selected.length ? <>
          <ul className="matrix-edges">{selected.map((edge, index) => <li key={edge.id}>
            <span>{isWeighted ? `Weight ${edge.weight}` : selected.length > 1 ? `Edge ${index + 1}` : 'Edge exists'}</span>
            <div className="matrix-actions">
              {reversible && <button type="button" className="button" disabled={hasOppositeEdge} onClick={() => {
                onReverse(edge.id)
                focusCell(cell.column, cell.row)
              }}><ArrowRightLeft size={15} /> Reverse edge</button>}
              <button type="button" className="button clear-button" onClick={() => {
                onRemove(edge.id)
                focusCell(cell.row, cell.column)
              }}><Trash2 size={15} /> Remove edge</button>
            </div>
          </li>)}</ul>
          {hasOppositeEdge && <p>Remove the opposite edge before reversing this one.</p>}
        </> : <div className="matrix-add">
          <p>{atEdgeLimit ? `This graph has reached the ${MAX_EDGES}-edge limit.` : 'No edge here.'}</p>
          <button type="button" className="button" disabled={atEdgeLimit} onClick={() => {
            onAdd(source.id, target.id)
            focusCell(cell.row, cell.column)
          }}><Plus size={16} /> Add edge</button>
        </div>}
      </section>}
    </>}
    <footer className="matrix-footer"><button type="button" className="button primary" onClick={onClose}>Done</button></footer>
  </Modal>
}
