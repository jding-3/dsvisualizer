import { expect, test } from '@playwright/test'

const graph = {
  title: 'API round trip', isDirected: true, isWeighted: true,
  nodes: [{ id: 'a', label: 'A', x: 75, y: 95 }, { id: 'b', label: 'B', x: 175, y: 195 }],
  edges: [{ id: 'ab', source: 'a', target: 'b', weight: 3.5 }],
}

test('saves, loads, and lists a graph without authentication', async ({ request }) => {
  const response = await request.post('/api/graphs', { data: graph })
  expect(response.status()).toBe(201)
  const { id } = await response.json()
  expect(response.headers().location).toBe(`/api/graphs/${id}`)
  const record = await request.get(`/api/graphs/${id}`)
  expect(await record.json()).toMatchObject({ ...graph, id, createdAt: expect.any(String) })
  const recent = await request.get('/api/graphs')
  expect(await recent.json()).toContainEqual(expect.objectContaining({ id, nodeCount: 2, edgeCount: 1 }))
})

test('rejects a dangling edge and returns a JSON 404 for unknown IDs', async ({ request }) => {
  const invalid = await request.post('/api/graphs', { data: { ...graph, nodes: graph.nodes.slice(0, 1) } })
  expect(invalid.status()).toBe(400)
  expect(await invalid.json()).toMatchObject({ error: expect.stringContaining('endpoints') })
  const missing = await request.get('/api/graphs/70ef1179-2d6b-4c36-9754-a847b4489fa0')
  expect(missing.status()).toBe(404)
  expect(await missing.json()).toEqual({ error: 'Graph not found' })
})
