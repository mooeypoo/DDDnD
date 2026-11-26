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
  createOwnEvent,
  createOwnMember,
  draftFromBaseScenario,
  draftToRawPack,
  eventLeaning,
  finishRound,
  gameTarget,
  goToRoundStep,
  inRound,
  nextRoundStep,
  previousRoundStep,
  putContent,
  roundCards,
  roundCouncil,
  roundProgress,
  roundStepDone,
  roundSurprises,
  startRound,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
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
