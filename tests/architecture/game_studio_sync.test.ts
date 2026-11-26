/**
 * The game, its base content and the Studio move together (docs/PACK_STUDIO.md D25).
 *
 * A pack the Studio exports declares the pack format and base pack it was
 * made for. Those come from this repository's own code and content, never a
 * copy, and the base pack keeps its promise to packs already out there
 * (scripts/lib/base_content_lock.ts).
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { draftFromBaseScenario, exportDraftBundle, gameTarget, playSignature, type FirstPartyPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { CURRENT_PACK_SCHEMA_VERSION } from '@/domains/content/validation/pack_policy'
import { currentBase, lockProblems, readLock, type BaseContentLock } from '../../scripts/lib/base_content_lock'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }

function firstParty(): FirstPartyPack[] {
  return Object.values(ROOTS).map((root) => ({
    manifest: JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(root),
  }))
}

const baseVersion = (JSON.parse(readFileSync(path.join(ROOTS.base, 'manifest.json'), 'utf8')) as ContentPackManifest).version

describe('the Studio exports for the game in this repository', () => {
  it('declares this game\'s pack format and base pack version', async () => {
    expect(gameTarget(firstParty())).toEqual({ schema_version: CURRENT_PACK_SCHEMA_VERSION, base_version: baseVersion })

    const registry = new ContentPackRegistry()
    for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
    const { draft } = await draftFromBaseScenario(registry.createScopedProvider(firstPartyPackKey('base')), { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [{ name: 'A' }] })
    const exported = await exportDraftBundle(draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    const { manifest } = await readPackBundle(exported.text, exported.file_name)
    expect(manifest.schema_version).toBe(CURRENT_PACK_SCHEMA_VERSION)
    expect(manifest.depends_on).toEqual([{ pack_id: 'base', version: baseVersion }])
  })

  it('refuses to guess when the base pack is missing', () => {
    expect(() => gameTarget(firstParty().filter((pack) => pack.manifest.id !== 'base'))).toThrow(/base game/)
  })
})

describe('the base pack keeps its promise to packs already out there', () => {
  it('matches the base-content lock (after changing base content, run `npm run content:lock`)', () => {
    const now = currentBase()
    expect(lockProblems(readLock(), now)).toEqual([])
    expect(readLock(), 'The base pack changed: run `npm run content:lock` and commit scripts/base-content-lock.json').toEqual(now)
  })

  const LOCK: BaseContentLock = { version: '1.2.0', files: { cards: { 'a-v1.json': 'aaa', 'b-v1.json': 'bbb' } } }

  it('refuses removed content and changed play within a major version', () => {
    expect(lockProblems(LOCK, { version: '1.3.0', files: { cards: { 'a-v1.json': 'aaa' } } })).toEqual([expect.stringMatching(/b-v1\.json was removed/)])
    expect(lockProblems(LOCK, { version: '1.3.0', files: { cards: { 'a-v1.json': 'aaa', 'b-v1.json': 'changed' } } })).toEqual([expect.stringMatching(/b-v1\.json plays differently/)])
  })

  it('lets a provably identical change through only when named on purpose', () => {
    const changed = { version: '1.2.0', files: { cards: { 'a-v1.json': 'aaa', 'b-v1.json': 'changed' } } }
    expect(lockProblems(LOCK, changed, new Set(['cards/b-v1.json']))).toEqual([])
    expect(lockProblems(LOCK, changed, new Set(['cards/a-v1.json']))).toHaveLength(1)
  })

  it('needs a later base version for new content, and never an earlier one', () => {
    const added = { cards: { ...LOCK.files.cards, 'b-v2.json': 'ccc' } }
    expect(lockProblems(LOCK, { version: '1.2.0', files: added })).toEqual([expect.stringMatching(/still version 1\.2\.0.*1\.3\.0/)])
    expect(lockProblems(LOCK, { version: '1.3.0', files: added })).toEqual([])
    expect(lockProblems(LOCK, { version: '1.1.0', files: LOCK.files })).toEqual([expect.stringMatching(/older than 1\.2\.0/)])
  })

  it('lets wording change, but not play', () => {
    const card = { id: 'a', version: 1, name: 'A', description: 'Old words.', score_changes: [{ score_id: 'budget', delta: 1 }] }
    expect(playSignature({ ...card, name: 'Better A', description: 'New words.' })).toBe(playSignature(card))
    expect(playSignature({ ...card, score_changes: [{ score_id: 'budget', delta: 2 }] })).not.toBe(playSignature(card))
  })

  it('lets a new major version start over', () => {
    expect(lockProblems(LOCK, { version: '2.0.0', files: { cards: { 'b-v2.json': 'ccc' } } })).toEqual([])
  })
})

describe('"Play it": the game and the Studio agree on who may send a pack (§11, D17)', () => {
  it('the Studio offers Play it in production exactly when the production game trusts the Studio', async () => {
    const { PRODUCTION_PREVIEW_ORIGINS } = await import('@/ui/preview/preview_session')
    const { PLAY_IT_IN_PRODUCTION } = await import('../../studio/src/content/game_preview')
    expect(PLAY_IT_IN_PRODUCTION).toBe(PRODUCTION_PREVIEW_ORIGINS.includes('https://studio.dddnd.app'))
    // Only the Studio's own address, ever: never a deploy preview or another site (an ADR to change)
    expect(PRODUCTION_PREVIEW_ORIGINS.every((origin) => origin === 'https://studio.dddnd.app')).toBe(true)
  })

  it('the game\'s development build trusts the Studio\'s development server, on its real port', async () => {
    const { DEVELOPMENT_PREVIEW_ORIGINS } = await import('@/ui/preview/preview_session')
    const port = readFileSync('studio/vite.config.ts', 'utf8').match(/port:\s*(\d+),\s*strictPort:\s*true/)?.[1]
    expect(DEVELOPMENT_PREVIEW_ORIGINS).toEqual([`http://localhost:${port}`])
  })
})
