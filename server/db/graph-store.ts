import { DurableObject } from 'cloudflare:workers'
import type { Graph, GraphSummary, SavedGraph } from '../../shared/graph'
import type { Env } from '../../worker'

type SummaryRow = {
  id: string
  title: string
  is_directed: number
  is_weighted: number
  created_at: string
  node_count: number
  edge_count: number
}

type GraphRow = Omit<SummaryRow, 'node_count' | 'edge_count'> & { graph_data: string }

function metadata(row: GraphRow | SummaryRow) {
  return {
    id: row.id,
    title: row.title,
    isDirected: Boolean(row.is_directed),
    isWeighted: Boolean(row.is_weighted),
    createdAt: row.created_at,
  }
}

export class GraphStore extends DurableObject<Env> {
  private readonly sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS graphs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        is_directed INTEGER NOT NULL,
        is_weighted INTEGER NOT NULL,
        graph_data TEXT NOT NULL CHECK (json_valid(graph_data)),
        created_at TEXT NOT NULL
      )
    `)
    this.sql.exec('CREATE INDEX IF NOT EXISTS graphs_recent ON graphs (created_at DESC, id DESC)')
  }

  save(graph: Graph): string {
    const id = crypto.randomUUID()
    this.sql.exec(
      'INSERT INTO graphs (id, title, is_directed, is_weighted, graph_data, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, graph.title, Number(graph.isDirected), Number(graph.isWeighted),
      JSON.stringify({ nodes: graph.nodes, edges: graph.edges }), new Date().toISOString(),
    )
    return id
  }

  get(id: string): SavedGraph | null {
    const row = this.sql.exec<GraphRow>('SELECT * FROM graphs WHERE id = ?', id).toArray()[0]
    if (!row) return null
    const data = JSON.parse(row.graph_data) as Pick<Graph, 'nodes' | 'edges'>
    return { ...metadata(row), ...data }
  }

  list(): GraphSummary[] {
    return this.sql.exec<SummaryRow>(`
      SELECT id, title, is_directed, is_weighted, created_at,
        json_array_length(graph_data, '$.nodes') AS node_count,
        json_array_length(graph_data, '$.edges') AS edge_count
      FROM graphs ORDER BY created_at DESC, id DESC LIMIT 20
    `).toArray().map((row) => ({
      ...metadata(row), nodeCount: row.node_count, edgeCount: row.edge_count,
    }))
  }
}
