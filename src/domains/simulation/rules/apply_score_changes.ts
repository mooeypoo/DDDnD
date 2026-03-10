import { ScenarioBundle } from '@/domains/content/model'
import { ScoreChangeRecord } from '@/shared/contracts'
import { GameState } from '../model'

/**
 * System coupling rules model interdependencies between system dimensions.
 *
 * When certain scores collapse below a threshold, positive gains to related
 * scores are reduced by a multiplier. Negative deltas are never modified.
 *
 * This prevents dominant strategies where players completely ignore
 * key system dimensions without consequence.
 */

interface CouplingRule {
  /** Score that, when collapsed, triggers the modifier */
  trigger_score_id: string
  /** Threshold below which the rule activates */
  threshold: number
  /** Scores whose positive gains are reduced */
  affected_score_ids: string[]
  /** Multiplier applied to positive deltas (e.g. 0.7 = 30% reduction) */
  multiplier: number
}

const SYSTEM_COUPLING_RULES: readonly CouplingRule[] = [
  // Main campaign coupling rules
  {
    trigger_score_id: 'delivery_confidence',
    threshold: 25,
    affected_score_ids: ['domain_clarity', 'maintainability'],
    multiplier: 0.7
  },
  {
    trigger_score_id: 'team_morale',
    threshold: 25,
    affected_score_ids: ['maintainability'],
    multiplier: 0.75
  },
  {
    trigger_score_id: 'user_trust',
    threshold: 25,
    affected_score_ids: ['delivery_confidence'],
    multiplier: 0.7
  },
  // Tutorial coupling rules (tutorial score IDs don't overlap with campaign)
  {
    trigger_score_id: 'team_capacity',
    threshold: 25,
    affected_score_ids: ['code_clarity', 'system_health'],
    multiplier: 0.7
  },
  {
    trigger_score_id: 'system_health',
    threshold: 25,
    affected_score_ids: ['team_capacity'],
    multiplier: 0.75
  }
]

/**
 * Describes a coupling rule that is currently active given the system state.
 * Returned by getActiveCouplingEffects for UI display purposes.
 */
export interface ActiveCouplingEffect {
  trigger_score_id: string
  threshold: number
  current_value: number
  affected_score_ids: readonly string[]
  multiplier: number
}

/**
 * Return the subset of coupling rules that are currently triggered
 * given the provided scores. This is a read-only query intended for
 * UI display — it does not modify any state.
 */
export function getActiveCouplingEffects(
  scores: Record<string, number>
): ActiveCouplingEffect[] {
  return SYSTEM_COUPLING_RULES
    .filter(rule => {
      const value = scores[rule.trigger_score_id]
      return value !== undefined && value < rule.threshold
    })
    .map(rule => ({
      trigger_score_id: rule.trigger_score_id,
      threshold: rule.threshold,
      current_value: scores[rule.trigger_score_id] ?? 0,
      affected_score_ids: rule.affected_score_ids,
      multiplier: rule.multiplier
    }))
}

/**
 * Compute the effective multiplier for a score based on the current system state.
 * When multiple coupling rules affect the same score, their multipliers stack
 * multiplicatively (e.g. 0.7 * 0.75 = 0.525).
 */
export function computeCouplingMultiplier(
  scoreId: string,
  currentScores: GameState['scores']
): number {
  let multiplier = 1.0

  for (const rule of SYSTEM_COUPLING_RULES) {
    if (!rule.affected_score_ids.includes(scoreId)) {
      continue
    }

    const triggerValue = currentScores[rule.trigger_score_id]
    if (triggerValue === undefined) {
      continue // score not part of this scenario
    }
    if (triggerValue < rule.threshold) {
      multiplier *= rule.multiplier
    }
  }

  return multiplier
}

export function applyScoreChanges(
  scores: GameState['scores'],
  scoreChanges: ScoreChangeRecord[],
  scenarioBundle: ScenarioBundle
): GameState['scores'] {
  const nextScores: GameState['scores'] = { ...scores }

  for (const change of scoreChanges) {
    const score = nextScores[change.score_id] ?? 0

    let effectiveDelta = change.delta

    // Apply coupling modifiers only to positive gains
    if (effectiveDelta > 0) {
      const multiplier = computeCouplingMultiplier(change.score_id, nextScores)
      effectiveDelta = Math.round(effectiveDelta * multiplier)
    }

    const scoreDefinition = Array.from(scenarioBundle.scores.values()).find(
      (candidate) => candidate.id === change.score_id
    )

    let nextValue = score + effectiveDelta

    if (typeof scoreDefinition?.min_value === 'number') {
      nextValue = Math.max(scoreDefinition.min_value, nextValue)
    }

    if (typeof scoreDefinition?.max_value === 'number') {
      nextValue = Math.min(scoreDefinition.max_value, nextValue)
    }

    nextScores[change.score_id] = nextValue
  }

  return nextScores
}
