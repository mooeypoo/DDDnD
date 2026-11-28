/**
 * The Studio's front door (the first-screen audit, M4.27–M4.28): one name
 * per kind, what's the author's own in words, where a draft is in its
 * round, a look at one of the game's scenarios before copying it, and a DDD
 * retelling from scratch that plays.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  KIND_NAMES,
  addToDeck,
  createOwnCard,
  createOwnEnding,
  createOwnEvent,
  createOwnMember,
  createOwnScore,
  describeOwnContent,
  draftForBlankRetelling,
  draftForNewTopic,
  draftFromBaseScenario,
  draftToRawPack,
  exportDraftBundle,
  gameTarget,
  nextSteps,
  packStart,
  goToRoundStep,
  manifestRefs,
  previewBaseScenario,
  putContent,
  roundPlace,
  startRound,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey, packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

function firstParty(): FirstPartyPack[] {
  return ['content', 'content/tutorial'].map((root) => ({
    manifest: JSON.parse(readFileSync(path.resolve(root, 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(path.resolve(root)),
  }))
}
function registry() {
  const registry = new ContentPackRegistry()
  for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
  return { registry, base: registry.createScopedProvider(firstPartyPackKey('base')) }
}
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }
const AUTHOR = { name: 'Ours', authors: [{ name: 'Ada' }] }

describe('the two kinds, named once', () => {
  it('are "DDD retelling" and "New subject"', () => {
    expect(KIND_NAMES).toEqual({ retelling: 'DDD retelling', new_topic: 'New subject' })
  })
})

describe("what's the author's own, in words", () => {
  it("calls an untouched retelling the game's scenario, and counts what's theirs", async () => {
    const { draft } = await draftFromBaseScenario(registry().base, MONOLITH, AUTHOR)
    expect(packStart(draft)).toBe('copied')
    expect(packStart({ ...draft, released: { version: '1.0.0', content: draft.content, imported: true } as never })).toBe('imported')
    expect(describeOwnContent(draft)).toBe("Nothing of your own yet: the game's scenario as it is.")
    const withCard = createOwnCard(draft, 'Pair On It').draft
    expect(describeOwnContent(createOwnEvent(withCard, 'Audit').draft)).toBe('1 card and 1 event of your own.')
  })

  it("never calls a new subject a copy of the game's scenario: it counts its scores and endings", () => {
    let draft = draftForNewTopic({ name: 'Incident Response' }, manifestRefs(firstParty()[0].manifest, 'outcome_tiers')).draft
    expect(describeOwnContent(draft)).toBe('Just started: name what it trades off first.')
    draft = createOwnScore(createOwnScore(draft, 'Rest')!.draft, 'Uptime')!.draft
    draft = createOwnEnding(draft, 'The Toil Slayer')!.draft
    expect(describeOwnContent(draft)).toBe('2 scores and 1 ending.')
  })
})

describe('where a draft is in its round', () => {
  it('is "step N of M" of its own round, or nothing outside one', async () => {
    const { draft } = await draftFromBaseScenario(registry().base, MONOLITH, AUTHOR)
    expect(roundPlace(draft)).toBeNull()
    expect(roundPlace(goToRoundStep(startRound(draft), 'cards'))).toEqual({ step: 4, of: 8 })
    const topic = startRound(draftForNewTopic({ name: 'Incident Response' }, manifestRefs(firstParty()[0].manifest, 'outcome_tiers')).draft)
    expect(roundPlace(goToRoundStep(topic, 'cards'))).toEqual({ step: 5, of: 10 })
  })
})

describe("a look at one of the game's scenarios", () => {
  it('names its scores (lowest start first), council and deck, before anything is copied', async () => {
    const preview = await previewBaseScenario(registry().base, MONOLITH)
    expect(preview).toMatchObject({ name: 'The Monolith of Mild Despair', turns: 10, cards: 26, events: 11 })
    expect(preview.scores[0]).toEqual({ name: 'Domain Clarity', start: 30 })
    expect(preview.scores.map((score) => score.start)).toEqual([30, 38, 44, 55, 58, 59])
    expect(preview.council).toEqual(['Chief Technology Officer', 'VP of Product', 'Lead Developer', 'Operations Manager'])
  })
})

describe('a DDD retelling from scratch', () => {
  it("takes the game's frame and nothing else: its scores at 50, its tiers, endings and coupling, no council or deck", async () => {
    const { base } = registry()
    const { draft, scenarioId } = await draftForBlankRetelling(base, MONOLITH, { name: 'Payments at Acme', authors: [] })
    const scenario = draft.content.scenarios[scenarioId]
    const monolith = await base.loadScenario(MONOLITH)
    expect(draft.kind).toBe('retelling')
    expect(draft.description).toBe('A DDDnD retelling: Payments at Acme.')
    expect(scenario.score_refs).toEqual(monolith.score_refs)
    expect(Object.values(scenario.starting_scores)).toEqual([50, 50, 50, 50, 50, 50])
    expect(scenario.outcome_tier_refs).toEqual(monolith.outcome_tier_refs)
    expect(scenario.outcome_archetype_refs).toEqual(monolith.outcome_archetype_refs)
    expect(scenario.coupling_rule_refs).toEqual(monolith.coupling_rule_refs)
    expect([scenario.stakeholder_refs, scenario.card_refs, scenario.event_refs]).toEqual([[], [], []])
    // Nothing in it yet, and not the game's scenario either; the summary says it began from scratch, with the deck to fill
    expect(describeOwnContent(draft)).toBe('Just started: seat a council and fill the deck.')
    expect(packStart(draft)).toBe('from_scratch')
    expect(nextSteps(draft).map((step) => [step.step, step.done]).slice(0, 2)).toEqual([['fill_deck', false], ['write_a_card', false]])
    // The Studio's own memory, like the round's place: the pack it exports is the same without it
    const { from_scratch: _mark, ...unmarked } = draft
    expect(draftToRawPack(draft, gameTarget(firstParty()))).toEqual(draftToRawPack(unmarked, gameTarget(firstParty())))
  })

  it('exports, and plays whole runs in the game, once it has a council and a deck (its own and the game\'s)', async () => {
    const { base } = registry()
    let { draft, scenarioId } = await draftForBlankRetelling(base, MONOLITH, { name: 'Payments at Acme', authors: [{ name: 'Ada' }] })
    const described = <S extends 'stakeholders' | 'cards' | 'events' | 'scenarios'>(section: S, id: string, extra: object = {}) => {
      draft = putContent(draft, section, { ...draft.content[section][id], description: 'In a sentence.', ...extra } as never)
    }
    const member = createOwnMember(draft, 'Head of Payments')
    draft = member.draft
    described('stakeholders', member.id)
    for (const [name, changes] of [['Freeze the Payment Path', [{ score_id: 'user_trust', delta: 6 }, { score_id: 'delivery_confidence', delta: -2 }]], ['Reconcile Nightly', [{ score_id: 'budget', delta: 5 }, { score_id: 'team_morale', delta: -2 }]]] as const) {
      const made = createOwnCard(draft, name)
      draft = made.draft
      described('cards', made.id, { score_changes: [...changes] })
    }
    const event = createOwnEvent(draft, 'Double-Charge Incident')
    draft = event.draft
    described('events', event.id, { score_changes: [{ score_id: 'user_trust', delta: -3 }] })
    // A few of the game's own cards, as an author would add from "+ From the game"
    const monolith = await base.loadScenario(MONOLITH)
    for (const ref of monolith.card_refs.slice(0, 4)) draft = addToDeck(draft, 'cards', ref)
    described('scenarios', scenarioId)

    const exported = await exportDraftBundle(draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    const snapshot = await readPackBundle(exported.text, exported.file_name)
    const { registry: games } = registry()
    const key = packKeyOf(snapshot)
    games.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
    const bundle = await buildScenarioBundle(scenarioId, 1, games.createScopedProvider(key))
    const runs = simulate_runs({ scenario_bundle: bundle, runs: 20, seed: 'from-scratch', play_policy: 'player_true' }).per_run
    expect(runs.every((run) => run.turns_completed === run.max_turns)).toBe(true)
  })
})
