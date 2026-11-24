import { cpSync, existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const CONTENT_ROOT = fileURLToPath(new URL('../content', import.meta.url))

/**
 * The first-party packs (base, tutorial) served at /content, like the game
 * serves them. The Studio starts drafts from base scenarios and checks drafts
 * against base, and fetching from its own site keeps its CSP at 'self'
 * (docs/PACK_STUDIO.md, M4.3). Dev serves the repository's content folder;
 * a build copies it into dist.
 */
function firstPartyContent(): Plugin {
  let outDir = ''
  return {
    name: 'dddnd-studio-first-party-content',
    configResolved(config) {
      outDir = config.build.outDir
    },
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        const relative = decodeURIComponent((req.url ?? '').split('?')[0])
        const file = path.resolve(CONTENT_ROOT, `.${relative}`)
        if (!file.startsWith(CONTENT_ROOT + path.sep) || !file.endsWith('.json') || !existsSync(file) || !statSync(file).isFile()) {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(readFileSync(file))
      })
    },
    writeBundle() {
      cpSync(CONTENT_ROOT, path.join(outDir, 'content'), { recursive: true })
    },
  }
}

/**
 * DDDnD Pack Studio ("The Forge"): a separate app in the same repository
 * (ADR 0005, docs/PACK_STUDIO.md). It shares the game's domain code through
 * `@/domains/*` and never imports the game's UI (`@/ui/*`); a test enforces it.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue(), firstPartyContent()],
  resolve: {
    alias: {
      '@studio': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  server: { port: 5318, strictPort: true },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
})
