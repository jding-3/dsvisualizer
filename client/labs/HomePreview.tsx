import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import type { Preview } from './homePreviews'

const motionQuery = '(prefers-reduced-motion: reduce)'

export function HomePreview({ title, frames }: Preview) {
  const figure = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'auto' | 'play' | 'paused'>('auto')
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(motionQuery).matches)
  const last = frames.length - 1
  const finished = index === last
  const playing = pageVisible && !reducedMotion && !finished
    && (mode === 'play' || (mode === 'auto' && inView))

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.45), { threshold: 0.45 })
    observer.observe(figure.current!)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const motion = window.matchMedia(motionQuery)
    const updateMotion = () => setReducedMotion(motion.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    motion.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      motion.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    const timeout = window.setTimeout(() => setIndex(index + 1), index === 0 ? 1250 : 880)
    return () => window.clearTimeout(timeout)
  }, [playing, index])

  function control() {
    if (reducedMotion) {
      setMode('paused')
      setIndex(finished ? 0 : index + 1)
    } else if (playing) {
      setMode('paused')
    } else {
      if (finished) setIndex(0)
      setMode('play')
    }
  }

  const label = reducedMotion
    ? (finished ? 'Reset' : 'Next step')
    : (finished ? 'Replay' : playing ? 'Pause' : 'Play')
  const Icon = finished ? RotateCcw : reducedMotion ? SkipForward : playing ? Pause : Play
  const frame = frames[index]

  return <figure ref={figure} className="home-preview">
    <div className="home-preview-header">
      <span className="home-preview-title">{title}</span>
      <button type="button" className="home-preview-control" aria-label={`${label} · ${title} demo`} onClick={control}>
        <Icon size={15} aria-hidden="true" /> {label}
      </button>
    </div>
    <div className="home-preview-stage">{frame.diagram}</div>
    <figcaption className="home-preview-caption">
      <span aria-live={reducedMotion ? 'polite' : 'off'}>{frame.description}</span>
      <span className="home-preview-count" aria-hidden="true">{index + 1} / {frames.length}</span>
    </figcaption>
  </figure>
}
