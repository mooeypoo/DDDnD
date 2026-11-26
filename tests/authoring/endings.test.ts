/**
 * Endings (M4.18): an ordered list, tried first to last, with the fallback
 * always last; conditions in plain words for any pack's names.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  checkDraft,
  createOwnEnding,
  createOwnScore,
  describeEnding,
  describeEndingCondition,
  draftForNewTopic,
  endingDeletion,
  endingOperatorChoices,
  endingsInOrder,
  isFallback,
  manifestRefs,
  moveEnding,
  nextSteps,
  removeOwnEnding,
  setEndingConditions,
  updateDraftDetails,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { ContentPackManifest, Scenario } from '@/domains/content/model'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
function firstParty(): FirstPartyPack[] {
  return (Object.keys(ROOTS) as Array<keyof typeof ROOTS>).map((id) => ({
    manifest: JSON.parse(readFileSync(path.join(ROOTS[id], 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(ROOTS[id]),
  }))
}

/** A topic with two scores, Rest and Uptime. */
function topic(): { draft: DraftPack; rest: string; uptime: string } {
  let draft = draftForNewTopic({ name: 'Incident Response', authors: [{ name: 'Ada' }] }, manifestRefs(firstParty()[0].manifest, 'outcome_tiers')).draft
  const rest = createOwnScore(draft, 'Rest')!
  const uptime = createOwnScore(rest.draft, 'Uptime')!
  draft = uptime.draft
  return { draft, rest: rest.id, uptime: uptime.id }
}
const names = (draft: DraftPack) => ({ scores: Object.fromEntries(Object.values(draft.content.scores).map((score) => [score.id, score.name])), stakeholders: {} })
const order = (draft: DraftPack) => endingsInOrder(draft).map((ending) => ending.name)

describe('the order endings are tried in', () => {
  it('puts a new ending first, with a condition to start from, and keeps the fallback last', () => {
    const { draft, rest } = topic()
    const made = createOwnEnding(draft, 'Pager Haunted')!
    expect(order(made.draft)).toEqual(['Pager Haunted', 'Held It Together'])
    expect(made.draft.content.outcome_archetypes[made.id].criteria?.when).toEqual([{ measure: 'final_score', score_id: rest, operator: '>=', value: 70 }])
    expect(endingsInOrder(made.draft).map((ending) => ending.criteria!.priority)).toEqual([10, 0])
    expect(Object.values(made.draft.content.scenarios)[0].outcome_archetype_refs).toContainEqual({ id: made.id, version: 1 })
  })

  it('moves an ending earlier or later, never below the fallback, and renumbers the priorities', () => {
    let { draft } = topic()
    draft = createOwnEnding(draft, 'Second')!.draft
    draft = createOwnEnding(draft, 'First')!.draft
    expect(order(draft)).toEqual(['First', 'Second', 'Held It Together'])
    const second = endingsInOrder(draft)[1].id
    draft = moveEnding(draft, second, 'earlier')
    expect(order(draft)).toEqual(['Second', 'First', 'Held It Together'])
    expect(endingsInOrder(draft).map((ending) => ending.criteria!.priority)).toEqual([20, 10, 0])
    const first = endingsInOrder(draft)[1].id
    expect(order(moveEnding(draft, first, 'later'))).toEqual(['Second', 'First', 'Held It Together'])
    const fallback = endingsInOrder(draft)[2].id
    expect(order(moveEnding(draft, fallback, 'earlier'))).toEqual(['Second', 'First', 'Held It Together'])
  })

  it('makes an ending whose conditions are all removed a fallback, tried last', () => {
    let { draft } = topic()
    const made = createOwnEnding(draft, 'Pager Haunted')!
    draft = setEndingConditions(made.draft, made.id, [])
    expect(isFallback(draft.content.outcome_archetypes[made.id])).toBe(true)
    expect(order(draft)[1]).toBe('Pager Haunted')
  })
})

describe('deleting an ending', () => {
  it('keeps the last fallback, and says why', () => {
    const { draft } = topic()
    const fallback = endingsInOrder(draft)[0].id
    expect(endingDeletion(draft, fallback)).toEqual({ ok: false, reason: expect.stringMatching(/Every scenario needs one ending that every run can reach/) })
    expect(removeOwnEnding(draft, fallback)).toBe(draft)
  })

  it('removes any other ending from every scenario', () => {
    const made = createOwnEnding(topic().draft, 'Pager Haunted')!
    const removed = removeOwnEnding(made.draft, made.id)
    expect(removed.content.outcome_archetypes[made.id]).toBeUndefined()
    expect(Object.values(removed.content.scenarios)[0].outcome_archetype_refs?.map((ref) => ref.id)).not.toContain(made.id)
  })
})

describe('endings in plain words, for any pack\'s names (D29)', () => {
  it('says each kind of condition generically', () => {
    const { draft, rest, uptime } = topic()
    const n = { ...names(draft), stakeholders: { oncall: 'On-Call Engineer' } }
    expect(describeEndingCondition({ measure: 'final_score', score_id: rest, operator: '<', value: 25 }, n)).toBe('Rest ends below 25')
    expect(describeEndingCondition({ measure: 'score_change', score_ids: [rest, uptime], operator: '>=', value: 20 }, n)).toBe('Rest and Uptime change by at least +20 over the run, together')
    expect(describeEndingCondition({ measure: 'score_change', score_ids: [rest], operator: '<', value: -5 }, n)).toBe('Rest changes by less than −5 over the run')
    expect(describeEndingCondition({ measure: 'stakeholder_change', operator: '>=', value: 10 }, n)).toBe('the council\'s satisfaction changes by at least +10 over the run')
    expect(describeEndingCondition({ measure: 'stakeholder_change', stakeholder_ids: ['oncall'], operator: '<', value: 0 }, n)).toBe('On-Call Engineer\'s satisfaction changes by less than 0 over the run')
    expect(describeEndingCondition({ measure: 'pressure_per_turn', operator: '>', value: 1.5 }, n)).toBe('events and aftershocks land more than 1.5 times a turn')
  })

  it('says when an ending is chosen, and that the fallback catches every other run', () => {
    const { draft } = topic()
    const made = createOwnEnding(draft, 'Pager Haunted')!
    expect(describeEnding(made.draft.content.outcome_archetypes[made.id], names(made.draft))).toBe('when Rest ends at or above 70')
    expect(describeEnding(endingsInOrder(made.draft)[1], names(made.draft))).toBe('when no ending tried before it fits: every run can end here')
  })
})

describe('a topic with endings of its own', () => {
  it('ticks "Write the endings" once there\'s one besides the fallback', () => {
    const { draft } = topic()
    expect(nextSteps(draft).find((step) => step.step === 'write_endings')?.done).toBe(false)
    expect(nextSteps(createOwnEnding(draft, 'Pager Haunted')!.draft).find((step) => step.step === 'write_endings')?.done).toBe(true)
  })

  it('passes the game\'s ending checks: unique priorities, a fallback last, only tracked scores', async () => {
    let { draft } = topic()
    draft = createOwnEnding(draft, 'Pager Haunted')!.draft
    draft = createOwnEnding(draft, 'Steady Hands')!.draft
    for (const ending of Object.values(draft.content.outcome_archetypes)) {
      draft = { ...draft, content: { ...draft.content, outcome_archetypes: { ...draft.content.outcome_archetypes, [ending.id]: { ...ending, description: 'A way to end.' } } } }
    }
    for (const score of Object.values(draft.content.scores)) {
      draft = { ...draft, content: { ...draft.content, scores: { ...draft.content.scores, [score.id]: { ...score, description: 'Something that matters.' } } } }
    }
    const scenario = Object.values(draft.content.scenarios)[0] as Scenario
    draft = { ...draft, content: { ...draft.content, scenarios: { [scenario.id]: { ...scenario, description: 'The pager is loud.' } } } }
    expect((await checkDraft(updateDraftDetails(draft, {}), firstParty())).issues).toEqual([])
  })
})

describe('the comparisons an author picks from', () => {
  it('fit what is measured', () => {
    expect(endingOperatorChoices('final_score')['<=']).toBe('at or below')
    expect(endingOperatorChoices('score_change')['>']).toBe('more than')
    expect(endingOperatorChoices('pressure_per_turn')['<']).toBe('fewer than')
  })
})
