import type { ReactNode } from 'react'
import { ArrowUpRight, GitFork, Grid2X2, ListOrdered, Network } from 'lucide-react'
import { Playback } from '../components/Playback'

const sections = [
  { name: 'Graphs', path: '/graphs', icon: Network, description: 'Connect nodes and trace breadth-first and depth-first search.' },
  { name: 'Trees', path: '/trees', icon: GitFork, description: 'Build a binary search tree and follow each branch.' },
  { name: 'Hashing', path: '/hashing', icon: Grid2X2, description: 'Watch keys land in buckets and resolve collisions.' },
  { name: 'Arrays', path: '/arrays', icon: ListOrdered, description: 'Compare sorting strategies and trace binary search.' },
]

function Navigation() {
  return <header className="lab-nav"><div className="lab-nav-inner">
    <a className="brand" href="/" aria-label="GraphLab homepage"><img src="/graphlab.svg" alt="" width="32" height="32" /> GraphLab</a>
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
    <h1>Explore data structures</h1>
    <p>Build a structure and step through what the algorithm does.</p>
    <div className="lab-options">{sections.map(({ name, path, description, icon: Icon }) => (
      <a className="lab-option" key={path} href={path}>
        <Diagram name={name} />
        <div className="lab-option-title"><Icon size={19} /><h2>{name}</h2><ArrowUpRight size={17} /></div>
        <p>{description}</p>
      </a>
    ))}</div>
    <section className="lab-about" id="about" aria-labelledby="about-heading">
      <h2 id="about-heading">About GraphLab</h2>
      <p>GraphLab is an interactive way to learn data structures. Build a graph, tree, hash table, or array and use playback to see how each algorithm works, one step at a time.</p>
    </section>
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
