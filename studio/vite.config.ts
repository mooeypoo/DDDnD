import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * DDDnD Pack Studio ("The Forge"): a separate app in the same repository
 * (ADR 0005, docs/PACK_STUDIO.md). It shares the game's domain code through
 * `@/domains/*` and never imports the game's UI (`@/ui/*`); a test enforces it.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
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
