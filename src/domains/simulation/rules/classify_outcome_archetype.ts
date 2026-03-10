import { GameState, RunAnalytics } from '../model'

export type OutcomeArchetypeId =
  | 'boundary_builder'
  | 'stakeholder_whisperer'
  | 'runaway_refactorer'
  | 'firefighter'
  | 'system_stabilizer'

export interface ClassifyOutcomeArchetypeInput {
  game_state?: Pick<GameState, 'scores' | 'run_analytics'>
  run_analytics?: RunAnalytics
}

interface ArchetypeMetrics {
  architecture_delta: number
  delivery_and_budget_delta: number
  stakeholder_delta_total: number
  stability_delta: number
  volatility_ratio: number
  events_pressure: number
  final_delivery_confidence: number
  final_budget: number
}

const ARCHITECTURE_SCORE_IDS = ['domain_clarity', 'maintainability'] as const
const DELIVERY_AND_BUDGET_SCORE_IDS = ['delivery_confidence', 'budget'] as const
const STABILITY_SCORE_IDS = ['user_trust', 'team_morale'] as const

const DEFAULT_STARTING_SCORE = 50

function sumDeltas(deltas: Record<string, number>, scoreIds: readonly string[]): number {
  return scoreIds.reduce((sum, scoreId) => sum + (deltas[scoreId] ?? 0), 0)
}

function computeMetrics(
  analytics: RunAnalytics,
  scores?: Record<string, number>
): ArchetypeMetrics {
  const architectureDelta = sumDeltas(analytics.cumulative_score_deltas, ARCHITECTURE_SCORE_IDS)
  const deliveryAndBudgetDelta = sumDeltas(
    analytics.cumulative_score_deltas,
    DELIVERY_AND_BUDGET_SCORE_IDS
  )
  const stabilityDelta = sumDeltas(analytics.cumulative_score_deltas, STABILITY_SCORE_IDS)

  const stakeholderDeltaTotal = Object.values(analytics.cumulative_stakeholder_deltas).reduce(
    (sum, delta) => sum + delta,
    0
  )

  const eventsPressure = analytics.total_events_triggered + analytics.total_aftershocks_resolved
  const turnCount = Math.max(analytics.turns_completed, 1)
  const volatilityRatio = eventsPressure / turnCount

  // Use final absolute scores when available (production path).
  // When only run_analytics is provided (test path), estimate from deltas
  // assuming a mid-range starting value.
  const finalDeliveryConfidence = scores?.delivery_confidence ??
    (DEFAULT_STARTING_SCORE + (analytics.cumulative_score_deltas.delivery_confidence ?? 0))
  const finalBudget = scores?.budget ??
    (DEFAULT_STARTING_SCORE + (analytics.cumulative_score_deltas.budget ?? 0))

  return {
    architecture_delta: architectureDelta,
    delivery_and_budget_delta: deliveryAndBudgetDelta,
    stakeholder_delta_total: stakeholderDeltaTotal,
    stability_delta: stabilityDelta,
    volatility_ratio: volatilityRatio,
    events_pressure: eventsPressure,
    final_delivery_confidence: finalDeliveryConfidence,
    final_budget: finalBudget
  }
}

/**
 * Firefighter: chaotic run where instability overwhelmed strategy.
 * Requires BOTH high event volatility AND meaningful stability damage
 * (user_trust + team_morale declined significantly). This ensures only
 * genuinely crisis-driven runs qualify — not just normal event pressure.
 */
function isFirefighter(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.volatility_ratio >= 1.5 &&
    metrics.stability_delta < -10
  )
}

/**
 * Boundary Builder: strong architecture improvement while keeping delivery viable.
 * Requires architecture to have meaningfully improved AND delivery confidence
 * to remain at a functional level (>= 30).
 */
function isBoundaryBuilder(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.architecture_delta >= 20 &&
    metrics.final_delivery_confidence >= 30
  )
}

/**
 * Stakeholder Whisperer: focused on people and organizational alignment.
 * Requires meaningful stakeholder improvement, positive stability trajectory,
 * and delivery not in total collapse.
 */
function isStakeholderWhisperer(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.stakeholder_delta_total >= 10 &&
    metrics.stability_delta >= 0 &&
    metrics.final_delivery_confidence >= 25
  )
}

/**
 * Runaway Refactorer: strong architecture work but delivery confidence collapsed.
 * Only fires when architecture genuinely improved but delivery fell to critical levels.
 * This ensures the archetype represents a real strategic imbalance, not just
 * normal delivery drift.
 */
function isRunawayRefactorer(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.architecture_delta >= 20 &&
    metrics.final_delivery_confidence < 30
  )
}

// System Stabilizer is the default fallback — no predicate needed.
// Represents balanced or moderate play without a dominant strategic signal.

export function classifyOutcomeArchetype(input: ClassifyOutcomeArchetypeInput): OutcomeArchetypeId {
  const analytics = input.run_analytics ?? input.game_state?.run_analytics
  if (!analytics) {
    return 'system_stabilizer'
  }

  const scores = input.game_state?.scores
  const metrics = computeMetrics(analytics, scores)

  // Priority order:
  // 1. Firefighter — extreme chaos overshadows all other strategy signals
  // 2. Boundary Builder — architecture focus WITH delivery discipline
  // 3. Stakeholder Whisperer — people-focused strategy
  // 4. Runaway Refactorer — architecture focus WITHOUT delivery discipline
  // 5. System Stabilizer — balanced/moderate fallback

  if (isFirefighter(metrics)) {
    return 'firefighter'
  }

  if (isBoundaryBuilder(metrics)) {
    return 'boundary_builder'
  }

  if (isStakeholderWhisperer(metrics)) {
    return 'stakeholder_whisperer'
  }

  if (isRunawayRefactorer(metrics)) {
    return 'runaway_refactorer'
  }

  return 'system_stabilizer'
}
