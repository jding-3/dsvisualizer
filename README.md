# DSvisualizer

Build data structures and see how algorithms work, one step at a time.

Live at [Link Text](https://graph-visualizer.app.space/)


## Run locally

Use Node 24 and npm 11.6 or newer. Install dependencies and start the local Cloudflare Worker with Vite.

```sh
npm ci
npm run dev:local
```

The local Vite command works before app registration. The DeepSpace CLI workflow (`npm run dev`) and deployment use a signed-in DeepSpace account. The app itself is accessible without sign-in.

```sh
npm run validate
npm run test:e2e
npm run build
```

## Design

- `client/algorithms/` walks an adjacency list and returns independent snapshots. BFS finds a route with the fewest edges. DFS follows a branch to completion before backtracking. Both honor direction and ignore edge weights.
- `client/hooks/` holds graph editing and playback state. `client/components/` renders the SVG graph, inspector, controls, and sharing dialogs.
- `shared/graph.ts` defines the common graph and API types.
- `server/routes/graphs.ts` validates public REST requests. `server/db/graph-store.ts` stores graph snapshots as JSON in a SQLite `graphs` table inside a DeepSpace-provisioned Durable Object. This keeps the recent list and by-ID lookups in one place.

| Endpoint | Result |
|---|---|
| `POST /api/graphs` | Save `{ title, isDirected, isWeighted, nodes, edges }` and return `{ id }`. |
| `GET /api/graphs/:id` | Read the full snapshot and creation time. |
| `GET /api/graphs` | List up to 20 recent snapshot summaries. |
| `GET /graph/:id` | Open the snapshot in the editor. |

Each save creates a new public snapshot. Editing a loaded graph and saving it gives you a different link, so an existing share URL stays stable. The MVP caps a graph at 60 nodes and 150 edges to keep the editor and snapshot playback responsive. Playback runs locally and opens with the first and last graph nodes selected by default. An authenticated private library would add ownership and listing rules at the API boundary. A weighted shortest-path algorithm would give edge weights a role in playback.

## Learning resources

The optional homepage panel links each workspace to a Wikipedia reference, an MIT OpenCourseWare video on YouTube, and a Python example on GitHub. It reads the checked-in manifest and makes no provider calls for visitors.
