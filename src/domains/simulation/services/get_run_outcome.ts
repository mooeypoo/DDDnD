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

import { ScenarioBundle } from '@/domains/content/model'
import { GameState } from '../model'
import { classifyRunOutcome, OutcomeArchetypeId, RunCompletionReason } from '../rules'

export type RunOutcomeTier = 'success' | 'partial_success' | 'failure'

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

function classifyRunOutcomeTier(
  runStatus: RunOutcomeSnapshot['run_status'],
  scoreAverage: number
): RunOutcomeTier {
  if (runStatus === 'completed_failure') {
    return 'failure'
  }

  if (scoreAverage >= 60) {
    return 'success'
  }

  if (scoreAverage < 35) {
    return 'failure'
  }

  return 'partial_success'
}

export function getRunOutcome(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): RunOutcome | null {
  const classified = classifyRunOutcome(gameState, scenarioBundle)
  if (!classified) {
    return null
  }

  const tier = classifyRunOutcomeTier(classified.run_status, classified.score_average)
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
