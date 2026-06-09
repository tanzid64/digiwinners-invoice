import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// `cloudflare:workers` only exists in the Workers (ssr) runtime. Server-fn
// modules transitively import it via the db client; the client build still
// pulls that graph, so stub the virtual module to an inert shape in the client
// environment only. db is lazy, so the stub `env` is never actually accessed.
function stubCloudflareWorkersOnClient(): Plugin {
  const STUB = '\0cloudflare-workers-client-stub'
  return {
    name: 'stub-cloudflare-workers-client',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'cloudflare:workers' && this.environment?.name === 'client') {
        return STUB
      }
    },
    load(id) {
      if (id === STUB) return 'export const env = {};\nexport default {};'
    },
  }
}

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Force one React instance — better-auth/react was pulling a 2nd copy
    // into the SSR bundle, causing "Invalid hook call" / null useContext.
    dedupe: ['react', 'react-dom'],
  },
  ssr: { noExternal: ['better-auth'] },
  plugins: [
    stubCloudflareWorkersOnClient(),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
