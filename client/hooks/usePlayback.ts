import { useEffect, useState } from 'react'

type Run = { revision: number; index: number; running: boolean }

export function usePlayback(length: number, revision: number) {
  const [run, setRun] = useState<Run>({ revision, index: 0, running: false })
  const [speed, setSpeed] = useState(1)
  const last = Math.max(0, length - 1)
  const index = run.revision === revision ? Math.min(run.index, last) : 0
  const playing = run.revision === revision && run.running && index < last

  useEffect(() => {
    if (!playing) return
    const timeout = window.setTimeout(() => {
      setRun({ revision, index: index + 1, running: index + 1 < last })
    }, 820 / speed)
    return () => window.clearTimeout(timeout)
  }, [playing, revision, index, last, speed])

  function seek(step: number) {
    setRun({ revision, index: Math.max(0, Math.min(last, step)), running: false })
  }

  function togglePlay() {
    if (length < 2) return
    setRun({ revision, index: index === last ? 0 : index, running: !playing })
  }

  return { index, playing, speed, setSpeed, seek, togglePlay }
}
