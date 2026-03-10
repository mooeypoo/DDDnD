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

import {
  computeCouplingMultiplier,
  getActiveCouplingEffects
} from '@/domains/simulation'

/** Display model for a system collapse warning */
export interface CollapseWarning {
  triggerScoreId: string
  title: string
  description: string
  icon: string
  currentValue: number
  threshold: number
}

/** Display model for an adjusted score change on a card */
export interface AdjustedScoreChange {
  score_id: string
  base_delta: number
  adjusted_delta: number
  multiplier: number
  is_modified: boolean
}

/** Multiplier state for all affected scores */
export interface ScoreModifiers {
  domain_clarity_gain_multiplier: number
  maintainability_gain_multiplier: number
  delivery_confidence_gain_multiplier: number
}

// Presentation mapping — describes how to display each collapse type
const COLLAPSE_DISPLAY: Record<string, { title: string; description: string; icon: string }> = {
  delivery_confidence: {
    title: 'Delivery Collapse',
    description: 'Architecture improvements are less effective.',
    icon: '🚚'
  },
  team_morale: {
    title: 'Morale Collapse',
    description: 'Maintainability improvements reduced.',
    icon: '😌'
  },
  user_trust: {
    title: 'Trust Collapse',
    description: 'Delivery improvements reduced.',
    icon: '🤝'
  }
}

/**
 * Get active collapse warnings for the current scores.
 * Delegates threshold checks to the engine via getActiveCouplingEffects.
 */
export function getCollapseWarnings(scores: Record<string, number>): CollapseWarning[] {
  const active = getActiveCouplingEffects(scores)

  return active.map(effect => {
    const display = COLLAPSE_DISPLAY[effect.trigger_score_id] ?? {
      title: 'System Collapse',
      description: 'Some improvements are less effective.',
      icon: '⚠️'
    }

    return {
      triggerScoreId: effect.trigger_score_id,
      title: display.title,
      description: display.description,
      icon: display.icon,
      currentValue: effect.current_value,
      threshold: effect.threshold
    }
  })
}

/**
 * Get current score gain multipliers from engine state.
 * Uses computeCouplingMultiplier for each affected score.
 */
export function getScoreModifiers(scores: Record<string, number>): ScoreModifiers {
  return {
    domain_clarity_gain_multiplier: computeCouplingMultiplier('domain_clarity', scores),
    maintainability_gain_multiplier: computeCouplingMultiplier('maintainability', scores),
    delivery_confidence_gain_multiplier: computeCouplingMultiplier('delivery_confidence', scores)
  }
}

/**
 * Whether any coupling modifiers are currently active.
 */
export function hasActiveCoupling(scores: Record<string, number>): boolean {
  return getActiveCouplingEffects(scores).length > 0
}

/**
 * Get adjusted score changes for a card's effects given current scores.
 * Delegates multiplier computation to the engine.
 * Only positive deltas are modified (matching engine behavior).
 */
export function getAdjustedScoreChanges(
  scoreChanges: Array<{ score_id: string; delta: number }>,
  scores: Record<string, number>
): AdjustedScoreChange[] {
  return scoreChanges.map(change => {
    const multiplier = computeCouplingMultiplier(change.score_id, scores)
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
