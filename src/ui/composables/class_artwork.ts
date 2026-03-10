/**
 * Composable for resolving player class artwork.
 *
 * Maps class IDs to their pixel-character portrait SVGs.
 * Returns undefined when class ID is unknown — components
 * must render gracefully without artwork.
 */

import boundaryMageSvg from '@/assets/artwork/classes/boundary_mage.svg'
import stakeholderBardSvg from '@/assets/artwork/classes/stakeholder_bard.svg'
import reliabilityClericSvg from '@/assets/artwork/classes/reliability_cleric.svg'
import legacyRangerSvg from '@/assets/artwork/classes/legacy_ranger.svg'
import deliveryRogueSvg from '@/assets/artwork/classes/delivery_rogue.svg'

const CLASS_PORTRAIT_MAP: Record<string, string> = {
  boundary_mage: boundaryMageSvg,
  stakeholder_bard: stakeholderBardSvg,
  reliability_cleric: reliabilityClericSvg,
  legacy_ranger: legacyRangerSvg,
  delivery_rogue: deliveryRogueSvg,
}

/**
 * Returns the portrait SVG URL for a given class ID.
 * Returns undefined if the class has no artwork.
 */
export function getClassPortraitUrl(classId: string | undefined): string | undefined {
  if (!classId) return undefined
  return CLASS_PORTRAIT_MAP[classId]
}

/**
 * Returns the accent color associated with a class for UI theming.
 */
export function getClassAccentColor(classId: string | undefined): string {
  const accents: Record<string, string> = {
    boundary_mage: '#9f7aea',
    stakeholder_bard: '#fbbf24',
    reliability_cleric: '#60a5fa',
    legacy_ranger: '#34d399',
    delivery_rogue: '#f97316',
  }
  return classId ? accents[classId] ?? '#a989fa' : '#a989fa'
}
