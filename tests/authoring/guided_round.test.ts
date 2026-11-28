/**
 * The guided round (§5, D2, D9, D20): its steps, what each asks of the
 * draft, and that the round is the Studio's memory, never the pack's.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  addReaction,
  cardVerdict,
  createOwnCard,
  createOwnEnding,
  createOwnEvent,
  createOwnMember,
  createOwnScore,
  draftForNewTopic,
  draftFromBaseScenario,
  manifestRefs,
  draftToRawPack,
  eventLeaning,
  exportDraftBundle,
  finishRound,
  gameTarget,
  goToRoundStep,
  inRound,
  nextRoundStep,
  previousRoundStep,
  putContent,
  roundCards,
  roundClasses,
  roundCouncil,
  roundEndings,
  roundProgress,
  roundScores,
  roundStepDone,
  roundSteps,
  roundSurprises,
  secondSitting,
  setClassFavourite,
  startRound,
  updateDraftDetails,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

function firstParty(): FirstPartyPack[] {
  return ['content', 'content/tutorial'].map((root) => ({
    manifest: JSON.parse(readFileSync(path.resolve(root, 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(path.resolve(root)),
  }))
}
async function retelling(): Promise<DraftPack> {
  const registry = new ContentPackRegistry()
  const [base] = firstParty()
  registry.registerPack(base.manifest, base.provider)
  const { draft } = await draftFromBaseScenario(registry.createScopedProvider(firstPartyPackKey('base')), { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [] })
  return startRound(draft)
}
const score = (id: string, delta: number) => ({ score_id: id, delta })

describe('moving through the round', () => {
  it('starts at the first step, moves on and back, and never blocks', async () => {
    let draft = await retelling()
    expect(inRound(draft)).toBe(true)
    expect(draft.round).toEqual({ step: 'world', passed: [] })
    draft = nextRoundStep(nextRoundStep(draft))
    expect(draft.round).toEqual({ step: 'council', passed: ['world', 'scenario'] })
    // Nothing on the council yet, and "Next" still moves on
    draft = nextRoundStep(draft)
    expect(draft.round?.step).toBe('cards')
    expect(roundStepDone(draft, 'council')).toBe(false)
    expect(previousRoundStep(draft).round?.step).toBe('council')
    expect(goToRoundStep(draft, 'play').round?.step).toBe('play')
    expect(nextRoundStep(goToRoundStep(draft, 'play')).round?.step).toBe('play')
  })

  it('is the Studio\'s memory: the pack it exports is the same with or without it', async () => {
    const draft = await retelling()
    const target = gameTarget(firstParty())
    expect(draftToRawPack(draft, target)).toEqual(draftToRawPack(finishRound(draft), target))
    expect(finishRound(draft)).not.toHaveProperty('round')
  })
})

describe('what each step asks for', () => {
  it('names the world once it has a name, a sentence and its author, and the author moved on', async () => {
    const draft = { ...(await retelling()), authors: [{ name: 'Ada' }] }
    expect(roundStepDone(draft, 'world')).toBe(false)
    expect(roundStepDone(nextRoundStep({ ...draft, description: 'Our payments monolith.' }), 'world')).toBe(true)
    expect(roundStepDone(nextRoundStep({ ...draft, description: ' ' }), 'world')).toBe(false)
    expect(roundStepDone(nextRoundStep({ ...draft, description: 'Ours.', authors: [] }), 'world')).toBe(false)
  })

  it('checks it only once the game\'s checks pass', async () => {
    const draft = nextRoundStep(goToRoundStep(await retelling(), 'check'))
    expect(roundStepDone(draft, 'check')).toBe(false)
    expect(roundStepDone(draft, 'check', { clean: true })).toBe(true)
    expect(roundProgress(draft, { clean: true }).find((step) => step.step === 'check')?.done).toBe(true)
  })

  it('wants two of the author\'s own people, each with a reaction', async () => {
    let draft = await retelling()
    const head = createOwnMember(draft, 'Head of Payments'); draft = head.draft
    const support = createOwnMember(draft, 'Customer Support Lead'); draft = support.draft
    expect(roundCouncil(draft).map((member) => [member.name, member.reactions])).toEqual([['Head of Payments', 0], ['Customer Support Lead', 0]])
    expect(roundStepDone(draft, 'council')).toBe(false)
    const trust = { id: 'user_trust', name: 'User Trust' }
    draft = addReaction(draft, head.id, trust).draft
    expect(roundStepDone(draft, 'council')).toBe(false)
    draft = addReaction(draft, support.id, trust).draft
    expect(roundStepDone(draft, 'council')).toBe(true)
  })

  it('wants three of the author\'s own cards, and says which only help', async () => {
    let draft = await retelling()
    for (const [name, changes] of [['Freeze the Payment Path', [score('user_trust', 5), score('team_morale', -3)]], ['Add a Read Replica', [score('delivery_confidence', 6)]], ['Rename Things', []]] as const) {
      const made = createOwnCard(draft, name)
      draft = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], score_changes: [...changes] })
    }
    expect(roundCards(draft).map((card) => [card.name, card.verdict])).toEqual([
      ['Freeze the Payment Path', 'trades_off'], ['Add a Read Replica', 'only_helps'], ['Rename Things', 'no_changes'],
    ])
    expect(roundStepDone(draft, 'cards')).toBe(true)
    expect(cardVerdict({ score_changes: [score('budget', -2)], stakeholder_changes: [] })).toBe('only_hurts')
    // A council member's satisfaction counts as a cost too
    expect(cardVerdict({ score_changes: [score('budget', 3)], stakeholder_changes: [{ stakeholder_id: 'x', delta: -2 }] })).toBe('trades_off')
  })

  it('wants one bad surprise and one good one; a mixed one is neither', async () => {
    let draft = await retelling()
    const make = (name: string, changes: ReturnType<typeof score>[]) => {
      const made = createOwnEvent(draft, name)
      draft = putContent(made.draft, 'events', { ...made.draft.content.events[made.id], score_changes: changes })
    }
    make('Chargeback Storm', [score('user_trust', -4), score('budget', -4)])
    make('Mixed Blessing', [score('user_trust', 3), score('budget', -2)])
    expect(roundStepDone(draft, 'surprises')).toBe(false)
    make('The Audit Dry Run Goes Well', [score('user_trust', 4)])
    expect(roundSurprises(draft).map((event) => event.leaning)).toEqual(['bad', 'mixed', 'good'])
    expect(roundStepDone(draft, 'surprises')).toBe(true)
    expect(eventLeaning({ score_changes: [], stakeholder_changes: [] })).toBe('no_changes')
  })

  it('reports every step, and which is open', async () => {
    const draft = nextRoundStep(await retelling())
    expect(roundProgress(draft).map((step) => [step.step, step.current])).toEqual([
      ['world', false], ['scenario', true], ['council', false], ['cards', false], ['surprises', false], ['deck', false], ['check', false], ['play', false],
    ])
  })
})

/** A topic's skeleton, in its round (D33): a scenario, a fallback ending, a class with no favourite. */
function topicRound(): DraftPack {
  return startRound(draftForNewTopic({ name: 'Incident Response', authors: [{ name: 'Ada' }] }, manifestRefs(firstParty()[0].manifest, 'outcome_tiers')).draft)
}

describe("a new topic's round", () => {
  it('has its own steps: what it trades off, its endings and a class, and no deck from the game', async () => {
    expect(roundSteps(topicRound())).toEqual(['world', 'scores', 'scenario', 'council', 'cards', 'surprises', 'endings', 'class', 'check', 'play'])
    expect(roundSteps(await retelling())).not.toContain('scores')
    // A step the round doesn't have can't be opened
    expect(goToRoundStep(topicRound(), 'deck').round?.step).toBe('world')
    expect(goToRoundStep(await retelling(), 'class').round?.step).toBe('world')
    let draft = topicRound()
    for (let i = 0; i < 9; i++) draft = nextRoundStep(draft)
    expect(draft.round?.step).toBe('play')
  })

  it('is two sittings: the second starts at the cards; a retelling is one', async () => {
    expect(secondSitting(topicRound())).toBe('cards')
    expect(secondSitting(await retelling())).toBeNull()
  })

  it('wants three named scores, and says how the cards pull each one', () => {
    let draft = topicRound()
    const ids: string[] = []
    for (const name of ['Rested On-Call', 'Availability', 'New score']) {
      const made = createOwnScore(draft, name)!
      draft = made.draft
      ids.push(made.id)
    }
    // The third still has the name it was made with
    expect(roundStepDone(draft, 'scores')).toBe(false)
    const [rest, uptime] = ids
    for (const changes of [[score(rest, 8), score(uptime, -1)], [score(uptime, 6)]]) {
      const made = createOwnCard(draft, 'A move')
      draft = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], score_changes: changes })
    }
    expect(roundScores(draft).map((item) => [item.name, item.raised_by, item.lowered_by, item.pull])).toEqual([
      ['Rested On-Call', 1, 0, 'only_up'], ['Availability', 1, 1, 'both_ways'], ['New score', 0, 0, 'untouched'],
    ])
    draft = createOwnScore(draft, 'Change Velocity')!.draft
    expect(roundStepDone(draft, 'scores')).toBe(true)
  })

  it('wants two endings besides the one every run reaches', () => {
    let draft = createOwnScore(topicRound(), 'Rest')!.draft
    expect(roundEndings(draft).map((ending) => [ending.name, ending.fallback])).toEqual([['Held It Together', true]])
    draft = createOwnEnding(draft, 'The Toil Slayer')!.draft
    expect(roundStepDone(draft, 'endings')).toBe(false)
    draft = createOwnEnding(draft)!.draft
    // Named as the Studio made it: not yet the author's
    expect(roundStepDone(draft, 'endings')).toBe(false)
    draft = createOwnEnding(draft, 'The Hero Firefighter')!.draft
    expect(roundStepDone(draft, 'endings')).toBe(true)
  })

  it('wants a class of the author\'s own naming, with a favourite score the scenario tracks', () => {
    const made = createOwnScore(topicRound(), 'Rest')!
    const [generalist] = roundClasses(made.draft)
    expect(generalist).toEqual({ id: generalist.id, name: 'Generalist', favourite: null, named: false })
    expect(roundStepDone(made.draft, 'class')).toBe(false)
    const favoured = setClassFavourite(made.draft, generalist.id, made.id)
    expect(roundClasses(favoured)[0].favourite).toBe(made.id)
    // The skeleton's "Generalist" is a stand-in: a Generalist with a favourite isn't one
    expect(roundStepDone(favoured, 'class')).toBe(false)
    const renamed = putContent(favoured, 'classes', { ...favoured.content.classes[generalist.id], name: 'Toil Druid' })
    expect(roundStepDone(renamed, 'class')).toBe(true)
    // A favourite the scenario doesn't track isn't one
    expect(roundStepDone(putContent(setClassFavourite(made.draft, generalist.id, 'gone'), 'classes', { ...made.draft.content.classes[generalist.id], name: 'Toil Druid', score_affinity: 'gone' }), 'class')).toBe(false)
  })

  it('names its world like a retelling does', () => {
    const draft = nextRoundStep(updateDraftDetails(topicRound(), { description: 'Keep the pager quiet.' }))
    expect(roundStepDone(draft, 'world')).toBe(true)
    expect(roundProgress(draft).map((step) => step.step)).toEqual(roundSteps(draft))
  })
})

describe('a topic made by its round alone', () => {
  it('exports, and plays a whole run in the game: three cards are enough (D6)', async () => {
    let draft = updateDraftDetails(topicRound(), { description: 'Keep the pager quiet without burning out the team.' })
    const described = <S extends 'scores' | 'stakeholders' | 'stakeholder_reaction_rules' | 'cards' | 'events' | 'outcome_archetypes' | 'classes' | 'scenarios'>(section: S, id: string, extra: object = {}) => {
      draft = putContent(draft, section, { ...draft.content[section][id], description: 'In a sentence.', ...extra } as never)
    }
    const scores = ['Rested On-Call', 'Availability', 'Change Velocity'].map((name) => {
      const made = createOwnScore(draft, name)!
      draft = made.draft
      described('scores', made.id)
      return { id: made.id, name }
    })
    const [rest, uptime, velocity] = scores
    for (const name of ['On-Call Engineer', 'Product Lead']) {
      const member = createOwnMember(draft, name)
      draft = addReaction(member.draft, member.id, rest).draft
      described('stakeholders', member.id)
    }
    for (const reaction of Object.keys(draft.content.stakeholder_reaction_rules)) described('stakeholder_reaction_rules', reaction)
    for (const [name, changes] of [['Tune the Noisy Alerts', [score(rest.id, 8), score(uptime.id, -1)]], ['Heroic Fix', [score(uptime.id, 8), score(rest.id, -3)]], ['Ship Anyway', [score(velocity.id, 7), score(uptime.id, -2)]]] as const) {
      const made = createOwnCard(draft, name)
      draft = made.draft
      described('cards', made.id, { score_changes: [...changes] })
    }
    for (const [name, changes] of [['The 3 a.m. Outage', [score(uptime.id, -4)]], ['A Quiet Week', [score(rest.id, 3)]]] as const) {
      const made = createOwnEvent(draft, name)
      draft = made.draft
      described('events', made.id, { score_changes: [...changes] })
    }
    for (const name of ['The Toil Slayer', 'The Hero Firefighter']) {
      const made = createOwnEnding(draft, name)!
      draft = made.draft
      described('outcome_archetypes', made.id)
    }
    const [generalist] = Object.values(draft.content.classes)
    draft = putContent(setClassFavourite(draft, generalist.id, rest.id), 'classes', { ...setClassFavourite(draft, generalist.id, rest.id).content.classes[generalist.id], name: 'Toil Druid' })
    const [scenario] = Object.values(draft.content.scenarios)
    described('scenarios', scenario.id)
    expect(roundProgress(draft).filter((step) => !step.done).map((step) => step.step)).toEqual(['world', 'scenario', 'check', 'play'])

    const exported = await exportDraftBundle(finishRound(draft), firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    const snapshot = await readPackBundle(exported.text, exported.file_name)
    const registry = new ContentPackRegistry()
    for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
    const key = packKeyOf(snapshot)
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
    const bundle = await buildScenarioBundle(scenario.id, 1, registry.createScopedProvider(key))
    const runs = simulate_runs({ scenario_bundle: bundle, runs: 20, seed: 'topic-round', play_policy: 'player_true' }).per_run
    expect(runs.every((run) => run.turns_completed === run.max_turns)).toBe(true)
    expect(new Set(runs.map((run) => run.archetype)).size).toBeGreaterThan(0)
  })
})
