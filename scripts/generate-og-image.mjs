/**
 * Generate OG image (PNG) from SVG source.
 *
 * Converts public/og-image.svg → public/og-image.png at 1200×630
 * for social media / chat embed previews.
 *
 * Usage: node scripts/generate-og-image.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const svgPath = resolve(root, 'public/og-image.svg')
const pngPath = resolve(root, 'public/og-image.png')

const svg = readFileSync(svgPath, 'utf-8')

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: true,
  },
})

const pngData = resvg.render()
const pngBuffer = pngData.asPng()

writeFileSync(pngPath, pngBuffer)

console.log(`✓ OG image generated: public/og-image.png (${pngBuffer.length} bytes)`)
