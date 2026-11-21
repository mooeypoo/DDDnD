/**
 * Rendering guard (M1.6, threat T1 in docs/CONTENT_PACKS_SECURITY.md).
 *
 * Community packs put text on screen. That is only safe while every piece of
 * content is rendered as text through Vue interpolation. This test fails if
 * anyone adds a raw-markup sink (v-html, innerHTML, ...) to the app.
 *
 * Allowed exceptions must render first-party constants only, never content,
 * and are listed here by file with the reason.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ALLOWED_SINKS: Record<string, string> = {
  'src/ui/components/common/social_links_panel.vue':
    'v-html renders hard-coded SVG icons defined in the same file; no content-pack data reaches it',
}

const MARKUP_SINKS = /v-html|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write\(|createContextualFragment/

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(vue|ts)$/.test(entry) ? [full] : []
  })
}

describe('no raw markup rendering in the app', () => {
  it('only allow-listed files use markup sinks', () => {
    const offenders = sourceFiles('src')
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => MARKUP_SINKS.test(readFileSync(file, 'utf8')))
      .filter((file) => !(file in ALLOWED_SINKS))

    expect(offenders, 'Render content as text ({{ }}), not markup. See docs/CONTENT_PACKS_SECURITY.md T1.').toEqual([])
  })

  it('keeps the allow-list honest (every entry still exists and still uses a sink)', () => {
    for (const file of Object.keys(ALLOWED_SINKS)) {
      expect(MARKUP_SINKS.test(readFileSync(file, 'utf8')), file).toBe(true)
    }
  })
})
