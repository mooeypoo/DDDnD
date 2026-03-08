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
}

const ARCHITECTURE_SCORE_IDS = ['domain_clarity', 'maintainability'] as const
const DELIVERY_AND_BUDGET_SCORE_IDS = ['delivery_confidence', 'budget'] as const
const STABILITY_SCORE_IDS = ['user_trust', 'developer_morale'] as const

function sumDeltas(deltas: Record<string, number>, scoreIds: readonly string[]): number {
  return scoreIds.reduce((sum, scoreId) => sum + (deltas[scoreId] ?? 0), 0)
}

function computeMetrics(analytics: RunAnalytics): ArchetypeMetrics {
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

  return {
    architecture_delta: architectureDelta,
    delivery_and_budget_delta: deliveryAndBudgetDelta,
    stakeholder_delta_total: stakeholderDeltaTotal,
    stability_delta: stabilityDelta,
    volatility_ratio: volatilityRatio,
    events_pressure: eventsPressure
  }
}

function isRunawayRefactorer(metrics: ArchetypeMetrics): boolean {
  return metrics.architecture_delta >= 8 && metrics.delivery_and_budget_delta <= -4
}

function isFirefighter(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.volatility_ratio >= 1.25 &&
    (metrics.events_pressure >= 3 || metrics.stability_delta < 0)
  )
}

function isBoundaryBuilder(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.architecture_delta >= 10 &&
    metrics.architecture_delta >= metrics.stakeholder_delta_total + 4 &&
    metrics.delivery_and_budget_delta >= -2
  )
}

function isStakeholderWhisperer(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.stakeholder_delta_total >= 8 &&
    metrics.stakeholder_delta_total >= metrics.architecture_delta + 3
  )
}

function isSystemStabilizer(metrics: ArchetypeMetrics): boolean {
  return (
    metrics.architecture_delta >= 4 &&
    metrics.delivery_and_budget_delta >= 2 &&
    metrics.stakeholder_delta_total >= 2 &&
    metrics.volatility_ratio < 1.25
  )
}

export function classifyOutcomeArchetype(input: ClassifyOutcomeArchetypeInput): OutcomeArchetypeId {
  const analytics = input.run_analytics ?? input.game_state?.run_analytics
  if (!analytics) {
    return 'system_stabilizer'
  }

  const metrics = computeMetrics(analytics)

  if (isRunawayRefactorer(metrics)) {
    return 'runaway_refactorer'
  }

  if (isFirefighter(metrics)) {
    return 'firefighter'
  }

  if (isBoundaryBuilder(metrics)) {
    return 'boundary_builder'
  }

  if (isStakeholderWhisperer(metrics)) {
    return 'stakeholder_whisperer'
  }

  if (isSystemStabilizer(metrics)) {
    return 'system_stabilizer'
  }

  return 'system_stabilizer'
}
