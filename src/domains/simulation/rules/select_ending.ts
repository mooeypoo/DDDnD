/**
 * Ending selection from content (M3 slice 4, journal M3.5).
 *
 * Each ending declares when it is chosen: a priority and a list of
 * conditions on the finished run. The engine knows how to measure a run and
 * compare; which endings exist and what they mean belongs to the pack.
 */

import type { EndingCondition, OutcomeArchetype, ScenarioBundle } from '@/domains/content/model'
import type { GameState } from '../model'

/** What ending conditions can read: the finished run's scores and analytics. */
export type EndingRunState = Pick<GameState, 'scores' | 'run_analytics'>

/** Endings in the order they are tried: highest priority first, then by id. */
export function endingsByPriority(bundle: ScenarioBundle): OutcomeArchetype[] {
  return Array.from(bundle.outcome_archetypes.values())
    .filter((ending) => ending.criteria !== undefined)
    .sort((a, b) => (b.criteria!.priority - a.criteria!.priority) || a.id.localeCompare(b.id))
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/**
 * The value a condition compares, or undefined when the run doesn't have it
 * (a final score the scenario doesn't track: the condition doesn't hold).
 */
export function measureEndingCondition(condition: EndingCondition, run: EndingRunState): number | undefined {
  const analytics = run.run_analytics
  switch (condition.measure) {
    case 'score_change':
      return sum(condition.score_ids.map((id) => analytics.cumulative_score_deltas[id] ?? 0))
    case 'final_score':
      return run.scores[condition.score_id]
    case 'stakeholder_change': {
      const deltas = analytics.cumulative_stakeholder_deltas
      const ids = condition.stakeholder_ids ?? Object.keys(deltas)
      return sum(ids.map((id) => deltas[id] ?? 0))
    }
    case 'pressure_per_turn':
      return (analytics.total_events_triggered + analytics.total_aftershocks_resolved) / Math.max(analytics.turns_completed, 1)
  }
}

export function endingConditionHolds(condition: EndingCondition, run: EndingRunState): boolean {
  const measured = measureEndingCondition(condition, run)
  if (measured === undefined) return false
  switch (condition.operator) {
    case '<':
      return measured < condition.value
    case '<=':
      return measured <= condition.value
    case '>':
      return measured > condition.value
    case '>=':
      return measured >= condition.value
  }
}

/**
 * The first ending, by priority, whose conditions all hold. Null when the
 * scenario has no endings with criteria, or none matched (the validator
 * requires a fallback ending, so a valid scenario always matches one).
 */
export function selectEnding(run: EndingRunState, bundle: ScenarioBundle): OutcomeArchetype | null {
  return endingsByPriority(bundle).find((ending) => ending.criteria!.when.every((condition) => endingConditionHolds(condition, run))) ?? null
}
