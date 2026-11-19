import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { GRAPH_HEIGHT, GRAPH_WIDTH, MAX_EDGES, MAX_NODES, MAX_TITLE_LENGTH } from '../../shared/graph'
import type { AppContext, Env } from '../../worker'

const key = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/)
const graphSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  isDirected: z.boolean(),
  isWeighted: z.boolean(),
  nodes: z.array(z.object({
    id: key,
    label: z.string().trim().min(1).max(24),
    x: z.number().min(0).max(GRAPH_WIDTH),
    y: z.number().min(0).max(GRAPH_HEIGHT),
  })).max(MAX_NODES),
  edges: z.array(z.object({
    id: key, source: key, target: key, weight: z.number().default(1),
  })).max(MAX_EDGES),
}).superRefine(({ nodes, edges }, ctx) => {
  const nodeIds = new Set(nodes.map(({ id }) => id))
  if (nodeIds.size !== nodes.length) ctx.addIssue({ code: 'custom', path: ['nodes'], message: 'Node IDs must be unique' })
  const edgeIds = new Set<string>()
  for (const [index, edge] of edges.entries()) {
    if (edgeIds.has(edge.id)) ctx.addIssue({ code: 'custom', path: ['edges', index, 'id'], message: 'Edge IDs must be unique' })
    edgeIds.add(edge.id)
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      ctx.addIssue({ code: 'custom', path: ['edges', index], message: 'Both endpoints must be existing nodes' })
    }
  }
})

function graphStore(env: Env) {
  return env.GRAPH_STORE.getByName(`app:${env.DEEPSPACE_APP_ID}`)
}

export const graphRoutes = new Hono<AppContext>()

graphRoutes.get('/', async (c) => c.json(await graphStore(c.env).list()))

graphRoutes.get('/:id', async (c) => {
  const id = z.uuid().safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'Graph not found' }, 404)
  const graph = await graphStore(c.env).get(id.data)
  return graph ? c.json(graph) : c.json({ error: 'Graph not found' }, 404)
})

graphRoutes.post('/', bodyLimit({
  maxSize: 64 * 1024,
  onError: (c) => c.json({ error: 'Graph exceeds the upload size limit' }, 413),
}), async (c) => {
  let input: unknown
  try {
    input = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }
  const graph = graphSchema.safeParse(input)
  if (!graph.success) {
    const issue = graph.error.issues[0]
    const field = issue.path.join('.')
    return c.json({ error: field ? `${field}: ${issue.message}` : issue.message }, 400)
  }
  const id = await graphStore(c.env).save(graph.data)
  return c.json({ id }, 201, { Location: `/api/graphs/${id}` })
})
