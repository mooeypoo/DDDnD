/**
 * Pack Playability Check
 *
 * After a pack is registered (by its pack key) next to the packs it will be played with, checks
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
import type { ContentProvider } from './content_provider'
import type { PackIssue } from './pack_snapshot_builder'
import { tableChoiceIssues } from './table_choices'

type PlayabilityRegistry = Pick<
  ContentPackRegistry,
  'getPack' | 'createScopedProvider' | 'getTableClasses'
>

/**
 * Returns every reason the pack can't be played, or an empty list.
 */
export async function checkPackPlayable(
  registry: PlayabilityRegistry,
  packKey: string,
): Promise<PackIssue[]> {
  const manifest = registry.getPack(packKey)?.manifest
  if (!manifest) {
    return [{ file: 'pack', message: `pack ${packKey} is not loaded` }]
  }

  const scenarioRefs = [...manifest.scenarios, ...manifest.tutorials]
  if (scenarioRefs.length === 0) {
    return [{ file: 'manifest.json', message: 'the pack has no scenarios to play' }]
  }

  let provider
  try {
    provider = registry.createScopedProvider(packKey)
  } catch (error) {
    return [{ file: 'manifest.json', message: (error as Error).message }]
  }

  const issues: PackIssue[] = []
  const tracked: Array<{ ref: (typeof scenarioRefs)[number]; tracked_score_ids: string[] }> = []
  for (const ref of scenarioRefs) {
    const file = `scenarios/${versionRefKey(ref)}.json`
    try {
      const bundle = await buildScenarioBundle(ref.id, ref.version, provider)
      for (const error of validateScenarioBundle(bundle).errors) {
        issues.push({ file, message: error.message })
      }
      if (manifest.scenarios.includes(ref)) {
        tracked.push({ ref, tracked_score_ids: bundle.scenario.score_refs.map((scoreRef) => scoreRef.id) })
      }
    } catch (error) {
      issues.push({ file, message: (error as Error).message })
    }
  }
  issues.push(...await checkTableChoices(registry, packKey, provider, tracked))
  return issues
}

/**
 * The pack's classes and modifiers fit its scenarios, and every scenario has
 * a class to sit down with (journal M3.10). Tutorials skip the class choice,
 * so only adventures count.
 */
export async function checkTableChoices(
  registry: Pick<ContentPackRegistry, 'getPack' | 'getTableClasses'>,
  packKey: string,
  provider: ContentProvider,
  scenarios: Array<{ ref: { id: string; version: number }; tracked_score_ids: string[] }>,
): Promise<PackIssue[]> {
  const manifest = registry.getPack(packKey)?.manifest
  if (!manifest) return []
  try {
    const [ownClasses, ownModifiers, tableClasses] = await Promise.all([
      Promise.all(manifest.classes.map((ref) => provider.loadPlayerClass(ref))),
      Promise.all((manifest.challenge_modifiers ?? []).map((ref) => provider.loadChallengeModifier(ref))),
      Promise.all(registry.getTableClasses(packKey).map((ref) => provider.loadPlayerClass(ref))),
    ])
    return tableChoiceIssues({
      own_classes: ownClasses,
      own_modifiers: ownModifiers,
      table_classes: tableClasses,
      scenarios,
    })
  } catch (error) {
    return [{ file: 'manifest.json', message: (error as Error).message }]
  }
}
