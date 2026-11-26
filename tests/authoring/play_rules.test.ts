/**
 * A topic's rules of play (M4.19): classes, challenges (modifiers) and
 * coupling rules, their words, and what deleting a score does to them.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  checkDraft,
  classDeletion,
  couplingInOrder,
  couplingLostWith,
  createOwnChallenge,
  createOwnClass,
  createOwnCoupling,
  createOwnScore,
  describeChallenge,
  describeClass,
  describeCoupling,
  draftForNewTopic,
  manifestRefs,
  putContent,
  removeOwnClass,
  removeOwnCoupling,
  removeOwnScore,
  setClassFavourite,
  toFillIn,
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

function topic(): { draft: DraftPack; rest: string; uptime: string } {
  let draft = draftForNewTopic({ name: 'Incident Response', authors: [{ name: 'Ada' }] }, manifestRefs(firstParty()[0].manifest, 'outcome_tiers')).draft
  const rest = createOwnScore(draft, 'Rest')!
  const uptime = createOwnScore(rest.draft, 'Uptime')!
  draft = uptime.draft
  return { draft, rest: rest.id, uptime: uptime.id }
}
const names = (draft: DraftPack) => ({ scores: Object.fromEntries(Object.values(draft.content.scores).map((score) => [score.id, score.name])) })
const generalist = (draft: DraftPack) => Object.values(draft.content.classes)[0].id

describe('classes', () => {
  it('start with no favourite score, and say what a favourite does', () => {
    const { draft, rest } = topic()
    const made = createOwnClass(draft, 'Pager Paladin')
    expect(made.draft.content.classes[made.id]).not.toHaveProperty('score_affinity')
    expect(describeClass(made.draft.content.classes[made.id], names(made.draft))).toBe('no favourite score: fits any table')
    const favoured = setClassFavourite(made.draft, made.id, rest)
    expect(describeClass(favoured.content.classes[made.id], names(favoured))).toBe('Rest +1 every turn')
    expect(setClassFavourite(favoured, made.id, null).content.classes[made.id]).not.toHaveProperty('score_affinity')
  })

  it('keep the last class that fits a topic\'s table, and say why', () => {
    const { draft } = topic()
    expect(classDeletion(draft, generalist(draft))).toEqual({ ok: false, reason: expect.stringMatching(/Every table needs a class to play as/) })
    expect(removeOwnClass(draft, generalist(draft))).toBe(draft)
    const another = createOwnClass(draft, 'Pager Paladin')
    expect(classDeletion(another.draft, generalist(draft))).toEqual({ ok: true })
    expect(removeOwnClass(another.draft, generalist(draft)).content.classes[generalist(draft)]).toBeUndefined()
  })
})

describe('challenges', () => {
  it('start by lowering the first score, and say what they do from their numbers', () => {
    const { draft, rest, uptime } = topic()
    const made = createOwnChallenge(draft, 'Launch Week')
    expect(made.draft.content.challenge_modifiers[made.id].score_adjustments).toEqual({ [rest]: -10 })
    expect(describeChallenge({ score_adjustments: { [rest]: -15, [uptime]: -5 }, stakeholder_satisfaction_override: 40, turn_adjustment: -2 }, names(draft)))
      .toBe('Rest starts −15, Uptime starts −5; every council member starts at 40 satisfaction; 2 fewer turns')
    expect(describeChallenge({ turn_adjustment: 1 }, names(draft))).toBe('1 more turn')
    expect(describeChallenge({}, names(draft))).toBe('no changes yet')
  })
})

describe('coupling rules', () => {
  it('are listed by every scenario, and say what they do', () => {
    const { draft, rest, uptime } = topic()
    const made = createOwnCoupling(draft, 'Burnout Spiral')!
    const rule = made.draft.content.coupling_rules[made.id]
    expect(rule).toMatchObject({ trigger_score_id: rest, threshold: 25, affected_score_ids: [uptime], gain_multiplier: 0.7 })
    expect(Object.values(made.draft.content.scenarios)[0].coupling_rule_refs).toEqual([{ id: made.id, version: 1 }])
    expect(couplingInOrder(made.draft).map((other) => other.id)).toEqual([made.id])
    expect(describeCoupling(rule, names(made.draft))).toBe('While Rest is below 25, gains to Uptime are cut to 70%. Losses aren\'t changed.')
    const removed = removeOwnCoupling(made.draft, made.id)
    expect(removed.content.coupling_rules[made.id]).toBeUndefined()
    expect(Object.values(removed.content.scenarios)[0].coupling_rule_refs).toEqual([])
  })

  it('need a score to watch', () => {
    const empty = draftForNewTopic({ name: 'Empty' }, []).draft
    expect(createOwnCoupling(empty)).toBeNull()
  })
})

describe('deleting a score', () => {
  it('takes it out of classes, challenges and coupling rules that only use it alongside others', () => {
    let { draft, rest, uptime } = topic()
    const paladin = createOwnClass(draft, 'Pager Paladin'); draft = setClassFavourite(paladin.draft, paladin.id, uptime)
    const week = createOwnChallenge(draft, 'Launch Week'); draft = putContent(week.draft, 'challenge_modifiers', { ...week.draft.content.challenge_modifiers[week.id], score_adjustments: { [rest]: -10, [uptime]: -5 } })
    const spiral = createOwnCoupling(draft, 'Burnout Spiral')!; draft = putContent(spiral.draft, 'coupling_rules', { ...spiral.draft.content.coupling_rules[spiral.id], affected_score_ids: [rest, uptime] })
    const removed = removeOwnScore(draft, uptime)
    expect(removed.content.classes[paladin.id]).not.toHaveProperty('score_affinity')
    expect(removed.content.challenge_modifiers[week.id].score_adjustments).toEqual({ [rest]: -10 })
    expect(removed.content.coupling_rules[spiral.id].affected_score_ids).toEqual([rest])
  })

  it('takes away the coupling rules that watch it or cut only it, and says which first', () => {
    const { draft, rest, uptime } = topic()
    const spiral = createOwnCoupling(draft, 'Burnout Spiral')! // watches Rest, cuts Uptime
    expect(couplingLostWith(spiral.draft, rest).map((rule) => rule.name)).toEqual(['Burnout Spiral'])
    expect(couplingLostWith(spiral.draft, uptime).map((rule) => rule.name)).toEqual(['Burnout Spiral'])
    const removed = removeOwnScore(spiral.draft, rest)
    expect(removed.content.coupling_rules[spiral.id]).toBeUndefined()
    expect(Object.values(removed.content.scenarios)[0].coupling_rule_refs).toEqual([])
  })

  it('is never written as an id', () => {
    expect(describeCoupling({ trigger_score_id: 'gone', threshold: 25, affected_score_ids: ['gone'], gain_multiplier: 0.7 }, { scores: {} }))
      .toBe('While a score that isn\'t in this pack is below 25, gains to a score that isn\'t in this pack are cut to 70%. Losses aren\'t changed.')
  })
})

describe('a topic with its own rules of play', () => {
  it('lists the new ones as still to fill in, until they say what they are', () => {
    const { draft } = topic()
    const made = createOwnChallenge(draft)
    expect(toFillIn(made.draft)).toContainEqual(expect.objectContaining({ section: 'challenge_modifiers', missing: ['name', 'description'] }))
  })

  it('passes the game\'s checks: a class that fits, a challenge the table offers, a coupling rule on tracked scores', async () => {
    let { draft, rest } = topic()
    const paladin = createOwnClass(draft, 'Pager Paladin'); draft = setClassFavourite(paladin.draft, paladin.id, rest)
    const week = createOwnChallenge(draft, 'Launch Week'); draft = week.draft
    const spiral = createOwnCoupling(draft, 'Burnout Spiral')!; draft = spiral.draft
    for (const [section, id] of [['classes', paladin.id], ['challenge_modifiers', week.id], ['coupling_rules', spiral.id]] as const) {
      draft = putContent(draft, section, { ...(draft.content[section][id] as never as object), description: 'Says what it is.' } as never)
    }
    for (const score of Object.values(draft.content.scores)) draft = putContent(draft, 'scores', { ...score, description: 'Something that matters.' })
    const scenario = Object.values(draft.content.scenarios)[0]
    draft = putContent(draft, 'scenarios', { ...scenario, description: 'The pager is loud.' })
    expect((await checkDraft(draft, firstParty())).issues).toEqual([])
  })
})
