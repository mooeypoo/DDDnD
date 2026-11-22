import { afterEach, describe, expect, it } from 'vitest'

import {
  FALLBACK_METRIC_PRESENTATIONS,
  getMetricPresentation,
  setActiveScoreOrder,
} from '@/ui/composables/metric_presentation'

describe('getMetricPresentation', () => {
  afterEach(() => setActiveScoreOrder([]))

  it('keeps the hand-picked look of known scores', () => {
    expect(getMetricPresentation('domain_clarity')).toEqual({ icon: '🧭', colorClass: 'metric-domain-clarity' })
  })

  it("gives the scenario's unknown scores different looks, by position (ADR 0002)", () => {
    setActiveScoreOrder(['domain_clarity', 'uptime', 'budget', 'pager_fatigue', 'error_budget'])

    expect(getMetricPresentation('uptime')).toBe(FALLBACK_METRIC_PRESENTATIONS[0])
    expect(getMetricPresentation('pager_fatigue')).toBe(FALLBACK_METRIC_PRESENTATIONS[1])
    expect(getMetricPresentation('error_budget')).toBe(FALLBACK_METRIC_PRESENTATIONS[2])
  })

  it('cycles when a scenario has more unknown scores than the palette', () => {
    const ids = Array.from({ length: FALLBACK_METRIC_PRESENTATIONS.length + 1 }, (_, i) => `score_${i}`)
    setActiveScoreOrder(ids)
    expect(getMetricPresentation(ids[ids.length - 1])).toBe(FALLBACK_METRIC_PRESENTATIONS[0])
  })

  it('still gives a stable look to an unknown score outside the active scenario', () => {
    const look = getMetricPresentation('mystery')
    expect(FALLBACK_METRIC_PRESENTATIONS).toContain(look)
    expect(getMetricPresentation('mystery')).toBe(look)
  })

  it("doesn't reuse a known score's icon", () => {
    const known = ['maintainability', 'delivery_confidence', 'team_morale', 'user_trust', 'budget', 'domain_clarity']
      .map((id) => getMetricPresentation(id).icon)
    for (const fallback of FALLBACK_METRIC_PRESENTATIONS) {
      expect(known).not.toContain(fallback.icon)
    }
  })
})
