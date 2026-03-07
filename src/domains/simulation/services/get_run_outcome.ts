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

export interface RunOutcome {
  has_outcome: boolean
  completion_reason: 'max_turns_reached'
  scenario_id: string
  scenario_version: number
  turns_completed: number
  max_turns: number
  placeholder_tier_id: string | null
  placeholder_archetype_id: string | null
}

export function getRunOutcome(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): RunOutcome | null {
  const hasReachedMaximumTurns =
    gameState.run_analytics.turns_completed >= gameState.progress.max_turns ||
    gameState.progress.run_status === 'completed_max_turns'

  if (!hasReachedMaximumTurns) {
    return null
  }

  return {
    has_outcome: true,
    completion_reason: 'max_turns_reached',
    scenario_id: scenarioBundle.scenario.id,
    scenario_version: scenarioBundle.scenario.version,
    turns_completed: gameState.run_analytics.turns_completed,
    max_turns: gameState.progress.max_turns,
    placeholder_tier_id: null,
    placeholder_archetype_id: null
  }
}
