import { useEffect, useRef, useState } from 'react'
import type { Preview } from './homePreviews'

const motionQuery = '(prefers-reduced-motion: reduce)'

export function HomePreview({ title, frames }: Preview) {
  const figure = useRef<HTMLElement>(null)
  const last = frames.length - 1
  const [index, setIndex] = useState(() => window.matchMedia(motionQuery).matches ? last : 0)

  useEffect(() => {
    const card = figure.current!
    const header = card.closest('.lab-site-home')?.querySelector('.lab-nav')
    const motion = window.matchMedia(motionQuery)
    let observer: IntersectionObserver
    let fullyVisible = false
    let timeout: number | undefined

    function schedule(step: number) {
      const delay = step === last ? 1800 : step === 0 ? 1250 : 880
      timeout = window.setTimeout(() => {
        const next = step === last ? 0 : step + 1
        setIndex(next)
        schedule(next)
      }, delay)
    }

    function restart() {
      window.clearTimeout(timeout)
      setIndex(motion.matches ? last : 0)
      if (fullyVisible && !document.hidden && !motion.matches) schedule(0)
    }

    function observe() {
      observer?.disconnect()
      const inset = Math.ceil(header?.getBoundingClientRect().height ?? 0)
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const visible = entry.isIntersecting && entry.intersectionRatio === 1
          if (visible === fullyVisible) continue
          fullyVisible = visible
          restart()
        }
      }, { rootMargin: `-${inset}px 0px 0px`, threshold: 1 })
      observer.observe(card)
    }

    observe()
    const headerResize = new ResizeObserver(observe)
    if (header) headerResize.observe(header)
    motion.addEventListener('change', restart)
    document.addEventListener('visibilitychange', restart)
    return () => {
      observer.disconnect()
      headerResize.disconnect()
      motion.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', restart)
      window.clearTimeout(timeout)
    }
  }, [last])

  const frame = frames[index]
  return <figure ref={figure} className="home-preview">
    <span className="home-preview-title">{title}</span>
    <div className="home-preview-stage">{frame.diagram}</div>
    <figcaption className="home-preview-caption">
      <span>{frame.description}</span>
      <span className="home-preview-count" aria-hidden="true">{index + 1} / {frames.length}</span>
    </figcaption>
  </figure>
}
