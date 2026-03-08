export type MetricSnapshot = Record<string, number>

export const metricStates: Record<'healthy' | 'unstable' | 'nearCollapse', MetricSnapshot> = {
  healthy: {
    domain_clarity: 78,
    maintainability: 74,
    delivery_confidence: 69,
    developer_morale: 72,
    user_trust: 76,
    budget: 61
  },
  unstable: {
    domain_clarity: 49,
    maintainability: 41,
    delivery_confidence: 38,
    developer_morale: 44,
    user_trust: 35,
    budget: 52
  },
  nearCollapse: {
    domain_clarity: 19,
    maintainability: 15,
    delivery_confidence: 21,
    developer_morale: 12,
    user_trust: 9,
    budget: 28
  }
}
