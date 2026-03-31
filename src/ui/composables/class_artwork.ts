/**
 * Composable for resolving player class artwork.
 *
 * Maps class IDs to their pixel-character portrait SVGs.
 * Returns undefined when class ID is unknown — components
 * must render gracefully without artwork.
 */

import { PLAYER_CLASS_ASSETS } from '@/ui/config/presentation_asset_registry'

const CLASS_PORTRAIT_MAP: Record<string, string> = {
  ...PLAYER_CLASS_ASSETS,
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
