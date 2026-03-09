import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite plugin: resolve SEO / Open Graph URLs at build time.
 *
 * When VITE_SITE_URL is set (e.g. "https://dddnd.example.com") every
 * relative asset path in OG / Twitter meta tags is prefixed with the
 * canonical origin, and a <link rel="canonical"> is injected.
 *
 * When the variable is empty the HTML keeps relative paths, which is
 * fine for local dev but may not work with all social-media crawlers.
 */
function seoUrlPlugin(): Plugin {
  return {
    name: 'dddnd-seo-urls',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const siteUrl = (process.env.VITE_SITE_URL ?? '').replace(/\/+$/, '')

        // Replace the placeholder the template uses for asset paths
        html = html.replaceAll('%SITE_URL%', siteUrl)

        // Inject <link rel="canonical"> only when we have an origin
        if (siteUrl) {
          html = html.replace(
            '<!-- canonical:placeholder -->',
            `<link rel="canonical" href="${siteUrl}/" />`
          )
        } else {
          html = html.replace('<!-- canonical:placeholder -->\n', '')
        }

        return html
      },
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    seoUrlPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
