import { useEffect, useRef, useState } from 'react'
import { usePlayback } from '../hooks/usePlayback'

type Snapshot<T> = { state: T; description: string }

export function useLab<T, Step extends Snapshot<T>>(name: string, example: T) {
  const storageKey = `graphlab:${name}:1`
  const [data, setData] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      return saved === null ? example : JSON.parse(saved) as T
    } catch {
      return example
    }
  })
  const [run, setRun] = useState<{ steps: Step[]; revision: number; mutates: boolean } | null>(null)
  const revision = useRef(0)
  const finished = useRef(0)
  const playback = usePlayback(run?.steps.length ?? 0, run?.revision ?? revision.current, Boolean(run))
  const step = run?.steps[playback.index]
  const pending = Boolean(run?.mutates && finished.current !== run.revision && playback.index < run.steps.length - 1)

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(data)) } catch { /* Browser storage may be unavailable. */ }
  }, [data, storageKey])

  useEffect(() => {
    if (!run || !run.mutates || finished.current === run.revision || playback.index !== run.steps.length - 1) return
    finished.current = run.revision
    setData(run.steps[run.steps.length - 1].state)
  }, [run, playback.index])

  function replace(next: T) {
    setRun(null)
    setData(next)
  }

  return {
    data, state: step ? step.state : data, step, playback, pending, length: run?.steps.length ?? 0,
    start: (steps: Step[], mutates = false) => setRun({ steps, mutates, revision: ++revision.current }),
    replace, cancel: () => setRun(null),
  }
}
