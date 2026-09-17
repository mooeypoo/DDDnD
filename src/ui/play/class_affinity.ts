import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { shortMetricLabel } from '@/ui/play/weather_band'

/**
 * Player-facing line for a playerClass score_affinity.
 *
 * The +1 is the engine bonus on `play_turn`, not a Vue rule.
 * Consult does not apply it. Missing affinity means the class is identity only.
 */
export function classAffinityCopy(affinityScoreId: string | undefined): string | null {
  if (!affinityScoreId) {
    return null
  }

  const label = shortMetricLabel(affinityScoreId, getMetricPresentation(affinityScoreId).label)
  return `+1 ${label} when you play a card`
}
