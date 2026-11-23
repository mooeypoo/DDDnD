/**
 * Get Run Outcome
 * 
 * Determines the final outcome of a completed run.
 * 
 * Analyzes:
 * - Final score values
 * - Stakeholder satisfaction
 * - Turn history and player choices
 * - Run analytics
 * 
 * Returns:
 * - Outcome tier (success level)
 * - Outcome archetype (play style classification)
 * - Summary statistics
 * - Shareable result data
 * 
 * This is called when a run ends (victory, failure, or max turns reached).
 */

import type { OutcomeResult, ScenarioBundle } from '@/domains/content/model'
import type { OutcomeArchetypeId } from '@/shared/contracts'
import { GameState } from '../model'
import { classifyRunOutcome, RunCompletionReason } from '../rules'

export type RunOutcomeTier = OutcomeResult

/**
 * Stable outcome snapshot suitable for persistence and reporting.
 */
export interface RunOutcomeSnapshot {
  tier: RunOutcomeTier
  archetype: OutcomeArchetypeId
  run_status: 'completed_failure' | 'completed_max_turns' | 'completed_success'
  completion_reason: RunCompletionReason
  turns_completed: number
  max_turns: number
  score_average: number
  matched_failure_conditions: string[]
}

/**
 * Enriched run outcome derived from current/final game state.
 */
export interface RunOutcome {
  tier: RunOutcomeTier
  archetype: OutcomeArchetypeId
  outcome_snapshot: RunOutcomeSnapshot
  has_outcome: boolean
  completion_reason: RunCompletionReason
  scenario_id: string
  scenario_version: number
  run_status: 'completed_failure' | 'completed_max_turns' | 'completed_success'
  turns_completed: number
  max_turns: number
  matched_failure_conditions: string[]
  selected_tier_id: string | null
  selected_archetype_id: OutcomeArchetypeId
  score_average: number
}

/**
 * The coarse result: a failure condition always fails the run; otherwise the
 * selected tier says what it counts as (journal M3.4). With no tier (the
 * tutorial today), the fixed cutoffs from before tiers were content apply.
 */
function classifyRunOutcomeTier(
  runStatus: RunOutcomeSnapshot['run_status'],
  scoreAverage: number,
  tierResult: OutcomeResult | null
): RunOutcomeTier {
  if (runStatus === 'completed_failure') {
    return 'failure'
  }

  if (tierResult) {
    return tierResult
  }

  if (scoreAverage >= 60) {
    return 'success'
  }

  if (scoreAverage < 35) {
    return 'failure'
  }

  return 'partial_success'
}

/**
 * Returns outcome when run is terminal; otherwise null.
 */
export function getRunOutcome(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): RunOutcome | null {
  const classified = classifyRunOutcome(gameState, scenarioBundle)
  if (!classified) {
    return null
  }

  const tier = classifyRunOutcomeTier(classified.run_status, classified.score_average, classified.selected_tier_result)
  const archetype = classified.selected_archetype_id
  const outcomeSnapshot: RunOutcomeSnapshot = {
    tier,
    archetype,
    run_status: classified.run_status,
    completion_reason: classified.completion_reason,
    turns_completed: classified.turns_completed,
    max_turns: classified.max_turns,
    score_average: classified.score_average,
    matched_failure_conditions: [...classified.matched_failure_conditions]
  }

  return {
    tier,
    archetype,
    outcome_snapshot: outcomeSnapshot,
    has_outcome: classified.has_outcome,
    completion_reason: classified.completion_reason,
    scenario_id: classified.scenario_id,
    scenario_version: classified.scenario_version,
    run_status: classified.run_status,
    turns_completed: classified.turns_completed,
    max_turns: classified.max_turns,
    matched_failure_conditions: classified.matched_failure_conditions,
    selected_tier_id: classified.selected_tier_id,
    selected_archetype_id: classified.selected_archetype_id,
    score_average: classified.score_average
  }
}
