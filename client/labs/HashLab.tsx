import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { buildHashTable, hashTrace } from './hash'
import type { HashMode, HashOperation, HashStep, HashTable } from './hash'
import { LabShell } from './Shell'
import { useLab } from './useLab'

const example = buildHashTable([{ key: 'a', value: 'Apple' }, { key: 'h', value: 'Honey' }], 7, 'chain')!
const operations = [['insert', 'Insert'], ['search', 'Search'], ['delete', 'Delete']] as const

export function HashLab() {
  const lab = useLab<HashTable, HashStep>('hashing', example)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  const calculation = lab.step?.calculation

  function run(operation: HashOperation) {
    setFeedback('')
    lab.start(hashTrace(lab.data, operation, { key, value }), operation !== 'search')
  }

  function rehash(size: number, mode: HashMode) {
    const entries = lab.data.buckets.flatMap((bucket) => bucket === 'deleted' ? [] : bucket)
    const next = buildHashTable(entries, size, mode)
    if (!next) return setFeedback(`Linear probing needs ${entries.length} buckets for these entries. Delete an entry or keep separate chaining.`)
    lab.replace(next)
    setFeedback(`Rehashed ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}.`)
  }

  return <LabShell {...lab} description={lab.step?.description} path="/hashing" title="Hash tables"
    subtitle="Find out where keys land and what happens when they collide." feedback={feedback}
    controls={<>
      <label>Buckets <select value={lab.data.size} onChange={(event) => rehash(Number(event.target.value), lab.data.mode)}>
        {[7, 8, 9, 10, 11].map((size) => <option key={size}>{size}</option>)}
      </select></label>
      <label>Collision handling <select value={lab.data.mode} onChange={(event) => rehash(lab.data.size, event.target.value as HashMode)}>
        <option value="chain">Separate Chaining</option><option value="probe">Linear Probing</option>
      </select></label>
      <label>Key <input value={key} onChange={(event) => setKey(event.target.value)} maxLength={64} /></label>
      <label>Value <input value={value} onChange={(event) => setValue(event.target.value)} maxLength={100} /></label>
      <div className="lab-actions">{operations.map(([operation, label]) => <button className="button" key={operation}
        disabled={!key.trim() || (operation === 'insert' && !value.trim())} onClick={() => run(operation)}>{label}</button>)}</div>
    </>}
    details={calculation && <dl className="lab-readout"><div><dt>Landing bucket</dt><dd>{`hash(${calculation.key}) % ${lab.state.size} = ${calculation.hash} % ${lab.state.size} = ${calculation.index}`}</dd></div></dl>}>
    <ol className="hash-buckets" aria-label="Hash table buckets">
      {lab.state.buckets.map((bucket, index) => (
        <li key={index} className={lab.step?.bucket === index ? 'lab-active' : undefined}>
          <span className="bucket-index" aria-label={`Bucket ${index}`}>{index}</span>
          {bucket === 'deleted' ? <span className="bucket-empty">Deleted marker</span> : !bucket.length ? <span className="bucket-empty">Empty</span> : (
            <div className="bucket-chain">{bucket.map(({ key, value }, position) => <div key={key} className="bucket-link">
              {position > 0 && <ArrowRight size={14} aria-hidden="true" />}
              <span className={lab.step?.bucket === index && lab.step.entry === position ? 'lab-active' : undefined}><strong>{key}</strong> {value}</span>
            </div>)}</div>
          )}
        </li>
      ))}
    </ol>
  </LabShell>
}
