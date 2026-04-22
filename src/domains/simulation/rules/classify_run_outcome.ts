import { ScenarioBundle } from '@/domains/content/model'
import type { OutcomeArchetypeId } from '@/shared/contracts'
import { GameState, RunAnalytics } from '../model'
import { evaluateNumericCondition } from './condition_evaluator'
import { classifyOutcomeArchetype } from './classify_outcome_archetype'

/**
 * Terminal reason for run completion classification.
 */
export type RunCompletionReason = 'failure_condition_met' | 'max_turns_reached'

/**
 * Stable outcome snapshot used by persistence/reporting surfaces.
 */
export interface RunOutcomeClassification {
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
  analytics_snapshot: RunAnalytics
}

/**
 * Computes scenario-score average for coarse tier classification.
 */
function computeScoreAverage(gameState: GameState, scenarioBundle: ScenarioBundle): number {
  const scoreIds = scenarioBundle.scenario.score_refs.map((ref) => ref.id)
  if (scoreIds.length === 0) {
    return 0
  }

  const total = scoreIds.reduce((sum, scoreId) => sum + (gameState.scores[scoreId] ?? 0), 0)
  return total / scoreIds.length
}

/**
 * Selects a tier id from score average when matching tier ids exist in content.
 */
function classifyTierId(scoreAverage: number, scenarioBundle: ScenarioBundle): string | null {
  const existingTierIds = new Set(Array.from(scenarioBundle.outcome_tiers.values()).map((tier) => tier.id))

  if (scoreAverage >= 75 && existingTierIds.has('triumph')) {
    return 'triumph'
  }

  if (scoreAverage >= 60 && existingTierIds.has('success')) {
    return 'success'
  }

  if (scoreAverage >= 45 && existingTierIds.has('survival')) {
    return 'survival'
  }

  if (scoreAverage >= 30 && existingTierIds.has('struggle')) {
    return 'struggle'
  }

  if (existingTierIds.has('collapse')) {
    return 'collapse'
  }

  return null
}

/**
 * Selects legacy archetype classification from current game state.
 */
function selectArchetypeId(gameState: GameState, _scenarioBundle: ScenarioBundle): OutcomeArchetypeId {
  return classifyOutcomeArchetype({ game_state: gameState })
}

/**
 * Classifies run outcome when terminal conditions are met.
 *
 * Returns null while the run is still in-progress.
 */
export function classifyRunOutcome(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): RunOutcomeClassification | null {
  const conditionState = {
    scores: gameState.scores,
    stakeholders: gameState.stakeholders
  }

  const matchedFailureConditions = (scenarioBundle.scenario.failure_conditions ?? [])
    .map((condition) => {
      const matched = evaluateNumericCondition(condition, conditionState)
      if (!matched) {
        return null
      }

      return `${condition.target_type}:${condition.target_id}:${condition.operator}:${condition.value}`
    })
    .filter((value): value is string => value !== null)

  const hasFailure = matchedFailureConditions.length > 0
  const reachedMaxTurns =
    gameState.run_analytics.turns_completed >= gameState.progress.max_turns ||
    gameState.progress.run_status === 'completed_max_turns'

  if (!hasFailure && !reachedMaxTurns) {
    return null
  }

  const scoreAverage = computeScoreAverage(gameState, scenarioBundle)
  const completionReason: RunCompletionReason = hasFailure ? 'failure_condition_met' : 'max_turns_reached'
  const runStatus = hasFailure ? 'completed_failure' : 'completed_max_turns'

  return {
    has_outcome: true,
    completion_reason: completionReason,
    scenario_id: scenarioBundle.scenario.id,
    scenario_version: scenarioBundle.scenario.version,
    run_status: runStatus,
    turns_completed: gameState.run_analytics.turns_completed,
    max_turns: gameState.progress.max_turns,
    matched_failure_conditions: matchedFailureConditions,
    selected_tier_id: classifyTierId(scoreAverage, scenarioBundle),
    selected_archetype_id: selectArchetypeId(gameState, scenarioBundle),
    score_average: scoreAverage,
    analytics_snapshot: {
      ...gameState.run_analytics,
      cumulative_score_deltas: { ...gameState.run_analytics.cumulative_score_deltas },
      cumulative_stakeholder_deltas: { ...gameState.run_analytics.cumulative_stakeholder_deltas },
      card_usage: { ...gameState.run_analytics.card_usage },
      style_tags_used: { ...gameState.run_analytics.style_tags_used }
    }
  }
}
