import type { ScenarioBundle } from '@/domains/content/model/scenario_bundle'

export function buildStakeholderNamesMap(
  bundle: Pick<ScenarioBundle, 'stakeholders'> | null | undefined
): Record<string, string> {
  if (!bundle) {
    return {}
  }

  const names: Record<string, string> = {}
  for (const stakeholder of bundle.stakeholders.values()) {
    names[stakeholder.id] = stakeholder.name
  }
  return names
}

/**
 * Resolves a stakeholder's display name.
 *
 * Uses the provided namesMap (keyed by stakeholder ID) when available,
 * falling back to title-casing the ID itself (e.g. "product_owner" → "Product Owner").
 */
export function formatStakeholderName(
  stakeholderId: string,
  namesMap?: Record<string, string>
): string {
  if (namesMap && namesMap[stakeholderId]) {
    return namesMap[stakeholderId]
  }

  return stakeholderId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
