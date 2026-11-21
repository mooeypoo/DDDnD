/**
 * Pack Playability Check
 *
 * After a pack is registered next to the packs it will be played with, checks
 * that each of its scenarios actually builds and validates: dependencies
 * present, references resolve within scope, every score in score_refs,
 * condition targets present.
 *
 * File-level validation (the snapshot builder) can't see any of this, because
 * it depends on the other packs. Running it before the consent screen means a
 * player is never offered a pack that would fail when they sit down.
 */

import { versionRefKey } from '../model/version_ref'
import { buildScenarioBundle } from './bundle_builder'
import { validateScenarioBundle } from './bundle_validator'
import type { ContentPackRegistry } from './content_pack_registry'
import type { PackIssue } from './pack_snapshot_builder'

/**
 * Returns every reason the pack can't be played, or an empty list.
 */
export async function checkPackPlayable(
  registry: Pick<ContentPackRegistry, 'getManifests' | 'createScopedProvider'>,
  packId: string,
): Promise<PackIssue[]> {
  const manifest = registry.getManifests().find((candidate) => candidate.id === packId)
  if (!manifest) {
    return [{ file: 'pack', message: `pack "${packId}" is not loaded` }]
  }

  const scenarioRefs = [...manifest.scenarios, ...manifest.tutorials]
  if (scenarioRefs.length === 0) {
    return [{ file: 'manifest.json', message: 'the pack has no scenarios to play' }]
  }

  let provider
  try {
    provider = registry.createScopedProvider(packId)
  } catch (error) {
    return [{ file: 'manifest.json', message: (error as Error).message }]
  }

  const issues: PackIssue[] = []
  for (const ref of scenarioRefs) {
    const file = `scenarios/${versionRefKey(ref)}.json`
    try {
      const bundle = await buildScenarioBundle(ref.id, ref.version, provider)
      for (const error of validateScenarioBundle(bundle).errors) {
        issues.push({ file, message: error.message })
      }
    } catch (error) {
      issues.push({ file, message: (error as Error).message })
    }
  }
  return issues
}
