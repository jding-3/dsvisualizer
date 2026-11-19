export type GraphNode = { id: string; label: string; x: number; y: number }
export type GraphEdge = { id: string; source: string; target: string; weight: number }

export interface Graph {
  title: string
  isDirected: boolean
  isWeighted: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type SavedGraph = Graph & { id: string; createdAt: string }
export type GraphSummary = Pick<SavedGraph, 'id' | 'title' | 'createdAt' | 'isDirected' | 'isWeighted'> & {
  nodeCount: number
  edgeCount: number
}

export const MAX_NODES = 60
export const MAX_EDGES = 150
export const MAX_TITLE_LENGTH = 80
export const GRAPH_WIDTH = 760
export const GRAPH_HEIGHT = 430
