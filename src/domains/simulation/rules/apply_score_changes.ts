import { CouplingRule, ScenarioBundle } from '@/domains/content/model'
import { ScoreChangeRecord } from '@/shared/contracts'
import { GameState } from '../model'

/**
 * System coupling (M3: the rules are content, see `CouplingRule`).
 *
 * While a trigger score sits below its threshold, positive gains to the
 * affected scores are multiplied down. Negative deltas are never modified.
 * The rules come from the scenario's `coupling_rule_refs`; the engine knows
 * no score ids of its own. A rule whose trigger score isn't in the run does
 * nothing.
 *
 * This prevents dominant strategies where players completely ignore key
 * system dimensions without consequence.
 */

/** The scenario's coupling rules, in `coupling_rule_refs` order. */
export function couplingRulesOf(scenarioBundle: Pick<ScenarioBundle, 'coupling_rules'>): CouplingRule[] {
  return Array.from(scenarioBundle.coupling_rules?.values() ?? [])
}

/**
 * Describes a coupling rule that is currently active given the system state.
 * Returned by getActiveCouplingEffects for UI display purposes.
 */
export interface ActiveCouplingEffect {
  rule_id: string
  /** What the player sees while the rule is active (from content). */
  name: string
  description: string
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
  scores: Record<string, number>,
  rules: readonly CouplingRule[]
): ActiveCouplingEffect[] {
  return rules
    .filter(rule => {
      const value = scores[rule.trigger_score_id]
      return value !== undefined && value < rule.threshold
    })
    .map(rule => ({
      rule_id: rule.id,
      name: rule.name,
      description: rule.description,
      trigger_score_id: rule.trigger_score_id,
      threshold: rule.threshold,
      current_value: scores[rule.trigger_score_id] ?? 0,
      affected_score_ids: rule.affected_score_ids,
      multiplier: rule.gain_multiplier
    }))
}

/**
 * Compute the effective multiplier for a score based on the current system state.
 * When multiple coupling rules affect the same score, their multipliers stack
 * multiplicatively (e.g. 0.7 * 0.75 = 0.525).
 */
export function computeCouplingMultiplier(
  scoreId: string,
  currentScores: GameState['scores'],
  rules: readonly CouplingRule[]
): number {
  let multiplier = 1.0

  for (const rule of rules) {
    if (!rule.affected_score_ids.includes(scoreId)) {
      continue
    }

    const triggerValue = currentScores[rule.trigger_score_id]
    if (triggerValue === undefined) {
      continue // score not part of this scenario
    }
    if (triggerValue < rule.threshold) {
      multiplier *= rule.gain_multiplier
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
  const couplingRules = couplingRulesOf(scenarioBundle)

  for (const change of scoreChanges) {
    const score = nextScores[change.score_id] ?? 0

    let effectiveDelta = change.delta

    // Apply coupling modifiers only to positive gains
    if (effectiveDelta > 0) {
      const multiplier = computeCouplingMultiplier(change.score_id, nextScores, couplingRules)
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
