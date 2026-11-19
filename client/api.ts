import type { Graph, GraphSummary, SavedGraph } from '../shared/graph'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export const listGraphs = (signal: AbortSignal) => request<GraphSummary[]>('/api/graphs', { signal })
export const getGraph = (id: string, signal: AbortSignal) => request<SavedGraph>(`/api/graphs/${encodeURIComponent(id)}`, { signal })
export const saveGraph = (graph: Graph) => request<{ id: string }>('/api/graphs', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(graph),
})
