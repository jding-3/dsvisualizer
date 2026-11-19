import { Gauge, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import type { usePlayback } from '../hooks/usePlayback'

export function Playback({ playback, length }: { playback: ReturnType<typeof usePlayback>; length: number }) {
  const { index, playing, speed, setSpeed, seek, togglePlay } = playback
  const last = Math.max(length - 1, 0)
  return <section className="panel playback" aria-label="Playback controls">
    <div className="playback-top">
      <div className="transport">
        <button className="icon-button" aria-label="Reset playback" title="Reset playback" onClick={() => seek(0)} disabled={!length}><RotateCcw size={17} /></button>
        <button className="icon-button" aria-label="Step backward" title="Step backward" onClick={() => seek(index - 1)} disabled={index === 0}><SkipBack size={17} /></button>
        <button className="play-button" onClick={togglePlay} disabled={length < 2}>
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{playing ? 'Pause' : 'Play'}
        </button>
        <button className="icon-button" aria-label="Step forward" title="Step forward" onClick={() => seek(index + 1)} disabled={index === last}><SkipForward size={17} /></button>
      </div>
      <label className="speed-control"><Gauge size={16} /><span>Speed</span>
        <input type="range" min="0.25" max="2.5" step="0.25" value={speed} aria-label="Animation speed" onChange={(event) => setSpeed(Number(event.target.value))} />
        <output>{speed}×</output>
      </label>
    </div>
    <div className="timeline"><span>Playback</span>
      <input type="range" min={0} max={last || 1} value={index} aria-label="Playback position" aria-valuetext={length ? `Step ${index + 1} of ${length}` : 'No steps'}
        disabled={last === 0} onChange={(event) => seek(Number(event.target.value))} />
      <span>{length ? `Step ${index + 1} of ${length}` : 'No steps'}</span>
    </div>
  </section>
}
