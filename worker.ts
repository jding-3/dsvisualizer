import { Hono } from 'hono'
import { RecordRoom, workerErrorHandler } from 'deepspace/worker'
import type { DOManifest } from 'deepspace/worker'
import { GraphStore } from './server/db/graph-store'
import { usersSchema } from './server/db/users-schema'
import { graphRoutes } from './server/routes/graphs'
import { registerStaticRoutes } from './server/routes/static'

// DeepSpace uses this manifest to provision the production bindings.
export const __DO_MANIFEST__ = [
  { binding: 'RECORD_ROOMS', className: 'AppRecordRoom', sqlite: true },
  { binding: 'GRAPH_STORE', className: 'GraphStore', sqlite: true },
] as const satisfies DOManifest

export { GraphStore }

export interface Env {
  ASSETS: Fetcher
  GRAPH_STORE: DurableObjectNamespace<GraphStore>
  RECORD_ROOMS: DurableObjectNamespace
  DEEPSPACE_APP_ID: string
  OWNER_USER_ID: string
}

// The SDK user schema is ready for a future authenticated workspace.
export class AppRecordRoom extends RecordRoom<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, [usersSchema], { ownerUserId: env.OWNER_USER_ID })
  }
}

export type AppContext = { Bindings: Env }

const app = new Hono<AppContext>()
app.route('/api/graphs', graphRoutes)
registerStaticRoutes(app)
app.onError(workerErrorHandler('error'))
export default app
