/**
 * Draft packs (docs/PACK_STUDIO.md §4, D4, D7, D13): the Studio's editing
 * model, checked and exported by the game's own code.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  addContent,
  checkDraft,
  copyToEdit,
  createDraft,
  draftFromBaseScenario,
  draftManifest,
  draftPackId,
  exportDraftBundle,
  putContent,
  removeContent,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { Card, ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey, packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
const AUTHOR = [{ name: 'Test Author' }]

function firstParty(): FirstPartyPack[] {
  return (Object.keys(ROOTS) as Array<keyof typeof ROOTS>).map((id) => ({
    manifest: JSON.parse(readFileSync(path.join(ROOTS[id], 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(ROOTS[id]),
  }))
}

function baseProvider() {
  const registry = new ContentPackRegistry()
  for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
  return { registry, provider: registry.createScopedProvider(firstPartyPackKey('base')) }
}

const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }

describe('a draft pack', () => {
  it('starts empty, with a prefix from its name and the base pack as its dependency', () => {
    const draft = createDraft({ kind: 'retelling', name: 'Payments Platform Quest', authors: AUTHOR })
    expect(draft.prefix).toBe('payments')
    const manifest = draftManifest(draft, { schema_version: 1, base_version: '1.4.0' })
    expect(manifest).toMatchObject({ schema_version: 1, kind: 'extension', depends_on: [{ pack_id: 'base', version: '1.4.0' }], license: 'GPL-3.0-or-later', base_url: '.' })
  })

  it('gives new content prefixed, unique ids from names, at version 1', () => {
    let draft = createDraft({ kind: 'new_topic', name: 'Pager', prefix: 'sre', authors: AUTHOR })
    const first = addContent(draft, 'scores', { name: 'Rest', short_name: 'Rest', description: 'Sleep', default_value: 40 })
    draft = first.draft
    const second = addContent(draft, 'scores', { name: 'Rest', short_name: 'Rest', description: 'Again', default_value: 40 })
    expect([first.id, second.id]).toEqual(['sre_rest', 'sre_rest_2'])
    expect(second.draft.content.scores.sre_rest.version).toBe(1)
    expect(removeContent(second.draft, 'scores', 'sre_rest').content.scores).not.toHaveProperty('sre_rest')
  })

  it('never takes a pack id that belongs to the game', () => {
    expect(draftPackId(createDraft({ kind: 'retelling', name: 'Base', authors: AUTHOR }))).toBe('base_pack')
  })
})

describe('starting from a DDDnD scenario (D13)', () => {
  it('exports a pack the game imports and plays, exactly like the original', async () => {
    const { provider } = baseProvider()
    const { draft, scenarioId } = await draftFromBaseScenario(provider, MONOLITH, { name: 'Our Monolith', prefix: 'ours', authors: AUTHOR })
    expect(scenarioId).toBe('ours_the_monolith_of_mild_despair')

    const exported = await exportDraftBundle(draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    expect(exported.file_name).toBe('ours-v1.0.0.dddnd-pack.json')

    // The game's own import path: read the file, register it next to base, build and play
    const snapshot = await readPackBundle(exported.text, exported.file_name)
    const { registry, provider: base } = baseProvider()
    const key = packKeyOf(snapshot)
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
    const copy = await buildScenarioBundle(scenarioId, 1, registry.createScopedProvider(key))
    const original = await buildScenarioBundle(MONOLITH.id, MONOLITH.version, base)

    const runs = { runs: 20, seed: 'studio-copy', play_policy: 'player_true' as const }
    const fromCopy = simulate_runs({ scenario_bundle: copy, ...runs }).per_run
    const fromOriginal = simulate_runs({ scenario_bundle: original, ...runs }).per_run
    expect(fromCopy.map((run) => [run.final_scores, run.archetype, run.selected_tier_id]))
      .toEqual(fromOriginal.map((run) => [run.final_scores, run.archetype, run.selected_tier_id]))
  })
})

describe('making my own version of a base card (D7)', () => {
  it('copies the card under a new id and points the scenario at the copy', async () => {
    const { provider } = baseProvider()
    const started = await draftFromBaseScenario(provider, MONOLITH, { name: 'Ours', prefix: 'ours', authors: AUTHOR })
    const scenario = started.draft.content.scenarios[started.scenarioId]
    const baseRef = scenario.card_refs[0]
    const baseCard = await provider.loadCard(baseRef)

    const copied = copyToEdit(started.draft, 'cards', baseCard)
    const copy = copied.draft.content.cards[copied.id] as Card
    expect(copied.id).toBe(`ours_${baseCard.id}`)
    expect(copy).toMatchObject({ name: baseCard.name, version: 1 })
    const refs = copied.draft.content.scenarios[started.scenarioId].card_refs
    expect(refs).toContainEqual({ id: copied.id, version: 1 })
    expect(refs).not.toContainEqual(baseRef)

    // Edit the copy; the base card is untouched, and the pack still checks out
    const edited = putContent(copied.draft, 'cards', { ...copy, name: 'Our version', score_changes: [{ score_id: 'budget', delta: -1 }, ...copy.score_changes] })
    expect((await provider.loadCard(baseRef)).name).toBe(baseCard.name)
    expect((await checkDraft(edited, firstParty())).issues).toEqual([])
  })
})

describe('checking a draft the way the game checks an import', () => {
  it('reports what the game would refuse, and refuses to export it', async () => {
    const { provider } = baseProvider()
    const started = await draftFromBaseScenario(provider, MONOLITH, { name: 'Broken', prefix: 'broken', authors: AUTHOR })
    const scenario = started.draft.content.scenarios[started.scenarioId]
    const broken = putContent(started.draft, 'scenarios', { ...scenario, card_refs: [...scenario.card_refs, { id: 'no_such_card', version: 1 }] })

    const check = await checkDraft(broken, firstParty())
    expect(check.issues.map((issue) => issue.message).join('\n')).toMatch(/no_such_card/)
    expect(await exportDraftBundle(broken, firstParty())).toMatchObject({ ok: false })
  })

  it('needs an author, like any pack', async () => {
    const { provider } = baseProvider()
    const { draft } = await draftFromBaseScenario(provider, MONOLITH, { name: 'Nobody', prefix: 'nobody' })
    const check = await checkDraft(draft, firstParty())
    expect(check.issues.map((issue) => issue.message).join('\n')).toMatch(/authors: must be at least 1/)
  })
})

describe('copying content held in a UI\'s reactive state', () => {
  it('copies a base card even when it arrives wrapped in Vue proxies', async () => {
    const { reactive } = await import('vue')
    const { provider } = baseProvider()
    const started = await draftFromBaseScenario(provider, MONOLITH, { name: 'Ours', prefix: 'ours', authors: AUTHOR })
    const baseCard = await provider.loadCard(started.draft.content.scenarios[started.scenarioId].card_refs[0])
    const held = reactive({ card: baseCard })
    expect(() => structuredClone(held.card)).toThrow()
    const copied = copyToEdit(started.draft, 'cards', held.card)
    expect(copied.draft.content.cards[copied.id].name).toBe(baseCard.name)
    expect(() => structuredClone(copied.draft)).not.toThrow()
  })
})
