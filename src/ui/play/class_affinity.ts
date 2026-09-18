import { scoreShortName } from '@/ui/play/score_labels'

/**
 * Player-facing line for a playerClass score_affinity.
 *
 * The +1 is the engine bonus on `play_turn`, not a Vue rule.
 * Consult does not apply it. Missing affinity means the class is identity only.
 */
export function classAffinityCopy(
  affinityScoreId: string | undefined,
  shortLabel?: string | null,
): string | null {
  if (!affinityScoreId) {
    return null
  }

  const label = shortLabel ?? scoreShortName(affinityScoreId)
  return `+1 ${label} when you play a card`
}
