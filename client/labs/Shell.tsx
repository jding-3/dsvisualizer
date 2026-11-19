import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Playback } from '../components/Playback'
import { LearningResources } from './LearningResources'

const sections = [
  { name: 'Graphs', path: '/graphs', description: 'Build and share graphs, or edit edges in the adjacency matrix. Choose a start and target to trace breadth-first or depth-first search.' },
  { name: 'Trees', path: '/trees', description: 'Insert, search, or delete values in a binary search tree. Follow its branches or watch an in-order, pre-order, or post-order traversal.' },
  { name: 'Hashing', path: '/hashing', description: 'Insert, find, or delete keys. Watch them land in buckets and resolve collisions with separate chaining or linear probing.' },
  { name: 'Arrays', path: '/arrays', description: 'Enter or randomize values. Watch Bubble Sort swap neighbors, Merge Sort combine halves, or Binary Search narrow a sorted range.' },
]

function Navigation() {
  return <header className="lab-nav"><div className="lab-nav-inner">
    <a className="brand" href="/" aria-label="DSvisualizer homepage"><img src="/graphlab.svg" alt="" width="32" height="32" /> DSvisualizer</a>
  </div></header>
}

function Diagram({ name }: { name: string }) {
  return <svg viewBox="0 0 220 105" aria-hidden="true" className="home-diagram">
    {name === 'Graphs' && <><path d="M38 58 100 85 177 59 137 23 38 58 100 85 137 23" /><circle cx="38" cy="58" r="11" /><circle cx="100" cy="85" r="9" /><circle cx="137" cy="23" r="10" /><circle cx="177" cy="59" r="12" /></>}
    {name === 'Trees' && <><path d="M110 23 67 63M110 23l43 40M67 63 41 88M67 63l26 25" /><circle cx="110" cy="23" r="10" /><circle cx="67" cy="63" r="9" /><circle cx="153" cy="63" r="9" /><circle cx="41" cy="88" r="7" /><circle cx="93" cy="88" r="7" /></>}
    {name === 'Hashing' && <><rect x="38" y="19" width="34" height="25" rx="4" /><rect x="38" y="54" width="34" height="25" rx="4" /><path d="M72 31h22m35 0h21" /><rect x="94" y="19" width="35" height="25" rx="4" /><rect x="150" y="19" width="35" height="25" rx="4" /></>}
    {name === 'Arrays' && <><path d="M31 90h158" />{[32, 62, 44, 78, 54].map((height, i) => <rect key={i} x={40 + i * 29} y={90 - height} width="18" height={height} rx="3" />)}</>}
  </svg>
}

export function Home() {
  return <div className="lab-site"><Navigation /><main className="lab-home">
    <section className="lab-about" id="about" aria-label="About DSvisualizer">
      <h1>DSvisualizer</h1>
      <p>Learn data structures by building them. Choose a workspace, try the sample or enter your own data, then play or step through an algorithm to see each decision.</p>
    </section>
    <div className="lab-options">{sections.map(({ name, path, description }) => {
      const slug = path.slice(1)
      return <a className="lab-option" key={path} href={path} aria-labelledby={`${slug}-title`} aria-describedby={`${slug}-description`}>
        <Diagram name={name} />
        <div className="lab-option-copy">
          <h2 id={`${slug}-title`}>{name}</h2>
          <p id={`${slug}-description`}>{description}</p>
        </div>
        <ChevronRight className="lab-option-arrow" size={18} aria-hidden="true" />
      </a>
    })}</div>
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
