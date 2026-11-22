/**
 * UI chrome for one score metric (icon + color only).
 *
 * Player-facing score names come from pack Score.short_name / Score.name
 * via `@/ui/play/score_labels` — not from this map.
 *
 * Packs never say how a score looks (ADR 0002). Scores the UI doesn't know
 * get a look from a fallback palette by their position among the active
 * scenario's unknown scores, so two new scores in one scenario don't look
 * alike, and a score looks the same on every screen of a run.
 */

import { shallowRef } from 'vue'

export interface MetricPresentation {
  icon: string
  colorClass: string
}

const METRIC_PRESENTATION: Record<string, MetricPresentation> = {
  maintainability: {
    icon: '🛠️',
    colorClass: 'metric-maintainability',
  },
  delivery_confidence: {
    icon: '🚚',
    colorClass: 'metric-delivery-confidence',
  },
  team_morale: {
    icon: '😌',
    colorClass: 'metric-developer-morale',
  },
  user_trust: {
    icon: '🤝',
    colorClass: 'metric-user-trust',
  },
  budget: {
    icon: '💰',
    colorClass: 'metric-budget',
  },
  domain_clarity: {
    icon: '🧭',
    colorClass: 'metric-domain-clarity',
  },
}

/**
 * Looks for scores the UI doesn't know. The color classes are global (see
 * design-system.css) so every component can use them without its own rule.
 * The icons are deliberately not used by any known score.
 */
export const FALLBACK_METRIC_PRESENTATIONS: readonly MetricPresentation[] = [
  { icon: '📈', colorClass: 'metric-fallback-1' },
  { icon: '⚖️', colorClass: 'metric-fallback-2' },
  { icon: '🔥', colorClass: 'metric-fallback-3' },
  { icon: '🛡️', colorClass: 'metric-fallback-4' },
  { icon: '⏳', colorClass: 'metric-fallback-5' },
  { icon: '🌱', colorClass: 'metric-fallback-6' },
]

/**
 * Score ids of the scenario being played, in `score_refs` order. Set by the
 * game store when a scenario bundle becomes active.
 */
const activeScoreOrder = shallowRef<readonly string[]>([])

export function setActiveScoreOrder(scoreIds: readonly string[]): void {
  activeScoreOrder.value = [...scoreIds]
}

function hashScoreId(scoreId: string): number {
  let hash = 0
  for (let i = 0; i < scoreId.length; i++) {
    hash = (Math.imul(hash, 31) + scoreId.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Resolves icon/color chrome for a score id.
 */
export function getMetricPresentation(scoreId: string): MetricPresentation {
  const known = METRIC_PRESENTATION[scoreId]
  if (known) {
    return known
  }

  const unknownInScenario = activeScoreOrder.value.filter((id) => !(id in METRIC_PRESENTATION))
  const position = unknownInScenario.indexOf(scoreId)
  const index = position >= 0 ? position : hashScoreId(scoreId)
  return FALLBACK_METRIC_PRESENTATIONS[index % FALLBACK_METRIC_PRESENTATIONS.length]
}
