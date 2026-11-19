import type { ReactNode } from 'react'
import type { Graph } from '../../shared/graph'
import { bfs } from '../algorithms/traversal'
import { arrayTrace } from './array'
import { buildHashTable, hashTrace } from './hash'
import { buildTree, layoutTree, treeTrace } from './tree'

type Point = { x: number; y: number }
type Tone = 'idle' | 'queued' | 'visited' | 'active' | 'result'
type PreviewNode = Point & { id: string | number; label: string | number; tone: Tone }
type PreviewEdge = { id: string | number; from: Point; to: Point; tone: Tone }

export type Preview = {
  title: string
  frames: { description: string; diagram: ReactNode }[]
}

function Diagram({ children }: { children: ReactNode }) {
  return <svg className="home-preview-diagram" viewBox="0 0 400 184" aria-hidden="true">{children}</svg>
}

function Network({ nodes, edges }: { nodes: PreviewNode[]; edges: PreviewEdge[] }) {
  return <Diagram>
    {edges.map(({ id, from, to, tone }) => <g key={id} data-tone={tone}>
      <path className="preview-line" d={`M${from.x} ${from.y}L${to.x} ${to.y}`} />
      <path className="preview-line-accent" d={`M${from.x} ${from.y}L${to.x} ${to.y}`} />
    </g>)}
    {nodes.map(({ id, label, x, y, tone }) => <g key={id} transform={`translate(${x} ${y})`} data-tone={tone}>
      <circle className="preview-node" r="19" />
      <circle className="preview-node-accent" r="19" />
      <text className="preview-label" y="1" dominantBaseline="middle" textAnchor="middle">{label}</text>
    </g>)}
  </Diagram>
}

const graph: Graph = {
  title: 'Diamond graph',
  isDirected: false,
  isWeighted: false,
  nodes: [
    { id: 'A', label: 'A', x: 76, y: 92 },
    { id: 'B', label: 'B', x: 200, y: 31 },
    { id: 'C', label: 'C', x: 200, y: 153 },
    { id: 'D', label: 'D', x: 324, y: 92 },
  ],
  edges: [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 1 },
    { id: 'BD', source: 'B', target: 'D', weight: 1 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
  ],
}
const graphPoints = new Map(graph.nodes.map((node) => [node.id, node]))
const graphPreview: Preview = {
  title: 'Breadth-first search',
  frames: bfs(graph, 'A', 'D')
    .filter((step, index, steps) => !step.activeEdge || step.frontier.length > steps[index - 1].frontier.length)
    .map((step, index) => {
      const nodes = graph.nodes.map((node): PreviewNode => ({
        ...node,
        tone: step.path?.nodes.includes(node.id) ? 'result'
          : step.activeNode === node.id ? 'active'
          : step.frontier.includes(node.id) ? 'queued'
          : step.visitedNodes.includes(node.id) ? 'visited' : 'idle',
      }))
      const edges = graph.edges.map(({ id, source, target }): PreviewEdge => ({
        id, from: graphPoints.get(source)!, to: graphPoints.get(target)!,
        tone: step.path?.edges.includes(id) ? 'result' : step.activeEdge === id ? 'active' : 'idle',
      }))
      return {
        description: step.path ? `Shortest path: ${step.path.nodes.join(' → ')}.`
          : index === 0 ? 'Start at A and look for the shortest path to D.' : step.description,
        diagram: <Network nodes={nodes} edges={edges} />,
      }
    }),
}

const tree = buildTree([8, 3, 12, 1, 6, 10, 14])
const treeNodes = layoutTree(tree).map(({ column, depth, ...node }) => ({
  ...node, x: 56 + column * 48, y: 30 + depth * 62,
}))
const treePoints = new Map(treeNodes.map((node) => [node.value, node]))
const treePreview: Preview = {
  title: 'Binary search tree',
  frames: treeTrace(tree, 'search', 6).map((step, index, steps) => {
    const visited = new Set(steps.slice(0, index + 1).map(({ active }) => active))
    const nodes = treeNodes.map((node): PreviewNode => ({
      ...node, id: node.value, label: node.value,
      tone: step.found === node.value ? 'result' : step.active === node.value ? 'active' : visited.has(node.value) ? 'visited' : 'idle',
    }))
    const edges = treeNodes.filter(({ parent }) => parent !== undefined).map((node): PreviewEdge => ({
      id: node.value, from: treePoints.get(node.parent!)!, to: node,
      tone: visited.has(node.value) ? (step.found === node.value ? 'result' : 'active') : 'idle',
    }))
    return {
      description: index === 0 ? 'Find the value 6 by following the branches.' : step.description,
      diagram: <Network nodes={nodes} edges={edges} />,
    }
  }),
}

const table = buildHashTable([{ key: 'a', value: 'Apple' }], 7, 'probe')!
const hashPreview: Preview = {
  title: 'Linear probing',
  frames: hashTrace(table, 'insert', { key: 'h', value: 'Honey' }).map((step, index) => ({
    description: index === 0 ? 'Insert h into a table with seven buckets.'
      : step.entry !== undefined && step.state === table ? `Bucket ${step.bucket} is occupied. Try the next bucket.`
      : step.description,
    diagram: <Diagram>
      <text className="preview-formula" x="200" y="53" textAnchor="middle">
        {step.calculation ? `${step.calculation.hash} % ${table.size} = ${step.calculation.index}` : `hash(h) % ${table.size}`}
      </text>
      {step.state.buckets.map((bucket, position) => {
        const key = bucket === 'deleted' ? undefined : bucket[0]?.key
        const tone = key === 'h' ? 'result' : position === step.bucket ? 'active' : 'idle'
        return <g key={position} transform={`translate(${24 + 51 * position} 81)`} data-tone={tone}>
          <rect className="preview-node" width="46" height="45" rx="8" />
          <rect className="preview-node-accent" width="46" height="45" rx="8" />
          <text className="preview-label" x="23" y="24" dominantBaseline="middle" textAnchor="middle">{key ?? '·'}</text>
          <text className="preview-index" x="23" y="64" textAnchor="middle">{position}</text>
        </g>
      })}
    </Diagram>,
  })),
}

const array = [2, 7, 4, 5, 9]
const sortSteps = arrayTrace(array, 'bubble')
const arrayPreview: Preview = {
  title: 'Bubble sort',
  frames: sortSteps.filter((step, index, steps) =>
    index === 0 || index === steps.length - 1 || step.state.some((value, i) => value !== steps[index + 1].state[i] || value !== steps[index - 1].state[i]),
  ).map((step, index, steps) => ({
    description: index === 0 ? 'Compare neighbors and swap them when they’re out of order.' : step.description,
    diagram: <Diagram>
      <path className="preview-line" d="M47 151H353" />
      {step.state.map((value, position) => {
        const height = value * 12
        const tone = index === steps.length - 1 ? 'result' : step.active?.includes(position) ? 'active' : 'idle'
        return <g className="preview-bar" key={value} style={{ transform: `translateX(${59 + position * 60}px)` }} data-tone={tone}>
          <rect className="preview-node" y={150 - height} width="42" height={height} rx="6" />
          <rect className="preview-node-accent" y={150 - height} width="42" height={height} rx="6" />
          <text className="preview-label" x="21" y={139 - height} textAnchor="middle">{value}</text>
        </g>
      })}
      {array.map((_, index) => <text className="preview-index" key={index} x={80 + index * 60} y="173" textAnchor="middle">{index}</text>)}
    </Diagram>,
  })),
}

export const previews = { graphs: graphPreview, trees: treePreview, hashing: hashPreview, arrays: arrayPreview }
