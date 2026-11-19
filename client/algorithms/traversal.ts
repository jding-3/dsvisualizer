import type { Graph } from '../../shared/graph'

export type Algorithm = 'bfs' | 'dfs'
export type Path = { nodes: string[]; edges: string[] }

export type Step = {
  visitedNodes: string[]
  frontier: string[]
  activeNode: string | null
  activeEdge: string | null
  path: Path | null
  description: string
}

type Neighbor = { node: string; edge: string }
type Frame = { node: string; next: number }

export function traverse(graph: Graph, algorithm: Algorithm, start: string, target: string): Step[] {
  const labels = new Map(graph.nodes.map(({ id, label }) => [id, label]))
  if (!labels.has(start) || !labels.has(target)) return []

  const adjacent = new Map(graph.nodes.map(({ id }) => [id, [] as Neighbor[]]))
  for (const { id, source, target: destination } of graph.edges) {
    adjacent.get(source)?.push({ node: destination, edge: id })
    if (!graph.isDirected && source !== destination) adjacent.get(destination)?.push({ node: source, edge: id })
  }

  const steps: Step[] = []
  const visited = new Set<string>()
  const discovered = new Set([start])
  const parents = new Map<string, Neighbor>()
  const queue = [start]
  const stack: Frame[] = [{ node: start, next: 0 }]
  const name = (id: string) => labels.get(id) ?? id
  const emit = (description: string, activeNode: string | null = null, activeEdge: string | null = null, path: Path | null = null) => {
    steps.push({
      description, activeNode, activeEdge, path, visitedNodes: [...visited],
      frontier: algorithm === 'bfs' ? [...queue] : stack.map(({ node }) => node),
    })
  }

  const visit = (node: string) => {
    visited.add(node)
    emit(node === target ? `Found target ${name(node)}.` : `Visit node ${name(node)}.`, node)
    if (node !== target) return false
    const path: Path = { nodes: [node], edges: [] }
    for (let parent = parents.get(node); parent; parent = parents.get(parent.node)) {
      path.nodes.push(parent.node)
      path.edges.push(parent.edge)
    }
    path.nodes.reverse()
    path.edges.reverse()
    const length = path.edges.length
    emit(`Trace the path from ${name(start)} to ${name(target)} across ${length} ${length === 1 ? 'edge' : 'edges'}.`, null, null, path)
    return true
  }

  const inspect = (source: string, { node, edge }: Neighbor) => {
    if (discovered.has(node)) {
      emit(`Skip ${name(node)} because it has already been discovered.`, source, edge)
      return false
    }
    discovered.add(node)
    parents.set(node, { node: source, edge })
    return true
  }

  if (algorithm === 'bfs') {
    emit(`Add start node ${name(start)} to the queue.`)
    while (queue.length) {
      const node = queue.shift()!
      if (visit(node)) return steps
      for (const neighbor of adjacent.get(node) ?? []) {
        if (!inspect(node, neighbor)) continue
        queue.push(neighbor.node)
        emit(`Follow the edge to ${name(neighbor.node)} and add it to the queue.`, node, neighbor.edge)
      }
    }
  } else {
    emit(`Push start node ${name(start)} onto the stack.`)
    while (stack.length) {
      const frame = stack[stack.length - 1]
      if (!visited.has(frame.node) && visit(frame.node)) return steps
      const neighbor = adjacent.get(frame.node)?.[frame.next++]
      if (!neighbor) {
        stack.pop()
        emit(`Backtrack from ${name(frame.node)} after checking its neighbors.`, frame.node)
      } else if (inspect(frame.node, neighbor)) {
        stack.push({ node: neighbor.node, next: 0 })
        emit(`Follow the edge to ${name(neighbor.node)} and push it onto the stack.`, frame.node, neighbor.edge)
      }
    }
  }

  emit(`There is no path from ${name(start)} to ${name(target)}.`)
  return steps
}

export const bfs = (graph: Graph, start: string, target: string) => traverse(graph, 'bfs', start, target)
export const dfs = (graph: Graph, start: string, target: string) => traverse(graph, 'dfs', start, target)
