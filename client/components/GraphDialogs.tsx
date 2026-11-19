import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight, Check, Copy, FolderOpen, Link2, X } from 'lucide-react'
import type { GraphSummary } from '../../shared/graph'
import { listGraphs } from '../api'

function Modal({ title, icon, onClose, children }: { title: string; icon: ReactNode; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog className="modal" ref={dialog} aria-labelledby="dialog-title"
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal-content">
      <div className="modal-heading"><span className="heading-icon">{icon}</span><h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
      </div>
      {children}
    </div>
  </dialog>
}

export function SavedGraphs({ onClose }: { onClose: () => void }) {
  const [graphs, setGraphs] = useState<GraphSummary[] | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listGraphs(controller.signal).then(setGraphs).catch((reason: Error) => {
      if (!controller.signal.aborted) setError(reason.message)
    })
    return () => controller.abort()
  }, [attempt])

  return <Modal title="Saved graphs" icon={<FolderOpen size={18} />} onClose={onClose}>
    <p>Recently saved graphs are public.</p>
    {error ? <div className="dialog-empty" role="alert">{error}
      <button className="button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Retry</button>
    </div> : graphs === null ? <div className="dialog-empty" role="status">Loading saved graphs…</div>
      : graphs.length === 0 ? <div className="dialog-empty">Use Save &amp; share to add your first graph.</div>
      : <ul className="saved-list">{graphs.map((graph) => <li key={graph.id}>
        <a href={`/graph/${graph.id}`}><span><strong>{graph.title}</strong><small>{graph.nodeCount} nodes, {graph.edgeCount} edges</small></span></a>
      </li>)}</ul>}
  </Modal>
}

export function ShareGraph({ url, initiallyCopied, onClose }: { url: string; initiallyCopied: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(initiallyCopied)
  const [manualCopy, setManualCopy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setManualCopy(false)
    } catch {
      input.current?.focus()
      input.current?.select()
      setManualCopy(true)
    }
  }
  return <Modal title="Share graph" icon={<Link2 size={18} />} onClose={onClose}>
    <p>Anyone with this link can open and explore this saved graph.</p>
    <div className="share-field">
      <input aria-label="Share URL" readOnly value={url} ref={input} onFocus={(event) => event.target.select()} />
      <button className="button primary" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy link'}</button>
    </div>
    {manualCopy && <p role="status">The link is selected. Use your device’s copy command.</p>}
    <a className="open-snapshot" href={url} target="_blank" rel="noreferrer">Open saved graph <ArrowUpRight size={15} /></a>
  </Modal>
}
