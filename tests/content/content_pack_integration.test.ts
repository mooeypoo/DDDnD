import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  Card,
  ContentPackManifest,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef,
  PlayerClass,
  ChallengeModifier,
} from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { assertValidBundle } from '@/domains/content/services/bundle_validator'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { assertValidContentPackManifest } from '@/domains/content/services/manifest_validator'

interface VersionedEntity {
  id: string
  version: number
}

async function loadJson<T extends VersionedEntity>(
  contentRoot: string,
  directory: string,
  ref: VersionRef,
): Promise<T> {
  const filename = `${ref.id}-v${ref.version}.json`
  const filePath = path.join(contentRoot, directory, filename)
  const raw = await readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as T

  if (parsed.id !== ref.id || parsed.version !== ref.version) {
    throw new Error(
      `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`,
    )
  }

  return parsed
}

function createFileContentProvider(contentRoot: string): ContentProvider {
  return {
    loadScenario: (ref: VersionRef) => loadJson<Scenario>(contentRoot, 'scenarios', ref),
    loadScore: (ref: VersionRef) => loadJson<Score>(contentRoot, 'scores', ref),
    loadStakeholder: (ref: VersionRef) => loadJson<Stakeholder>(contentRoot, 'stakeholders', ref),
    loadStakeholderReactionRule: (ref: VersionRef) =>
      loadJson<StakeholderReactionRule>(contentRoot, 'stakeholder-reaction-rules', ref),
    loadCard: (ref: VersionRef) => loadJson<Card>(contentRoot, 'cards', ref),
    loadEvent: (ref: VersionRef) => loadJson<Event>(contentRoot, 'events', ref),
    loadDelayedEffect: (ref: VersionRef) => loadJson<DelayedEffect>(contentRoot, 'delayed-effects', ref),
    loadOutcomeTier: (ref: VersionRef) => loadJson<OutcomeTier>(contentRoot, 'outcome-tiers', ref),
    loadOutcomeArchetype: (ref: VersionRef) => loadJson<OutcomeArchetype>(contentRoot, 'outcome-archetypes', ref),
    loadPlayerClass: (ref: VersionRef) => loadJson<PlayerClass>(contentRoot, 'classes', ref),
    loadChallengeModifier: (ref: VersionRef) => loadJson<ChallengeModifier>(contentRoot, 'challenge-modifiers', ref),
  }
}

async function readManifestFromDisk(filePath: string): Promise<ContentPackManifest> {
  const raw = await readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  assertValidContentPackManifest(parsed)
  return parsed
}

describe('content package integration', () => {
  it('loads base and tutorial manifests, then builds valid bundles from merged provider', async () => {
    const projectRoot = path.resolve(__dirname, '../..')

    const baseManifest = await readManifestFromDisk(path.join(projectRoot, 'content/manifest.json'))
    const tutorialManifest = await readManifestFromDisk(path.join(projectRoot, 'content/tutorial/manifest.json'))

    const registry = new ContentPackRegistry()
    registry.registerPack(baseManifest, createFileContentProvider(path.join(projectRoot, 'content')))
    registry.registerPack(tutorialManifest, createFileContentProvider(path.join(projectRoot, 'content/tutorial')))

    const mergedProvider = registry.createMergedProvider()

    const baseScenario = baseManifest.scenarios[0]
    const tutorialScenario = tutorialManifest.tutorials[0]

    const baseBundle = await buildScenarioBundle(baseScenario.id, baseScenario.version, mergedProvider)
    const tutorialBundle = await buildScenarioBundle(tutorialScenario.id, tutorialScenario.version, mergedProvider)

    expect(() => assertValidBundle(baseBundle)).not.toThrow()
    expect(() => assertValidBundle(tutorialBundle)).not.toThrow()
    expect(baseBundle.scenario.is_tutorial ?? false).toBe(false)
    expect(tutorialBundle.scenario.is_tutorial ?? false).toBe(true)
  })
})
