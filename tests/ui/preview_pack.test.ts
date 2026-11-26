/**
 * A pack from "Play it" goes through the same validation as any import, and
 * one that fails says why in the bazaar's words and doesn't play
 * (docs/PACK_STUDIO.md §11).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { loadPreviewPack } from '@/ui/preview/preview_pack'

const LEDGER = path.resolve('tests/content/fixtures/packs/gilded_ledger')

/** The Gilded Ledger fixture as a `.dddnd-pack.json` bundle. */
function ledgerBundle(): string {
  const manifest = JSON.parse(readFileSync(path.join(LEDGER, 'manifest.json'), 'utf8')) as { content: Record<string, string[]> }
  const folders: Record<string, string> = { stakeholder_reaction_rules: 'stakeholder-reaction-rules', delayed_effects: 'delayed-effects', outcome_tiers: 'outcome-tiers', outcome_archetypes: 'outcome-archetypes', challenge_modifiers: 'challenge-modifiers' }
  const files: Record<string, unknown> = {}
  for (const [section, names] of Object.entries(manifest.content)) {
    const folder = folders[section] ?? section
    for (const name of names) files[`${folder}/${name}`] = JSON.parse(readFileSync(path.join(LEDGER, folder, name), 'utf8'))
  }
  return JSON.stringify({ format: 'dddnd-pack', format_version: 1, manifest, files })
}

describe('a pack from "Play it"', () => {
  it('plays when the game\'s checks pass, under its file key', async () => {
    const add = vi.fn(async () => {})
    const result = await loadPreviewPack(ledgerBundle(), { check: async () => ({ ok: true, issues: [] }), add })
    expect(result).toMatchObject({ ok: true, packKey: expect.stringMatching(/^file:sha256:/) })
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('doesn\'t play when the game\'s checks fail, and says why', async () => {
    const add = vi.fn(async () => {})
    const result = await loadPreviewPack(ledgerBundle(), { check: async () => ({ ok: false, issues: [{ file: 'manifest.json', message: 'authors: must be at least 1 item' }] }), add })
    expect(result).toEqual({ ok: false, title: 'This pack can\'t be played here', problems: [{ file: 'manifest.json', message: 'authors: must be at least 1 item' }] })
    expect(add).not.toHaveBeenCalled()
  })

  it('doesn\'t play something that isn\'t a pack, and says which stage refused it', async () => {
    const add = vi.fn(async () => {})
    const result = await loadPreviewPack('{"not":"a pack"}', { check: async () => ({ ok: true, issues: [] }), add })
    expect(result).toMatchObject({ ok: false, title: 'The pack\'s manifest has problems' })
    expect(add).not.toHaveBeenCalled()
  })
})
