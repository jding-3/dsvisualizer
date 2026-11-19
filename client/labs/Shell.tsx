import type { ReactNode } from 'react'
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
  return <div className="lab-site lab-site-home"><Navigation /><main className="lab-home">
    <section className="lab-about" id="about" aria-label="About DSvisualizer">
      <h1>DSvisualizer</h1>
      <p>Build data structures and see how algorithms work, one step at a time.</p>
    </section>
    <div className="lab-options">{sections.map(({ name, slug, description }) => (
      <section className="lab-option-row" data-topic={slug} key={slug} aria-labelledby={`${slug}-title`}>
        <HomePreview {...previews[slug]} />
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
