import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import checker from 'vite-plugin-checker'
import { CLIENT_DEDUPE, deepspaceBuild } from 'deepspace/build'

const appDir = fileURLToPath(new URL('.', import.meta.url))
// The public client uses the REST API and never needs an embedded app ID.
// Keep the SDK's build cleanup while allowing local work before registration.
const { config: _injectAppId, ...deepSpace } = deepspaceBuild({ appDir })

export default defineConfig({
  plugins: [
    react(),
    cloudflare({ inspectorPort: false, persistState: process.env.GRAPHLAB_TEST === '1' ? false : undefined }),
    deepSpace,
    checker({ eslint: { lintCommand: 'eslint .', useFlatConfig: true } }),
  ],
  resolve: { dedupe: [...CLIENT_DEDUPE] },
})
