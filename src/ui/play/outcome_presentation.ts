/**
 * How a run's tier and ending are named on screen (M3 slice 1).
 *
 * The names and descriptions come from the run's own content: the tier and
 * ending files in its scenario bundle. Before this, screens title-cased the
 * ids ("the_visionary" → "The Visionary") and used descriptions hard-coded
 * in the UI, so a pack's own endings could never be named properly.
 *
 * Title-cased ids remain only as a fallback, for an id the bundle doesn't
 * have and for share links made before links carried names.
 */

import type { ScenarioBundle } from '@/domains/content/model'

export interface OutcomeText {
  tierName: string
  archetypeName: string
  archetypeDescription: string
  archetypeFlavor?: string
}

const COARSE_TIER_NAMES: Record<string, string> = {
  success: 'Success',
  partial_success: 'Partial Success',
  failure: 'Failure',
}

/** "the_visionary" → "The Visionary": only when content has no name. */
export function titleCaseId(id: string): string {
  return id
    .split('_')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function findById<T extends { id: string }>(entities: Map<string, T> | undefined, id: string | null | undefined): T | undefined {
  if (!entities || !id) return undefined
  for (const entity of entities.values()) {
    if (entity.id === id) return entity
  }
  return undefined
}

const GENERIC_ARCHETYPE_DESCRIPTION = 'Your architectural journey was unique and shaped by the choices you made.'

/**
 * The names and description for a finished run. `tierId` is the content
 * tier the run ended in, falling back to the coarse result when no content
 * tier matched.
 */
export function describeOutcome(
  bundle: ScenarioBundle | null | undefined,
  tierId: string,
  archetypeId: string,
): OutcomeText {
  const tier = findById(bundle?.outcome_tiers, tierId)
  const archetype = findById(bundle?.outcome_archetypes, archetypeId)
  return {
    tierName: tier?.name ?? COARSE_TIER_NAMES[tierId] ?? titleCaseId(tierId),
    archetypeName: archetype?.name ?? titleCaseId(archetypeId),
    archetypeDescription: archetype?.description ?? GENERIC_ARCHETYPE_DESCRIPTION,
    ...(archetype?.flavor_text ? { archetypeFlavor: archetype.flavor_text } : {}),
  }
}
