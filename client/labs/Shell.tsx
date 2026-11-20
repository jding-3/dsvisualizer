import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Playback } from '../components/Playback'
import { HomePreview } from './HomePreview'
import { LearningResources } from './LearningResources'
import { previews } from './homePreviews'

const sections = [
  { name: 'Graphs', slug: 'graphs', description: 'Build and share graphs, or edit edges in the adjacency matrix. Choose a start and target to trace breadth-first or depth-first search.' },
  { name: 'Trees', slug: 'trees', description: 'Insert, search, or delete values in a binary search tree. Follow its branches or watch an in-order, pre-order, or post-order traversal.' },
  { name: 'Hashing', slug: 'hashing', description: 'Insert, find, or delete keys. Watch them land in buckets and resolve collisions with separate chaining or linear probing.' },
  { name: 'Arrays', slug: 'arrays', description: 'Enter or randomize values. Watch Bubble Sort swap neighbors, Merge Sort combine halves, or Binary Search narrow a sorted range.' },
] as const

function Navigation() {
  return <header className="lab-nav"><div className="lab-nav-inner">
    <a className="brand" href="/" aria-label="DSvisualizer homepage"><img src="/graphlab.svg" alt="" width="32" height="32" /> DSvisualizer</a>
  </div></header>
}

export function Home() {
  const tagline = useRef<HTMLParagraphElement>(null)
  const options = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState<string[]>([])

  useLayoutEffect(() => {
    const rows = Array.from(options.current!.querySelectorAll<HTMLElement>('.lab-option-row'))
    const inView = new Set<Element>()
    let introFinished = false
    let revealing = false
    let disposed = false

    function afterAnimation(element: Element, onFinish: () => void) {
      void Promise.allSettled(element.getAnimations().map((animation) => animation.finished)).then(() => {
        if (!disposed) onFinish()
      })
    }

    function revealNext() {
      if (!introFinished || revealing) return
      const row = rows.find((option) => option.dataset.reveal === 'waiting' && inView.has(option))
      if (!row) return

      revealing = true
      observer.unobserve(row)
      inView.delete(row)
      row.dataset.reveal = 'revealing'
      afterAnimation(row, () => {
        row.dataset.reveal = 'shown'
        setRevealed((previous) => [...previous, row.dataset.topic!])
        revealing = false
        revealNext()
      })
    }

    const observer = new IntersectionObserver((entries) => {
      for (const { target, intersectionRatio } of entries) {
        if (intersectionRatio >= 0.1) inView.add(target)
        else inView.delete(target)
      }
      revealNext()
    }, { threshold: 0.1 })

    for (const row of rows) {
      row.dataset.reveal = 'waiting'
      observer.observe(row)
    }
    afterAnimation(tagline.current!, () => {
      introFinished = true
      revealNext()
    })
    return () => {
      disposed = true
      observer.disconnect()
      rows.forEach((row) => delete row.dataset.reveal)
    }
  }, [])

  return <div className="lab-site lab-site-home"><Navigation /><main className="lab-home">
    <section className="lab-about" id="about" aria-label="About DSvisualizer">
      <h1>DSvisualizer</h1>
      <p ref={tagline}>Build data structures and see how algorithms work, one step at a time.</p>
    </section>
    <div className="lab-options" ref={options}>{sections.map(({ name, slug, description }) => (
      <section className="lab-option-row" data-topic={slug} key={slug} aria-labelledby={`${slug}-title`}>
        <HomePreview {...previews[slug]} ready={revealed.includes(slug)} />
        <a className="lab-option" href={`/${slug}`} aria-labelledby={`${slug}-title`} aria-describedby={`${slug}-description`}>
          <h2 id={`${slug}-title`}>{name}</h2>
          <p id={`${slug}-description`}>{description}</p>
          <span className="lab-option-cta" aria-hidden="true">Explore {name.toLowerCase()} <ArrowRight size={18} /></span>
        </a>
      </section>
    ))}</div>
    <LearningResources />
  </main></div>
}

type LabShellProps = {
  title: string; subtitle: string; controls: ReactNode; children: ReactNode; details?: ReactNode;
  description?: string; length: number; playback: Parameters<typeof Playback>[0]['playback']; pending: boolean;
  cancel: () => void; feedback?: string;
}

export function LabShell({ title, subtitle, controls, children, details, description, length, playback, pending, cancel, feedback }: LabShellProps) {
  return <div className="lab-site"><Navigation /><main className="lab-page">
    <h1>{title}</h1><p className="lab-subtitle">{subtitle}</p>
    <section className="lab-board" aria-label={title}>
      <div className="lab-controls">{controls}{feedback && <p className="lab-feedback" role="status">{feedback}</p>}</div>
      <div className="lab-visual">{children}</div>
      <Playback playback={playback} length={length} />
      <div className="lab-decision">
        <div><h2>Current step</h2><p>{description ?? 'Choose an operation to see its steps.'}</p></div>
        {pending && <button type="button" className="button" onClick={cancel}>Cancel run</button>}
        {details}
      </div>
    </section>
  </main></div>
}

export function numeric(value: string) {
  return value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null
}
