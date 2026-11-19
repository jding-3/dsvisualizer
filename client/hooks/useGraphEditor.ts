import { useState } from 'react'
import { MAX_EDGES, MAX_NODES } from '../../shared/graph'
import type { Graph, GraphNode } from '../../shared/graph'
import type { Tool } from '../components/GraphCanvas'
import { edgeKey } from '../edgeKey'
import { emptyGraph, sampleGraph } from '../sample'

type Point = Pick<GraphNode, 'x' | 'y'>

function nextLabel(nodes: GraphNode[]) {
  const used = new Set(nodes.map(({ label }) => label))
  for (let index = 0; ; index++) {
    const letter = String.fromCharCode(65 + index % 26)
    const label = index < 26 ? letter : `${letter}${Math.floor(index / 26)}`
    if (!used.has(label)) return label
  }
}

export function useGraphEditor(initial: Graph, reset: () => void, notify: (message: string) => void) {
  const [graph, setGraph] = useState(initial)
  const [chosenStart, setChosenStart] = useState('')
  const [chosenTarget, setChosenTarget] = useState('')
  const [tool, setTool] = useState<Tool>('node')
  const [selected, setSelected] = useState<string | null>(null)
  const start = graph.nodes.some(({ id }) => id === chosenStart) ? chosenStart : graph.nodes[0]?.id ?? ''
  const target = graph.nodes.some(({ id }) => id === chosenTarget) ? chosenTarget : graph.nodes.at(-1)?.id ?? ''

  function load(value: Graph) {
    setGraph(value)
    setChosenStart('')
    setChosenTarget('')
    setSelected(null)
    setTool('node')
    reset()
  }

  function addNode(point: Point) {
    if (graph.nodes.length >= MAX_NODES) return notify(`A graph can contain up to ${MAX_NODES} nodes.`)
    const node = { ...point, id: crypto.randomUUID(), label: nextLabel(graph.nodes) }
    setGraph({ ...graph, nodes: [...graph.nodes, node] })
    setSelected(node.id)
    reset()
  }

  function clickNode(id: string) {
    if (selected === id) return setSelected(null)
    if (tool !== 'edge' || !selected) return setSelected(id)
    setSelected(null)
    addEdge(selected, id)
  }

  function addEdge(source: string, target: string) {
    const key = edgeKey(source, target, graph.isDirected)
    const exists = graph.edges.some((edge) => edgeKey(edge.source, edge.target, graph.isDirected) === key)
    if (exists) return notify('These nodes already have an edge in that direction.')
    if (graph.edges.length >= MAX_EDGES) return notify(`A graph can contain up to ${MAX_EDGES} edges.`)
    const edge = { id: crypto.randomUUID(), source, target, weight: 1 }
    setGraph((previous) => ({ ...previous, edges: [...previous.edges, edge] }))
    reset()
  }

  function removeEdge(id: string) {
    setGraph((previous) => ({ ...previous, edges: previous.edges.filter((edge) => edge.id !== id) }))
    reset()
  }

  function reverseEdge(id: string) {
    const edge = graph.edges.find((candidate) => candidate.id === id)
    if (!graph.isDirected || !edge || edge.source === edge.target) return
    if (graph.edges.some((candidate) => candidate.source === edge.target && candidate.target === edge.source)) {
      return notify('Remove the opposite edge before reversing this one.')
    }
    const reversed = { ...edge, source: edge.target, target: edge.source }
    setGraph((previous) => ({ ...previous, edges: previous.edges.map((candidate) => candidate.id === id ? reversed : candidate) }))
    reset()
  }

  function removeNode(id: string) {
    setGraph((previous) => ({ ...previous,
      nodes: previous.nodes.filter((node) => node.id !== id),
      edges: previous.edges.filter((edge) => edge.source !== id && edge.target !== id),
    }))
    if (selected === id) setSelected(null)
    if (chosenStart === id) setChosenStart('')
    if (chosenTarget === id) setChosenTarget('')
    reset()
  }

  return {
    graph, start, target, tool, selected, load, addNode, clickNode, removeNode, addEdge, removeEdge, reverseEdge,
    clear: () => load({ ...emptyGraph, isDirected: graph.isDirected, isWeighted: graph.isWeighted }),
    loadSample: () => load(sampleGraph),
    setTitle: (title: string) => setGraph((previous) => ({ ...previous, title })),
    setTool: (value: Tool) => { setTool(value); setSelected(null) },
    setStart: (id: string) => { setChosenStart(id); reset() },
    setTarget: (id: string) => { setChosenTarget(id); reset() },
    toggleDirected: () => { setGraph((previous) => ({ ...previous, isDirected: !previous.isDirected })); setSelected(null); reset() },
    toggleWeighted: () => setGraph((previous) => ({ ...previous, isWeighted: !previous.isWeighted })),
    moveNode: (id: string, point: Point) => setGraph((previous) => ({ ...previous,
      nodes: previous.nodes.map((node) => node.id === id ? { ...node, ...point } : node),
    })),
    setWeight: (id: string, weight: number) => setGraph((previous) => ({ ...previous,
      edges: previous.edges.map((edge) => edge.id === id ? { ...edge, weight } : edge),
    })),
  }
}
