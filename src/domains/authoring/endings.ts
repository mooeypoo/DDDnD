/**
 * Endings: what kind of leader the player was (docs/PACK_STUDIO.md §5; the
 * game's rule in simulation/rules/select_ending.ts; M4.18).
 *
 * The game tries a scenario's endings from the highest priority down and
 * picks the first whose conditions all hold. Authors never see a priority:
 * the Studio keeps endings as an ordered list, "tried first" to "tried
 * last", and the fallback (no conditions, so every run fits it) is always
 * last. The game requires one, and anything after it could never be reached.
 */

import type { EndingCondition, EndingOperator, OutcomeArchetype, VersionRef } from '../content/model'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import { addContent, putContent, type DraftPack } from './draft_pack'
import { scenarioRefs } from './draft_reading'
import { signedDelta } from './deck'

export const ENDING_PLACEHOLDER = 'New ending'

/** The most endings a scenario can list (the game's limit). */
export const ENDINGS_PER_SCENARIO = CONTENT_LIMITS.counts.outcome_refs

/** The most conditions one ending can check (the game's limit). */
export const CONDITIONS_PER_ENDING = CONTENT_LIMITS.counts.ending_conditions

/** Gaps between priorities, so the order is easy to read in the pack's files. */
const STEP = 10

/** An ending with no conditions: every run fits it, so it must be tried last. */
export function isFallback(ending: Pick<OutcomeArchetype, 'criteria'>): boolean {
  return (ending.criteria?.when.length ?? 0) === 0
}

/** The draft's own endings its scenarios use, in the order the game tries them: highest priority first, then by id. */
export function endingsInOrder(draft: DraftPack): OutcomeArchetype[] {
  const ids = new Set(Object.values(draft.content.scenarios).flatMap((scenario) => (scenario.outcome_archetype_refs ?? []).map((ref) => ref.id)))
  return Object.values(draft.content.outcome_archetypes)
    .filter((ending) => ids.has(ending.id) && ending.criteria !== undefined)
    .sort((a, b) => (b.criteria!.priority - a.criteria!.priority) || a.id.localeCompare(b.id))
}

/** Gives the endings, in this order, evenly spaced priorities: the last one 0, then 10, 20 … upwards. */
function withOrder(draft: DraftPack, ordered: readonly OutcomeArchetype[]): DraftPack {
  let next = draft
  ordered.forEach((ending, index) => {
    const priority = (ordered.length - 1 - index) * STEP
    if (ending.criteria?.priority !== priority) next = putContent(next, 'outcome_archetypes', { ...ending, criteria: { when: ending.criteria?.when ?? [], priority } })
  })
  return next
}

/** A first condition for a new ending, for the author to change: the scenario's first score ends at 70 or more. */
export function startingEndingCondition(draft: DraftPack): EndingCondition {
  const [score] = scenarioRefs(draft, 'score_refs')
  return score
    ? { measure: 'final_score', score_id: score.id, operator: '>=', value: 70 }
    : { measure: 'pressure_per_turn', operator: '>=', value: 1 }
}

/**
 * A new ending of the draft's own, tried first (endings are most specific at
 * the top), with one condition to start from, and listed by every scenario.
 * Null when a scenario already lists as many as the game allows.
 */
export function createOwnEnding(draft: DraftPack, name: string = ENDING_PLACEHOLDER): { draft: DraftPack; id: string } | null {
  if (Object.values(draft.content.scenarios).some((scenario) => (scenario.outcome_archetype_refs?.length ?? 0) >= ENDINGS_PER_SCENARIO)) return null
  const added = addContent(draft, 'outcome_archetypes', { name, description: '', criteria: { priority: 0, when: [startingEndingCondition(draft)] } } as Omit<OutcomeArchetype, 'id' | 'version'>)
  let next = added.draft
  for (const scenario of Object.values(next.content.scenarios)) {
    next = putContent(next, 'scenarios', { ...scenario, outcome_archetype_refs: [...(scenario.outcome_archetype_refs ?? []), { id: added.id, version: 1 }] })
  }
  const ending = next.content.outcome_archetypes[added.id]
  return { draft: withOrder(next, [ending, ...endingsInOrder(next).filter((other) => other.id !== added.id)]), id: added.id }
}

/**
 * Moves an ending one place earlier or later in the order it's tried. The
 * fallback stays last, so nothing moves below it and it doesn't move.
 */
export function moveEnding(draft: DraftPack, id: string, direction: 'earlier' | 'later'): DraftPack {
  const ordered = endingsInOrder(draft)
  const index = ordered.findIndex((ending) => ending.id === id)
  if (index < 0 || isFallback(ordered[index])) return draft
  const target = direction === 'earlier' ? index - 1 : index + 1
  if (target < 0 || target >= ordered.length || isFallback(ordered[target])) return draft
  const reordered = [...ordered]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  return withOrder(draft, reordered)
}

/** Whether an ending can be deleted: not the last fallback, which every scenario needs. Says why not. */
export function endingDeletion(draft: DraftPack, id: string): { ok: true } | { ok: false; reason: string } {
  const ending = draft.content.outcome_archetypes[id]
  if (!ending) return { ok: false, reason: 'It isn\'t one of your endings.' }
  const fallbacks = endingsInOrder(draft).filter(isFallback)
  if (isFallback(ending) && fallbacks.length <= 1) return { ok: false, reason: 'Every scenario needs one ending that every run can reach. Give another ending no conditions first, or keep this one.' }
  return { ok: true }
}

/** Deletes one of the draft's own endings, from every scenario too. Unchanged when `endingDeletion` says no. */
export function removeOwnEnding(draft: DraftPack, id: string): DraftPack {
  if (!endingDeletion(draft, id).ok) return draft
  let next = draft
  for (const scenario of Object.values(next.content.scenarios)) {
    next = putContent(next, 'scenarios', { ...scenario, outcome_archetype_refs: (scenario.outcome_archetype_refs ?? []).filter((ref) => ref.id !== id) })
  }
  const { [id]: _removed, ...rest } = next.content.outcome_archetypes
  next = { ...next, content: { ...next.content, outcome_archetypes: rest } }
  return withOrder(next, endingsInOrder(next))
}

/**
 * An ending's conditions, replaced. An ending left with none becomes a
 * fallback and moves last (only one fallback is useful: anything after it
 * is never reached).
 */
export function setEndingConditions(draft: DraftPack, id: string, when: EndingCondition[]): DraftPack {
  const ending = draft.content.outcome_archetypes[id]
  if (!ending) return draft
  const next = putContent(draft, 'outcome_archetypes', { ...ending, criteria: { priority: ending.criteria?.priority ?? 0, when } })
  const ordered = endingsInOrder(next)
  const updated = next.content.outcome_archetypes[id]
  return withOrder(next, isFallback(updated) ? [...ordered.filter((other) => other.id !== id), updated] : ordered)
}

/** The four things an ending can measure, in the Studio's words. */
export const ENDING_MEASURES: Record<EndingCondition['measure'], string> = {
  final_score: 'A score at the end',
  score_change: 'How much scores changed over the run',
  stakeholder_change: 'How much the council\'s satisfaction changed',
  pressure_per_turn: 'Pressure: events and aftershocks per turn',
}

/** A blank condition of each kind, for the editor to switch to. */
export function endingConditionOf(measure: EndingCondition['measure'], draft: DraftPack): EndingCondition {
  const [score] = scenarioRefs(draft, 'score_refs')
  switch (measure) {
    case 'final_score':
      return { measure, score_id: score?.id ?? '', operator: '>=', value: 70 }
    case 'score_change':
      return { measure, score_ids: score ? [score.id] : [], operator: '>=', value: 20 }
    case 'stakeholder_change':
      return { measure, operator: '>=', value: 10 }
    case 'pressure_per_turn':
      return { measure, operator: '>=', value: 1 }
  }
}

const ENDS: Record<EndingOperator, string> = { '<': 'ends below', '<=': 'ends at or below', '>': 'ends above', '>=': 'ends at or above' }
const CHANGES: Record<EndingOperator, string> = { '<': 'by less than', '<=': 'by at most', '>': 'by more than', '>=': 'by at least' }
const TIMES: Record<EndingOperator, string> = { '<': 'fewer than', '<=': 'at most', '>': 'more than', '>=': 'at least' }

function listed(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? 'no score') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * A condition in plain words, generically for any pack's names (D29):
 * "Rest ends below 25", "Rest and Uptime change by at least +20 over the
 * run, together", "the council's satisfaction changes by at least +10",
 * "events and aftershocks land at least 1 time a turn".
 */
export function describeEndingCondition(condition: EndingCondition, names: { scores: Record<string, string>; stakeholders: Record<string, string> }): string {
  const score = (id: string) => names.scores[id] ?? id
  switch (condition.measure) {
    case 'final_score':
      return `${score(condition.score_id)} ${ENDS[condition.operator]} ${condition.value}`
    case 'score_change': {
      const together = condition.score_ids.length > 1 ? ', together' : ''
      return `${listed(condition.score_ids.map(score))} ${condition.score_ids.length > 1 ? 'change' : 'changes'} ${CHANGES[condition.operator]} ${signedDelta(condition.value)} over the run${together}`
    }
    case 'stakeholder_change': {
      const who = condition.stakeholder_ids?.length
        ? `${listed(condition.stakeholder_ids.map((id) => names.stakeholders[id] ?? id))}'s satisfaction`
        : 'the council\'s satisfaction'
      return `${who} changes ${CHANGES[condition.operator]} ${signedDelta(condition.value)} over the run`
    }
    case 'pressure_per_turn':
      return `events and aftershocks land ${TIMES[condition.operator]} ${condition.value} ${condition.value === 1 ? 'time' : 'times'} a turn`
  }
}

/** When an ending is chosen, in plain words: its conditions joined, or the fallback's rule. */
export function describeEnding(ending: Pick<OutcomeArchetype, 'criteria'>, names: { scores: Record<string, string>; stakeholders: Record<string, string> }): string {
  if (isFallback(ending)) return 'when no ending tried before it fits: every run can end here'
  return `when ${ending.criteria!.when.map((condition) => describeEndingCondition(condition, names)).join(', and ')}`
}

/** The refs of the draft's own endings, in order: what a scenario lists. */
export function endingRefs(draft: DraftPack): VersionRef[] {
  return endingsInOrder(draft).map((ending) => ({ id: ending.id, version: ending.version }))
}

/** The comparisons an author picks from, in the words that fit what's measured ("at or below" a score; "more than" a change). */
export function endingOperatorChoices(measure: EndingCondition['measure']): Record<EndingOperator, string> {
  if (measure === 'final_score') return { '<': 'below', '<=': 'at or below', '>': 'above', '>=': 'at or above' }
  if (measure === 'pressure_per_turn') return { ...TIMES }
  return { '<': 'less than', '<=': 'at most', '>': 'more than', '>=': 'at least' }
}
