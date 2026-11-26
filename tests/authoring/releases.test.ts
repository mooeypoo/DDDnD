/**
 * The version-bump assistant (docs/PACK_STUDIO.md M4.7). A version names one
 * fixed behaviour, so content whose play changed since the last export gets
 * the next version, references follow, and wording keeps the version.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  addNewAftershock,
  changedFields,
  checkDraft,
  createOwnCard,
  draftFromBaseScenario,
  exportDraftBundle,
  isLaterVersion,
  nextPackVersion,
  planRelease,
  putContent,
  releaseDraft,
  releaseVersionProblem,
  removeFromDeck,
  DRAFT_LICENSE,
  licenseChoices,
  withLicense,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { Card, ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey, packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }

function firstParty(): FirstPartyPack[] {
  return (Object.keys(ROOTS) as Array<keyof typeof ROOTS>).map((id) => ({
    manifest: JSON.parse(readFileSync(path.join(ROOTS[id], 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(ROOTS[id]),
  }))
}

function baseRegistry() {
  const registry = new ContentPackRegistry()
  for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
  return { registry, provider: registry.createScopedProvider(firstPartyPackKey('base')) }
}

/** A Monolith retelling with one own card, exported once as 1.0.0. */
async function released(): Promise<{ draft: DraftPack; cardId: string; scenarioId: string }> {
  const { draft: start, scenarioId } = await draftFromBaseScenario(baseRegistry().provider, MONOLITH, { name: 'Ours', prefix: 'ours', authors: [{ name: 'A' }] })
  const made = createOwnCard(start, 'Pair On It')
  const card = made.draft.content.cards[made.id]
  const draft = putContent(made.draft, 'cards', { ...card, description: 'Two people, one problem.', score_changes: [{ score_id: 'team_morale', delta: 3 }, { score_id: 'budget', delta: -1 }] })
  return { draft: releaseDraft(draft, '1.0.0'), cardId: made.id, scenarioId }
}

const cardOf = (draft: DraftPack, id: string) => draft.content.cards[id] as Card
const scenarioOf = (draft: DraftPack) => Object.values(draft.content.scenarios)[0]

describe('the first export', () => {
  it('is a first release, and remembers what it exported', async () => {
    const { draft: start } = await draftFromBaseScenario(baseRegistry().provider, MONOLITH, { name: 'Ours', prefix: 'ours', authors: [{ name: 'A' }] })
    expect(planRelease(start)).toMatchObject({ since: null, kind: 'first', suggested: '1.0.0' })
    const out = releaseDraft(start, '1.0.0')
    expect(out.released?.version).toBe('1.0.0')
    expect(out.released?.content.scenarios).toEqual(start.content.scenarios)
    expect(planRelease(out)).toMatchObject({ since: '1.0.0', kind: 'unchanged', suggested: '1.0.0', changed: [] })
  })
})

describe('changes since the last export', () => {
  it('wording keeps the version and suggests a patch', async () => {
    const { draft, cardId } = await released()
    const edited = putContent(draft, 'cards', { ...cardOf(draft, cardId), name: 'Pair On It Together', flavor_text: 'Two heads.' })
    const plan = planRelease(edited)
    expect(plan).toMatchObject({ kind: 'wording', suggested: '1.0.1' })
    expect(plan.changed).toEqual([expect.objectContaining({ id: cardId, from: 1, to: 1, play: [], wording: ['name', 'flavor_text'] })])
    expect(releaseDraft(edited, '1.0.1').content.cards[cardId].version).toBe(1)
  })

  it('play gets the next version, and the scenario that lists it follows', async () => {
    const { draft, cardId, scenarioId } = await released()
    const edited = putContent(draft, 'cards', { ...cardOf(draft, cardId), cooldown_turns: 2 })
    const plan = planRelease(edited)
    expect(plan.kind).toBe('play')
    expect(plan.suggested).toBe('1.1.0')
    expect(plan.changed).toEqual(expect.arrayContaining([
      expect.objectContaining({ section: 'cards', id: cardId, from: 1, to: 2, play: ['cooldown_turns'], follows: false }),
      expect.objectContaining({ section: 'scenarios', id: scenarioId, from: 1, to: 2, follows: true }),
    ]))

    const out = releaseDraft(edited, plan.suggested)
    expect(out.content.cards[cardId].version).toBe(2)
    expect(scenarioOf(out).version).toBe(2)
    expect(scenarioOf(out).card_refs).toContainEqual({ id: cardId, version: 2 })
    expect(scenarioOf(out).card_refs).not.toContainEqual({ id: cardId, version: 1 })
    // The game's content keeps its versions
    expect(scenarioOf(out).card_refs.filter((ref) => ref.id !== cardId)).toEqual(scenarioOf(draft).card_refs.filter((ref) => ref.id !== cardId))
    expect(planRelease(out).kind).toBe('unchanged')
  })

  it('an aftershock\'s change moves its card and then the scenario', async () => {
    const start = await released()
    const added = addNewAftershock(start.draft, 'cards', start.cardId)
    const first = releaseDraft(putContent(added.draft, 'delayed_effects', { ...added.draft.content.delayed_effects[added.id], description: 'Later.', score_changes: [{ score_id: 'budget', delta: 1 }] }), '1.1.0')
    expect(first.content.cards[start.cardId].version).toBe(2)

    const edited = putContent(first, 'delayed_effects', { ...first.content.delayed_effects[added.id], turns_until_resolution: 3 })
    const out = releaseDraft(edited, '1.2.0')
    expect(out.content.delayed_effects[added.id].version).toBe(2)
    expect(out.content.cards[start.cardId].version).toBe(3)
    expect(out.content.cards[start.cardId].delayed_effect_refs).toEqual([{ id: added.id, version: 2 }])
    expect(scenarioOf(out).version).toBe(3)
  })

  it('is bumped once per release, however often it changes in between', async () => {
    const { draft, cardId } = await released()
    let edited = putContent(draft, 'cards', { ...cardOf(draft, cardId), cooldown_turns: 2 })
    edited = putContent(edited, 'cards', { ...cardOf(edited, cardId), cooldown_turns: 3 })
    expect(releaseDraft(edited, '1.1.0').content.cards[cardId].version).toBe(2)
  })

  it('lists what was added and removed, and suggests a new minor version', async () => {
    const { draft, cardId } = await released()
    const removed = removeFromDeck(draft, 'cards', { id: cardId, version: 1 })
    const added = createOwnCard(removed, 'Mob On It').draft
    const plan = planRelease(added)
    expect(plan.removed).toEqual([{ section: 'cards', id: cardId, name: 'Pair On It' }])
    expect(plan.added).toEqual([expect.objectContaining({ section: 'cards', name: 'Mob On It' })])
    expect(plan.suggested).toBe('1.1.0')
  })

  it('released content plays and exports through the game\'s own import', async () => {
    const { draft, cardId, scenarioId } = await released()
    const out = releaseDraft(putContent(draft, 'cards', { ...cardOf(draft, cardId), cooldown_turns: 2 }), '1.1.0')
    expect((await checkDraft(out, firstParty())).issues).toEqual([])
    const exported = await exportDraftBundle(out, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    expect(exported.file_name).toMatch(/-v1\.1\.0\./)
    const snapshot = await readPackBundle(exported.text, exported.file_name)
    expect(snapshot.manifest.version).toBe('1.1.0')
    expect(snapshot.manifest.content.cards).toContain(`${cardId}-v2.json`)
    // The bundle has no trace of the Studio's memory of the last export
    expect(exported.text).not.toContain('"released"')
    const { registry } = baseRegistry()
    const key = packKeyOf(snapshot)
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
    const bundle = await buildScenarioBundle(scenarioId, 2, registry.createScopedProvider(key))
    expect([...bundle.cards.values()].find((card) => card.id === cardId)?.cooldown_turns).toBe(2)
  })
})

describe('pack versions', () => {
  it('compare and step as semantic versions', () => {
    expect(isLaterVersion('1.10.0', '1.9.3')).toBe(true)
    expect(isLaterVersion('1.0.0', '1.0.0')).toBe(false)
    expect(isLaterVersion('0.9.9', '1.0.0')).toBe(false)
    expect(nextPackVersion('1.2.3', 'play')).toBe('1.3.0')
    expect(nextPackVersion('1.2.3', 'wording')).toBe('1.2.4')
  })

  it('a changed pack needs a later version; an unchanged one may repeat its own', async () => {
    const { draft, cardId } = await released()
    expect(releaseVersionProblem(planRelease(draft), '1.0.0')).toBeNull()
    const plan = planRelease(putContent(draft, 'cards', { ...cardOf(draft, cardId), cooldown_turns: 2 }))
    expect(releaseVersionProblem(plan, '1.0.0')).toMatch(/after 1\.0\.0/)
    expect(releaseVersionProblem(plan, '1.1.0')).toBeNull()
    expect(releaseVersionProblem(plan, 'one')).toMatch(/three numbers/)
  })

  it('field comparison ignores key order and missing optional fields', () => {
    expect(changedFields({ a: 1, b: { x: 1, y: 2 } }, { b: { y: 2, x: 1 }, a: 1, c: undefined })).toEqual({ play: [], wording: [] })
    expect(changedFields({ name: 'A', usage_limit: 1 }, { name: 'B' })).toEqual({ play: ['usage_limit'], wording: ['name'] })
  })
})

describe('the license (D27)', () => {
  it('offers the licenses the game accepts for packs that build on it, the game\'s first', () => {
    expect(licenseChoices()).toEqual([
      { id: 'GPL-3.0-or-later', same_as_game: true, words: 'Version 3 of the GNU General Public License, or any later version.' },
      { id: 'GPL-3.0-only', same_as_game: false, words: 'Version 3 of the GNU General Public License, and no later version.' },
    ])
  })

  it('stores a license only when it differs from the Studio\'s, and refuses any other', async () => {
    const { draft } = await released()
    const only = withLicense(draft, 'GPL-3.0-only')
    expect(only.license).toBe('GPL-3.0-only')
    expect('license' in withLicense(only, DRAFT_LICENSE)).toBe(false)
    expect(() => withLicense(draft, 'MIT')).toThrow(/Not a license a Studio pack can use: MIT/)
  })

  it('remembers the license it released under, and a change is a new patch release', async () => {
    const { draft } = await released()
    expect(draft.released?.license).toBe(DRAFT_LICENSE)
    const plan = planRelease(withLicense(draft, 'GPL-3.0-only'))
    expect(plan).toMatchObject({ kind: 'wording', suggested: '1.0.1', changed: [], license: { from: 'GPL-3.0-or-later', to: 'GPL-3.0-only' } })
    expect(releaseVersionProblem(plan, '1.0.0')).toMatch(/after 1\.0\.0/)
    // Changed back before exporting: nothing to release
    expect(planRelease(withLicense(withLicense(draft, 'GPL-3.0-only'), DRAFT_LICENSE))).toMatchObject({ kind: 'unchanged', license: null })
  })

  it('compares nothing for a release from before the Studio recorded its license', async () => {
    const { draft } = await released()
    const { license: _unrecorded, ...older } = draft.released!
    expect(planRelease(withLicense({ ...draft, released: older }, 'GPL-3.0-only'))).toMatchObject({ kind: 'unchanged', license: null })
  })
})
