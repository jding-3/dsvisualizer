import type { Graph } from '../shared/graph'

export const sampleGraph: Graph = {
  title: 'Traversal playground',
  isDirected: false,
  isWeighted: false,
  nodes: [
    { id: 'a', label: 'A', x: 108, y: 216 },
    { id: 'b', label: 'B', x: 278, y: 99 },
    { id: 'c', label: 'C', x: 278, y: 316 },
    { id: 'd', label: 'D', x: 466, y: 76 },
    { id: 'e', label: 'E', x: 466, y: 212 },
    { id: 'f', label: 'F', x: 466, y: 342 },
    { id: 'g', label: 'G', x: 650, y: 195 },
  ],
  edges: [
    { id: 'ab', source: 'a', target: 'b', weight: 1 },
    { id: 'ac', source: 'a', target: 'c', weight: 1 },
    { id: 'bd', source: 'b', target: 'd', weight: 1 },
    { id: 'be', source: 'b', target: 'e', weight: 1 },
    { id: 'ce', source: 'c', target: 'e', weight: 1 },
    { id: 'cf', source: 'c', target: 'f', weight: 1 },
    { id: 'de', source: 'd', target: 'e', weight: 1 },
    { id: 'dg', source: 'd', target: 'g', weight: 1 },
    { id: 'eg', source: 'e', target: 'g', weight: 1 },
    { id: 'fg', source: 'f', target: 'g', weight: 1 },
  ],
}

export const emptyGraph: Graph = { title: 'Untitled graph', isDirected: false, isWeighted: false, nodes: [], edges: [] }
