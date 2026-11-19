import type { Hono } from 'hono'
import { isPlatformReservedPath } from 'deepspace/worker'
import type { AppContext } from '../../worker'

export function registerStaticRoutes(app: Hono<AppContext>) {
  // Unknown REST routes should always receive JSON, including non-GET requests.
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

  app.get('/graph/:id', (c) => {
    const url = new URL('/', c.req.url)
    return c.env.ASSETS.fetch(new Request(url, c.req.raw))
  })

  app.get('*', (c) => {
    if (isPlatformReservedPath(new URL(c.req.url).pathname)) return c.json({ error: 'Not found' }, 404)
    return c.env.ASSETS.fetch(c.req.raw)
  })
}
