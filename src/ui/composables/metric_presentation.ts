/**
 * UI display metadata for one score metric.
 */
export interface MetricPresentation {
  icon: string
  colorClass: string
  label: string
}

const METRIC_PRESENTATION: Record<string, MetricPresentation> = {
  maintainability: {
    icon: '🛠️',
    colorClass: 'metric-maintainability',
    label: 'Maintainability'
  },
  delivery_confidence: {
    icon: '🚚',
    colorClass: 'metric-delivery-confidence',
    label: 'Delivery Confidence'
  },
  team_morale: {
    icon: '😌',
    colorClass: 'metric-developer-morale',
    label: 'Team Morale'
  },
  user_trust: {
    icon: '🤝',
    colorClass: 'metric-user-trust',
    label: 'User Trust'
  },
  budget: {
    icon: '💰',
    colorClass: 'metric-budget',
    label: 'Budget'
  },
  domain_clarity: {
    icon: '🧭',
    colorClass: 'metric-domain-clarity',
    label: 'Domain Clarity'
  }
}

/**
 * Resolves icon/color/label display metadata for a score id.
 */
export function getMetricPresentation(scoreId: string): MetricPresentation {
  return METRIC_PRESENTATION[scoreId] ?? {
    icon: '📈',
    colorClass: 'metric-generic',
    label: scoreId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}
