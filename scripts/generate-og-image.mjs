/**
 * Generate OG images (PNG) from SVG sources.
 *
 *   public/og-image.svg            → public/og-image.png
 *   docs-site/public/og-image.svg  → docs-site/public/og-image.png
 *   docs-site/public/favicon.svg   → docs-site/public/apple-touch-icon.png
 *
 * Usage: node scripts/generate-og-image.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function renderSvgToPng(svgPath, pngPath, width) {
  const svg = readFileSync(svgPath, 'utf-8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      loadSystemFonts: true,
    },
  })
  const pngBuffer = resvg.render().asPng()
  writeFileSync(pngPath, pngBuffer)
  const label = relative(root, pngPath)
  console.log(`✓ OG image generated: ${label} (${pngBuffer.length} bytes)`)
}

renderSvgToPng(
  resolve(root, 'public/og-image.svg'),
  resolve(root, 'public/og-image.png'),
  1200,
)

renderSvgToPng(
  resolve(root, 'docs-site/public/og-image.svg'),
  resolve(root, 'docs-site/public/og-image.png'),
  1200,
)

renderSvgToPng(
  resolve(root, 'docs-site/public/favicon.svg'),
  resolve(root, 'docs-site/public/apple-touch-icon.png'),
  180,
)
