import { useState } from 'react'
import { LabShell, numeric } from './Shell'
import { arrayTrace, isAscending, MAX_ARRAY_SIZE, parseArray, sortedCopy } from './array'
import type { ArrayAlgorithm, ArrayStep } from './array'
import { useLab } from './useLab'
import { useVisibleStep } from './useVisibleStep'

const example = [34, -12, 58, 17, 42, 0, 27, 9]

export function ArrayLab() {
  const lab = useLab<number[], ArrayStep>('arrays', example)
  const [draft, setDraft] = useState<string | null>(null)
  const [size, setSize] = useState(lab.data.length)
  const [algorithm, setAlgorithm] = useState<ArrayAlgorithm>('bubble')
  const [targetInput, setTargetInput] = useState('')
  const input = draft ?? lab.data.join(', ')
  const parsed = parseArray(input)
  const target = numeric(targetInput)
  const requiresSort = algorithm === 'binary' && parsed && !isAscending(parsed)
  const values = lab.state
  const largest = Math.max(1, ...values.map(Math.abs))
  const window = lab.step?.window
  const viewport = useVisibleStep(lab.step)

  function run() {
    if (!parsed || requiresSort || (algorithm === 'binary' && target === null)) return
    if (draft !== null) { lab.replace(parsed); setSize(parsed.length); setDraft(null) }
    lab.start(arrayTrace(parsed, algorithm, target ?? 0), algorithm !== 'binary')
  }

  return <LabShell {...lab} description={lab.step?.description} title="Arrays"
    subtitle="Sort values or search an ascending array."
    controls={<>
      <label className="array-input">Array values <input value={input} onChange={(event) => { lab.cancel(); setDraft(event.target.value) }} /></label>
      <button className="button" disabled={draft === null || !parsed} onClick={() => {
        if (!parsed) return
        lab.replace(parsed); setSize(parsed.length); setDraft(null)
      }}>Apply array</button>
      <label>Size <input type="range" min="1" max={MAX_ARRAY_SIZE} value={size} onChange={(event) => setSize(Number(event.target.value))} /><output>{size}</output></label>
      <button className="button" onClick={() => { lab.replace(Array.from({ length: size }, () => Math.floor(Math.random() * 199) - 99)); setDraft(null) }}>Randomize Array</button>
      <label>Algorithm <select value={algorithm} onChange={(event) => { lab.cancel(); setAlgorithm(event.target.value as ArrayAlgorithm) }}>
        <option value="bubble">Bubble Sort</option><option value="merge">Merge Sort</option><option value="binary">Binary Search</option>
      </select></label>
      {algorithm === 'binary' && <label>Target <input value={targetInput} inputMode="decimal" onChange={(event) => setTargetInput(event.target.value)} /></label>}
      <button className="button primary" onClick={run} disabled={!parsed || Boolean(requiresSort) || (algorithm === 'binary' && target === null)}>Run</button>
      {!parsed && <p className="lab-feedback">Enter 1–24 numbers separated by commas.</p>}
      {algorithm === 'binary' && targetInput.trim() && target === null && <p className="lab-feedback">Enter a finite target number.</p>}
      {requiresSort && <div className="lab-notice"><p>Binary Search needs an ascending array.</p><button className="button" onClick={() => {
        if (!parsed) return
        lab.replace(sortedCopy(parsed)); setSize(parsed.length); setDraft(null)
      }}>Sort ascending</button></div>}
    </>}>
    <div className="array-scroll" ref={viewport}><ol className="array-plot" aria-label="Array bars">
      {values.map((value, index) => {
        const active = lab.step?.active?.includes(index)
        const range = lab.step?.range
        const inRange = window ? index >= window.low && index <= window.high : range && index >= range[0] && index <= range[1]
        const pointers = window ? (['low', 'mid', 'high'] as const).filter((pointer) => window[pointer] === index) : []
        const split = lab.step?.split
        const rangeClass = inRange ? (split !== undefined && index > split ? 'array-range-right' : 'array-range') : ''
        const highlight = lab.step?.found === index ? 'lab-found' : active ? 'lab-active' : ''
        return <li key={index} className={`${rangeClass} ${highlight}`} data-step-focus={highlight ? true : undefined}>
          <span className="array-value" title={String(value)}>{value}</span>
          <div className="array-bar-track"><span className={value < 0 ? 'negative' : undefined} style={{ height: `${Math.max(2, Math.abs(value / largest) * 48)}%` }} /></div>
          <span className="array-index">{index}</span><span className="array-pointers">{pointers.join(' ')}</span>
        </li>
      })}
    </ol></div>
  </LabShell>
}
