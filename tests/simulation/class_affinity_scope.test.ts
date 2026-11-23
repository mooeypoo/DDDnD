/**
 * A class's favored score gets +1 per turn, but only in scenarios that track
 * it (journal M3.6). Before, a base class added a stray score to the
 * tutorial's HUD ("Domain Clarity 2") and would do the same to any pack with
 * its own scores.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createDiskBackedRegistry } from '../content/support/demo_pack'

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.resolve(file), 'utf8')) as T
}

async function bundleFor(pack: 'base' | 'tutorial', scenarioId: string, version: number) {
  const registry = createDiskBackedRegistry()
  registry.registerPack(readJson<ContentPackManifest>('content/manifest.json'))
  registry.registerPack(readJson<ContentPackManifest>('content/tutorial/manifest.json'))
  return buildScenarioBundle(scenarioId, version, registry.createScopedProvider(firstPartyPackKey(pack)))
}

describe('class score affinity', () => {
  it("adds nothing to a scenario that doesn't track the favored score", async () => {
    const bundle = await bundleFor('tutorial', 'tutorial_basics', 2)
    const report = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'affinity', play_policy: 'player_true', class_score_affinity: 'domain_clarity' })
    for (const run of report.per_run) {
      expect(Object.keys(run.final_scores).sort()).toEqual(bundle.scenario.score_refs.map((ref) => ref.id).sort())
    }
  })

  it('still gives +1 per turn where the score is tracked', async () => {
    const bundle = await bundleFor('base', 'monolith_of_mild_despair', 2)
    const plain = simulate_runs({ scenario_bundle: bundle, runs: 1, seed: 'affinity', play_policy: 'player_true' })
    const favored = simulate_runs({ scenario_bundle: bundle, runs: 1, seed: 'affinity', play_policy: 'player_true', class_score_affinity: 'domain_clarity' })
    expect(favored.per_run[0].final_scores.domain_clarity).toBeGreaterThan(plain.per_run[0].final_scores.domain_clarity)
  })
})
