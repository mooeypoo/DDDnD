/**
 * UI chrome for one score metric (icon + color only).
 *
 * Player-facing score names come from pack Score.short_name / Score.name
 * via `@/ui/play/score_labels` — not from this map.
 */

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
 * Resolves icon/color chrome for a score id.
 */
export function getMetricPresentation(scoreId: string): MetricPresentation {
  return METRIC_PRESENTATION[scoreId] ?? {
    icon: '📈',
    colorClass: 'metric-generic',
  }
}
