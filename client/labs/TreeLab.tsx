import { useState } from 'react'
import { LabShell, numeric } from './Shell'
import { buildTree, layoutTree, MAX_TREE_SIZE, treeSize, treeTrace } from './tree'
import type { Tree, TreeOperation, TreeStep } from './tree'
import { useLab } from './useLab'
import { useVisibleStep } from './useVisibleStep'

const example = buildTree([8, 3, 10, 1, 6, 14, 4, 7, 13])
const operations = [['insert', 'Insert'], ['search', 'Search'], ['delete', 'Delete']] as const
const traversals = [['in-order', 'In-Order'], ['pre-order', 'Pre-Order'], ['post-order', 'Post-Order']] as const

export function TreeLab() {
  const lab = useLab<Tree, TreeStep>('trees', example)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const value = numeric(input)
  const nodes = layoutTree(lab.state)
  const viewport = useVisibleStep(lab.step)
  const position = new Map(nodes.map((node) => [node.value, { x: 35 + node.column * 58, y: 32 + node.depth * 64 }]))
  const width = Math.max(100, 70 + (nodes.length - 1) * 58)
  const height = 64 + Math.max(0, ...nodes.map(({ depth }) => depth)) * 64

  function run(operation: TreeOperation) {
    if (value === null) return
    if (operation === 'insert' && treeSize(lab.data) >= MAX_TREE_SIZE && !layoutTree(lab.data).some((node) => node.value === value)) {
      setFeedback(`This tree can hold ${MAX_TREE_SIZE} nodes. Delete a value before inserting another.`)
      return
    }
    setFeedback('')
    lab.start(treeTrace(lab.data, operation, value), operation !== 'search')
  }

  return <LabShell {...lab} description={lab.step?.description} title="Binary search tree"
    subtitle="Compare values to find the next branch." feedback={feedback}
    controls={<>
      <label>Value <input value={input} inputMode="decimal" placeholder="e.g. 7" onChange={(event) => { setInput(event.target.value); setFeedback('') }} /></label>
      <div className="lab-actions">{operations.map(([operation, label]) => <button className="button" key={operation} disabled={value === null} onClick={() => run(operation)}>{label}</button>)}</div>
      <button className="button" onClick={() => {
        const values = new Set<number>()
        while (values.size < 9) values.add(Math.floor(Math.random() * 99) + 1)
        lab.replace(buildTree([...values]))
        setFeedback('')
      }}>Generate Random BST</button>
      <div className="lab-actions" aria-label="Tree traversals" role="group">{traversals.map(([operation, label]) => (
        <button className="button" key={operation} disabled={!lab.data} onClick={() => { setFeedback(''); lab.start(treeTrace(lab.data, operation)) }}>{label}</button>
      ))}</div>
      {input.trim() && value === null && <p className="lab-feedback">Enter a finite number.</p>}
    </>}
    details={lab.step?.output && <dl className="lab-readout">
      <div><dt>Recursion stack</dt><dd>{lab.step.stack?.join(' → ') || 'Empty'}</dd></div>
      <div><dt>Output</dt><dd>{lab.step.output.join(', ') || 'Empty'}</dd></div>
    </dl>}>
    {nodes.length ? <div className="tree-scroll" ref={viewport}><svg className={nodes.length > 12 ? "tree-plot dense" : "tree-plot"} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Binary search tree with ${nodes.length} nodes`}>
      {nodes.map(({ value, parent }) => {
        if (parent === undefined) return null
        const from = position.get(parent)!
        const to = position.get(value)!
        return <line key={value} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
      })}
      {nodes.map(({ value }) => {
        const point = position.get(value)!
        const label = String(value)
        return <g key={value} data-step-focus={lab.step?.found === value || lab.step?.active === value || undefined} className={lab.step?.found === value ? 'lab-found' : lab.step?.active === value ? 'lab-active' : undefined}>
          <title>{label}</title><circle cx={point.x} cy={point.y} r="24" />
          <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central">{label.length > 7 ? `${label.slice(0, 6)}…` : label}</text>
        </g>
      })}
    </svg></div> : <p className="lab-empty">Insert a value to grow the tree.</p>}
  </LabShell>
}
