/**
 * Aftershocks and event conditions (docs/PACK_STUDIO.md M4.6). The game's
 * aftershocks are shared between its cards, so they're never edited in place:
 * an own card can make its own version of one, take it off, attach another,
 * or have a new one. An own event can wait for a condition, whose words are
 * written from it.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  landingWords,
  addNewAftershock,
  aftershockUsers,
  attachAftershock,
  checkDraft,
  copyAftershockToEdit,
  copyToEdit,
  createOwnCard,
  createOwnEvent,
  detachAftershock,
  draftFromBaseScenario,
  exportDraftBundle,
  netWithAftershocks,
  putContent,
  setEventCondition,
  settleNewAftershockId,
  settleNewItemId,
  startingCondition,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { ContentPackManifest, DelayedEffect, Event } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey, packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }
const REFACTORING_PAYOFF = { id: 'refactoring_payoff', version: 1 }

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

async function started() {
  return draftFromBaseScenario(baseRegistry().provider, MONOLITH, { name: 'Ours', prefix: 'ours', authors: [{ name: 'A' }] })
}

/** An own card with a sentence, so the pack checks out. */
function ownCard(draft: DraftPack, name = 'Pair On It'): { draft: DraftPack; id: string } {
  const made = createOwnCard(draft, name)
  const card = made.draft.content.cards[made.id]
  return { draft: putContent(made.draft, 'cards', { ...card, description: 'Two people, one problem.', score_changes: [{ score_id: 'team_morale', delta: 3 }, { score_id: 'budget', delta: -1 }] }), id: made.id }
}

const named = (draft: DraftPack, id: string, fields: Partial<DelayedEffect>) =>
  putContent(draft, 'delayed_effects', { ...draft.content.delayed_effects[id], ...fields })

describe('aftershocks on the draft\'s own cards', () => {
  it('a new one is the draft\'s own, settles its id when named, and the card follows', async () => {
    const card = ownCard((await started()).draft)
    const added = addNewAftershock(card.draft, 'cards', card.id)
    expect(added.draft.content.cards[card.id].delayed_effect_refs).toEqual([{ id: added.id, version: 1 }])
    expect(added.draft.content.delayed_effects[added.id].turns_until_resolution).toBe(2)

    const settled = settleNewAftershockId(named(added.draft, added.id, { name: 'Knowledge Spreads' }), added.id)
    expect(settled.id).toBe('ours_knowledge_spreads')
    expect(settled.draft.content.cards[card.id].delayed_effect_refs).toEqual([{ id: 'ours_knowledge_spreads', version: 1 }])
    expect(settled.draft.content.delayed_effects).not.toHaveProperty(added.id)
  })

  it('the game\'s can be made the draft\'s own for one card only; the game\'s other cards keep the original', async () => {
    const base = baseRegistry().provider
    let draft = ownCard((await started()).draft).draft
    const cardId = Object.keys(draft.content.cards)[0]
    draft = attachAftershock(draft, 'cards', cardId, REFACTORING_PAYOFF)
    const other = ownCard(draft, 'Second Card')
    draft = attachAftershock(other.draft, 'cards', other.id, REFACTORING_PAYOFF)

    const original = await base.loadDelayedEffect(REFACTORING_PAYOFF)
    const copied = copyAftershockToEdit(draft, 'cards', cardId, original)
    expect(copied.draft.content.cards[cardId].delayed_effect_refs).toEqual([{ id: copied.id, version: 1 }])
    expect(copied.draft.content.cards[other.id].delayed_effect_refs).toEqual([REFACTORING_PAYOFF])
    expect(copied.draft.content.delayed_effects[copied.id]).toMatchObject({ name: original.name, score_changes: original.score_changes })
  })

  it('taking one off deletes the draft\'s own only when nothing else uses it, and never the game\'s', async () => {
    const card = ownCard((await started()).draft)
    const added = addNewAftershock(card.draft, 'cards', card.id)
    const ref = { id: added.id, version: 1 }
    const second = ownCard(added.draft, 'Second Card')
    const shared = attachAftershock(second.draft, 'cards', second.id, ref)
    expect(aftershockUsers(shared, ref).map((user) => user.id)).toEqual([card.id, second.id])

    const offOne = detachAftershock(shared, 'cards', card.id, ref)
    expect(offOne.content.delayed_effects).toHaveProperty(added.id)
    const offBoth = detachAftershock(offOne, 'cards', second.id, ref)
    expect(offBoth.content.delayed_effects).not.toHaveProperty(added.id)

    const withGame = attachAftershock(offBoth, 'cards', card.id, REFACTORING_PAYOFF)
    expect(attachAftershock(withGame, 'cards', card.id, REFACTORING_PAYOFF)).toBe(withGame)
    expect(detachAftershock(withGame, 'cards', card.id, REFACTORING_PAYOFF).content.cards[card.id].delayed_effect_refs).toEqual([])
  })

  it('a copied game card keeps the game\'s aftershocks until the author changes them', async () => {
    const base = baseRegistry().provider
    const { draft } = await started()
    const original = await base.loadCard({ id: 'define_bounded_context', version: 1 })
    const copy = copyToEdit(draft, 'cards', original)
    expect(copy.draft.content.cards[copy.id].delayed_effect_refs).toEqual(original.delayed_effect_refs)
    expect(Object.keys(copy.draft.content.delayed_effects)).toEqual([])
  })

  it('count toward the net, as the game\'s balance numbers do', () => {
    const card = { score_changes: [{ score_id: 'a', delta: 5 }, { score_id: 'b', delta: -2 }] }
    expect(netWithAftershocks(card, [{ score_changes: [{ score_id: 'a', delta: 4 }] }, { score_changes: [] }])).toBe(7)
  })
})

describe('event conditions', () => {
  it('write their words from the condition, and can be cleared', async () => {
    const made = createOwnEvent((await started()).draft, 'Audit Season')
    const condition = { ...startingCondition('budget'), operator: '>' as const, value: 60 }
    const waiting = setEventCondition(made.draft, made.id, condition, 'Budget')
    expect(waiting.content.events[made.id]).toMatchObject({ trigger_condition: condition, trigger_condition_description: 'Budget > 60' })
    const any = setEventCondition(waiting, made.id, null, '')
    expect(any.content.events[made.id]).not.toHaveProperty('trigger_condition')
    expect(any.content.events[made.id]).not.toHaveProperty('trigger_condition_description')
  })
})

describe('through the game\'s own import', () => {
  it('own aftershocks and event conditions export, import and play', async () => {
    const start = await started()
    let draft = ownCard(start.draft).draft
    const cardId = Object.keys(draft.content.cards)[0]
    const aftershock = addNewAftershock(draft, 'cards', cardId)
    draft = settleNewAftershockId(named(aftershock.draft, aftershock.id, {
      name: 'Knowledge Spreads',
      description: 'The pairing pays off.',
      turns_until_resolution: 1,
      score_changes: [{ score_id: 'domain_clarity', delta: 4 }],
    }), aftershock.id).draft

    // Two own events: one that can always happen, one that never can
    const always = createOwnEvent(draft, 'Steady Hum')
    draft = settleNewItemId(always.draft, 'events', always.id).draft
    const alwaysId = 'ours_steady_hum'
    draft = putContent(draft, 'events', { ...(draft.content.events[alwaysId] as Event), description: 'Things tick along.', occurrence_weight: 1000, score_changes: [{ score_id: 'budget', delta: -1 }] })
    draft = setEventCondition(draft, alwaysId, { target_type: 'score', target_id: 'budget', operator: '>=', value: -1000 }, 'Budget')
    const never = createOwnEvent(draft, 'Windfall')
    draft = settleNewItemId(never.draft, 'events', never.id).draft
    const neverId = 'ours_windfall'
    draft = putContent(draft, 'events', { ...(draft.content.events[neverId] as Event), description: 'Money from nowhere.', occurrence_weight: 1000, score_changes: [{ score_id: 'budget', delta: 5 }] })
    draft = setEventCondition(draft, neverId, { target_type: 'score', target_id: 'budget', operator: '>', value: 999 }, 'Budget')

    expect((await checkDraft(draft, firstParty())).issues).toEqual([])
    const exported = await exportDraftBundle(draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))

    const snapshot = await readPackBundle(exported.text, exported.file_name)
    const { registry } = baseRegistry()
    const key = packKeyOf(snapshot)
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
    const bundle = await buildScenarioBundle(start.scenarioId, 1, registry.createScopedProvider(key))
    expect([...bundle.delayed_effects.values()].find((effect) => effect.id === 'ours_knowledge_spreads')?.turns_until_resolution).toBe(1)
    expect([...bundle.events.values()].find((event) => event.id === neverId)?.trigger_condition_description).toBe('Budget > 999')

    const runs = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'aftershocks', play_policy: 'player_true' }).per_run
    const triggered = runs.flatMap((run) => run.events_triggered)
    expect(triggered).toContain(alwaysId)
    expect(triggered).not.toContain(neverId)
  })
})


describe('when an aftershock lands, in words', () => {
  it('says "the next turn" for one turn, and counts the rest', () => {
    expect(landingWords({ turns_until_resolution: 1 })).toBe('the next turn')
    expect(landingWords({ turns_until_resolution: 3 })).toBe('3 turns later')
  })
})
