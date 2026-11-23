/**
 * System Coupling Presentation
 *
 * Thin presentation layer that delegates to engine query functions
 * for coupling state. Does NOT duplicate game logic.
 *
 * Uses:
 * - computeCouplingMultiplier() from simulation engine for per-score multipliers
 * - getActiveCouplingEffects() from simulation engine for active collapse detection
 */

import { shallowRef } from 'vue'

import type { CouplingRule } from '@/domains/content/model'
import {
  computeCouplingMultiplier,
  getActiveCouplingEffects
} from '@/domains/simulation'

/** Display model for a system collapse warning */
export interface CollapseWarning {
  ruleId: string
  triggerScoreId: string
  title: string
  description: string
  icon: string
  currentValue: number
  threshold: number
  affectedScoreIds: string[]
}

/** Display model for an adjusted score change on a card */
export interface AdjustedScoreChange {
  score_id: string
  base_delta: number
  adjusted_delta: number
  multiplier: number
  is_modified: boolean
}

/**
 * The active scenario's coupling rules (M3: they are content). Set by the
 * game store when a scenario bundle becomes active, like the score order in
 * metric_presentation.ts, so every score component sees the same rules
 * without threading them through props.
 */
const activeCouplingRules = shallowRef<readonly CouplingRule[]>([])

export function setActiveCouplingRules(rules: readonly CouplingRule[]): void {
  activeCouplingRules.value = [...rules]
}

/** The active scenario's coupling rules (empty outside a run), for display. */
export function activeCouplingRuleList(): readonly CouplingRule[] {
  return activeCouplingRules.value
}

/**
 * Icons for the base game's collapses. Presentation only (ADR 0002): a pack's
 * rules carry their own title and description, and get the generic icon.
 */
const COLLAPSE_ICON_BY_TRIGGER: Record<string, string> = {
  delivery_confidence: '🚚',
  team_morale: '😌',
  user_trust: '🤝',
  team_capacity: '🫠',
  system_health: '🏚️',
}

/**
 * Get active collapse warnings for the current scores. Title and description
 * come from the rule's content.
 */
export function getCollapseWarnings(
  scores: Record<string, number>,
  rules: readonly CouplingRule[] = activeCouplingRules.value
): CollapseWarning[] {
  return getActiveCouplingEffects(scores, rules).map(effect => ({
    ruleId: effect.rule_id,
    triggerScoreId: effect.trigger_score_id,
    title: effect.name,
    description: effect.description,
    icon: COLLAPSE_ICON_BY_TRIGGER[effect.trigger_score_id] ?? '⚠️',
    currentValue: effect.current_value,
    threshold: effect.threshold,
    affectedScoreIds: [...effect.affected_score_ids],
  }))
}

/**
 * Current gain multiplier for every score a coupling rule can affect.
 */
export function getGainMultipliers(
  scores: Record<string, number>,
  rules: readonly CouplingRule[] = activeCouplingRules.value
): Record<string, number> {
  const affected = new Set(rules.flatMap(rule => rule.affected_score_ids))
  return Object.fromEntries([...affected].map(scoreId => [scoreId, computeCouplingMultiplier(scoreId, scores, rules)]))
}

/**
 * Whether any coupling modifiers are currently active.
 */
export function hasActiveCoupling(
  scores: Record<string, number>,
  rules: readonly CouplingRule[] = activeCouplingRules.value
): boolean {
  return getActiveCouplingEffects(scores, rules).length > 0
}

/**
 * Get adjusted score changes for a card's effects given current scores.
 * Delegates multiplier computation to the engine.
 * Only positive deltas are modified (matching engine behavior).
 */
export function getAdjustedScoreChanges(
  scoreChanges: Array<{ score_id: string; delta: number }>,
  scores: Record<string, number>,
  rules: readonly CouplingRule[] = activeCouplingRules.value
): AdjustedScoreChange[] {
  return scoreChanges.map(change => {
    const multiplier = computeCouplingMultiplier(change.score_id, scores, rules)
    const adjustedDelta = change.delta > 0
      ? Math.round(change.delta * multiplier)
      : change.delta

    return {
      score_id: change.score_id,
      base_delta: change.delta,
      adjusted_delta: adjustedDelta,
      multiplier,
      is_modified: multiplier < 1.0 && change.delta > 0
    }
  })
}
