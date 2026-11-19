import { describe, expect, it } from 'vitest'
import type { Graph } from '../../shared/graph'
import { bfs, dfs } from './traversal'

const graph: Graph = {
  title: 'Two routes', isDirected: true, isWeighted: true,
  nodes: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id.toUpperCase(), x: 0, y: 0 })),
  edges: [
    { id: 'ab', source: 'a', target: 'b', weight: 1 },
    { id: 'bc', source: 'b', target: 'c', weight: 1 },
    { id: 'cd', source: 'c', target: 'd', weight: 1 },
    { id: 'ad', source: 'a', target: 'd', weight: 100 },
    { id: 'ca', source: 'c', target: 'a', weight: 1 },
  ],
}

describe('traversal snapshots', () => {
  it('BFS keeps earlier queue snapshots and finds the fewest-edge path regardless of weights', () => {
    const input = structuredClone(graph)
    const steps = bfs(input, 'a', 'd')
    expect(steps[0]).toMatchObject({ visitedNodes: [], frontier: ['a'] })
    expect(steps.find(({ activeEdge }) => activeEdge === 'ad')?.frontier).toEqual(['b', 'd'])
    expect(steps.at(-1)?.path).toEqual({ nodes: ['a', 'd'], edges: ['ad'] })
    expect(input).toEqual(graph)
  })

  it('DFS follows the first branch to completion and exposes the active stack', () => {
    const steps = dfs(graph, 'a', 'd')
    expect(steps.find(({ activeEdge }) => activeEdge === 'bc')?.frontier).toEqual(['a', 'b', 'c'])
    expect(steps.at(-1)?.path).toEqual({ nodes: ['a', 'b', 'c', 'd'], edges: ['ab', 'bc', 'cd'] })
  })

  it.each([bfs, dfs])('handles direction, cycles, self-targets, and missing nodes', (run) => {
    const unreachable = run(graph, 'd', 'a').at(-1)
    expect(unreachable?.description).toContain('no path')
    expect(unreachable?.frontier).toEqual([])
    expect(run({ ...graph, isDirected: false }, 'd', 'a').at(-1)?.path?.nodes).toContain('a')
    expect(run(graph, 'a', 'a').at(-1)?.path).toEqual({ nodes: ['a'], edges: [] })
    expect(run(graph, 'missing', 'a')).toEqual([])
    const cyclic = { ...graph, edges: graph.edges.filter(({ target }) => target !== 'd') }
    expect(run(cyclic, 'a', 'd').at(-1)?.visitedNodes).toEqual(['a', 'b', 'c'])
  })
})
