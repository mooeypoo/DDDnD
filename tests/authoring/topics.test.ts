/**
 * Teaching a different topic (M4.17): the starter skeleton, the author's own
 * scores, and connecting a new score from inside a card (D30).
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  canAddScore,
  checkDraft,
  connectNewScore,
  createOwnCard,
  createOwnMember,
  createOwnScore,
  draftForNewTopic,
  manifestRefs,
  nextSteps,
  ownChangesToScore,
  removeOwnScore,
  SCORES_PER_SCENARIO,
  shortNameFor,
  toFillIn,
  usesGameContent,
  withScoreName,
  TOPIC_STARTERS,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
function firstParty(): FirstPartyPack[] {
  return (Object.keys(ROOTS) as Array<keyof typeof ROOTS>).map((id) => ({
    manifest: JSON.parse(readFileSync(path.join(ROOTS[id], 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(ROOTS[id]),
  }))
}
const tiers = () => manifestRefs(firstParty()[0].manifest, 'outcome_tiers')
const topic = (): DraftPack => draftForNewTopic({ name: 'Security Awareness', authors: [{ name: 'Ada' }] }, tiers()).draft
const scenarioOf = (draft: DraftPack) => Object.values(draft.content.scenarios)[0]

describe('a new topic\'s skeleton', () => {
  it('has one scenario using the game\'s tiers, a fallback ending, and a class that fits any table', () => {
    const draft = topic()
    expect(draft.kind).toBe('new_topic')
    const scenario = scenarioOf(draft)
    expect(scenario.name).toBe('Security Awareness')
    expect(scenario.outcome_tier_refs?.map((ref) => ref.id).sort()).toEqual(['collapse', 'struggle', 'success', 'survival', 'triumph'])
    const [ending] = Object.values(draft.content.outcome_archetypes)
    expect(ending).toMatchObject({ name: TOPIC_STARTERS.ending.name, criteria: { priority: 0, when: [] } })
    expect(scenario.outcome_archetype_refs).toEqual([{ id: ending.id, version: 1 }])
    const [playerClass] = Object.values(draft.content.classes)
    expect(playerClass.name).toBe(TOPIC_STARTERS.playerClass.name)
    expect(playerClass).not.toHaveProperty('score_affinity')
  })

  it('passes the game\'s checks except what only the author can write', async () => {
    const issues = (await checkDraft(topic(), firstParty())).issues
    expect(issues).toEqual([{ file: expect.stringMatching(/^scenarios\//), message: 'description: must not be blank' }])
  })

  it('starts its steps with naming what the topic trades off', () => {
    expect(nextSteps(topic())[0]).toEqual({ step: 'name_scores', done: false })
    let draft = topic()
    for (const name of ['Trust', 'Speed', 'Coverage']) draft = createOwnScore(draft, name)!.draft
    expect(nextSteps(draft)[0]).toEqual({ step: 'name_scores', done: true })
  })
})

describe('the author\'s own scores', () => {
  it('are tracked by every scenario, starting mid-range, with a short name for tight spots', () => {
    const made = createOwnScore(topic(), 'Phishing Resistance')!
    const scenario = scenarioOf(made.draft)
    expect(scenario.score_refs).toContainEqual({ id: made.id, version: 1 })
    expect(scenario.starting_scores[made.id]).toBe(50)
    expect(made.draft.content.scores[made.id]).toMatchObject({ name: 'Phishing Resistance', short_name: 'Phishing', default_value: 50 })
    expect(shortNameFor('Trust')).toBe('Trust')
    // A score is a placeholder until it says what it measures
    expect(toFillIn(made.draft)).toContainEqual(expect.objectContaining({ section: 'scores', missing: ['description'] }))
  })

  it('stop at the game\'s limit of scores per scenario', () => {
    let draft = topic()
    for (let i = 0; i < SCORES_PER_SCENARIO; i++) draft = createOwnScore(draft, `Score ${i}`)!.draft
    expect(createOwnScore(draft, 'One Too Many')).toBeNull()
  })

  it('can be made from inside a card, which then changes it (D30)', () => {
    const card = createOwnCard(topic(), 'Run a Phishing Drill')
    const connected = connectNewScore(card.draft, 'cards', card.id, 'Trust')!
    expect(connected.draft.content.cards[card.id].score_changes).toEqual([{ score_id: connected.score, delta: 1 }])
    expect(scenarioOf(connected.draft).score_refs.map((ref) => ref.id)).toContain(connected.score)
    expect(connectNewScore(card.draft, 'cards', card.id, '  ')).toBeNull()
  })

  it('when deleted, leave every scenario and every change the author made to them', () => {
    const card = createOwnCard(topic(), 'Run a Phishing Drill')
    const connected = connectNewScore(card.draft, 'cards', card.id, 'Trust')!
    const member = createOwnMember(connected.draft, 'Security Lead')
    expect(ownChangesToScore(member.draft, connected.score)).toEqual([{ section: 'cards', id: card.id, name: 'Run a Phishing Drill' }])
    const removed = removeOwnScore(member.draft, connected.score)
    expect(removed.content.scores[connected.score]).toBeUndefined()
    expect(scenarioOf(removed).score_refs).toEqual([])
    expect(scenarioOf(removed).starting_scores).toEqual({})
    expect(removed.content.cards[card.id].score_changes).toEqual([])
  })
})

describe('who can add a score', () => {
  it('is a topic with room for one, never a retelling', () => {
    expect(canAddScore(topic())).toBe(true)
    expect(canAddScore({ ...topic(), kind: 'retelling' })).toBe(false)
    let full = topic()
    for (let i = 0; i < SCORES_PER_SCENARIO; i++) full = createOwnScore(full, `Score ${i}`)!.draft
    expect(canAddScore(full)).toBe(false)
  })
})

describe('renaming a score', () => {
  it('moves the short name along until the author writes their own', () => {
    const made = createOwnScore(topic())!
    const score = made.draft.content.scores[made.id]
    const renamed = withScoreName(score, 'Rest')
    expect(renamed.short_name).toBe('Rest')
    expect(withScoreName(renamed, 'On-Call Rest').short_name).toBe('On-Call Rest')
    const custom = { ...renamed, short_name: 'Sleep' }
    expect(withScoreName(custom, 'Engineer Rest').short_name).toBe('Sleep')
  })
})

describe('the game\'s own content in a topic', () => {
  it('is for retellings: a topic\'s scores aren\'t the game\'s', () => {
    expect(usesGameContent(topic())).toBe(false)
    expect(usesGameContent({ ...topic(), kind: 'retelling' })).toBe(true)
  })
})
