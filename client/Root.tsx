import { App } from './App'
import { ArrayLab } from './labs/ArrayLab'
import { HashLab } from './labs/HashLab'
import { Home } from './labs/Shell'
import { TreeLab } from './labs/TreeLab'
import './labs/styles.css'

export function Root() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path === '/graphs' || /^\/graph\/[^/]+$/.test(path)) return <App />
  if (path === '/trees') return <TreeLab />
  if (path === '/arrays') return <ArrayLab />
  if (path === '/hashing') return <HashLab />
  return <Home />
}
