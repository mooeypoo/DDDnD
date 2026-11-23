/**
 * Golden replays (M3.0, slice 0).
 *
 * M3 moves the engine's DDD knowledge (coupling, tiers, endings) into
 * content. The base game must play exactly as before, so this test replays
 * fixed seeds through every first-party scenario, with both simulator
 * policies, with every class and modifier, plus the demo pack. It compares
 * the result with a recorded fixture.
 *
 * Each run is recorded as a readable summary (tier, ending, final scores)
 * and a hash of its full telemetry (every turn's cards, events, reactions,
 * scores and stakeholders), so drift is caught exactly and shown readably.
 *
 * This test never rewrites its fixture. To record new expectations, which
 * should only happen when content deliberately changes (a new content version,
 * called out in the journal), run:
 *
 *   npm run test:golden:update
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import type { ChallengeModifier, ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { simulate_runs, type SimulationPlayPolicy } from '@/domains/simulation/services/simulation_runner'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'
import { createDiskBackedRegistry, DEMO_PACK_ROOT } from '../content/support/demo_pack'

const FIXTURE = path.resolve('tests/simulation/golden/first_party_runs.json')
const SEED = 'golden-v1'
const RUNS = 12
/**
 * Tutorials are gentle, so a dozen runs rarely push a score low enough to
 * trigger coupling. More runs make sure every tutorial coupling rule fires at
 * least once (checked when this fixture was recorded, by perturbing each rule).
 */
const TUTORIAL_RUNS = 60

interface GoldenCase {
  name: string
  pack_key: string
  scenario: { id: string; version: number }
  policy: SimulationPlayPolicy
  class_score_affinity?: string
  challenge_modifier_id?: string
  runs?: number
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.resolve(file), 'utf8')) as T
}

function goldenCases(): GoldenCase[] {
  const base = readJson<ContentPackManifest>('content/manifest.json')
  const tutorial = readJson<ContentPackManifest>('content/tutorial/manifest.json')
  const demo = readJson<ContentPackManifest>(path.join(DEMO_PACK_ROOT, 'manifest.json'))
  const affinities = base.classes.map((ref) => readJson<{ score_affinity: string }>(`content/classes/${ref.id}-v${ref.version}.json`).score_affinity)
  const modifiers = base.challenge_modifiers.map((ref) => ref.id)

  const cases: GoldenCase[] = []
  base.scenarios.forEach((scenario, index) => {
    const key = firstPartyPackKey('base')
    for (const policy of ['player_true', 'full_pool_oracle'] as const) {
      cases.push({ name: `${scenario.id}-v${scenario.version} ${policy}`, pack_key: key, scenario, policy })
    }
    // Every class affinity and every modifier is covered across the scenarios
    const affinity = affinities[index % affinities.length]
    const modifier = modifiers[index % modifiers.length]
    cases.push({
      name: `${scenario.id}-v${scenario.version} player_true +${affinity} +${modifier}`,
      pack_key: key, scenario, policy: 'player_true', class_score_affinity: affinity, challenge_modifier_id: modifier,
    })
  })
  for (const scenario of tutorial.tutorials) {
    for (const policy of ['player_true', 'full_pool_oracle'] as const) {
      cases.push({ name: `${scenario.id}-v${scenario.version} ${policy}`, pack_key: firstPartyPackKey('tutorial'), scenario, policy, runs: TUTORIAL_RUNS })
    }
  }
  for (const scenario of demo.scenarios) {
    cases.push({ name: `demo:${scenario.id}-v${scenario.version} player_true`, pack_key: 'demo', scenario, policy: 'player_true' })
  }
  return cases
}

async function replay(): Promise<Record<string, unknown>> {
  const registry = createDiskBackedRegistry()
  const base = readJson<ContentPackManifest>('content/manifest.json')
  registry.registerPack(base)
  registry.registerPack(readJson<ContentPackManifest>('content/tutorial/manifest.json'))
  const demoManifest = readJson<ContentPackManifest>(path.join(DEMO_PACK_ROOT, 'manifest.json'))
  const demoKey = registry.registerPack(demoManifest, createFileContentProvider(DEMO_PACK_ROOT), 'github:golden/demo/gilded_ledger')
  const modifiers = new Map(base.challenge_modifiers.map((ref) => [
    ref.id,
    readJson<ChallengeModifier>(`content/challenge-modifiers/${ref.id}-v${ref.version}.json`),
  ]))

  const results: Record<string, unknown> = {}
  for (const goldenCase of goldenCases()) {
    const packKey = goldenCase.pack_key === 'demo' ? demoKey : goldenCase.pack_key
    const bundle = await buildScenarioBundle(goldenCase.scenario.id, goldenCase.scenario.version, registry.createScopedProvider(packKey))
    const report = simulate_runs({
      scenario_bundle: bundle,
      runs: goldenCase.runs ?? RUNS,
      seed: SEED,
      play_policy: goldenCase.policy,
      ...(goldenCase.class_score_affinity ? { class_score_affinity: goldenCase.class_score_affinity } : {}),
      ...(goldenCase.challenge_modifier_id ? { challenge_modifier: modifiers.get(goldenCase.challenge_modifier_id) } : {}),
    })
    results[goldenCase.name] = report.per_run.map((run) => ({
      tier: run.outcome_tier,
      tier_id: run.selected_tier_id,
      ending: run.archetype,
      status: run.run_status,
      turns: run.turns_completed,
      final_scores: run.final_scores,
      telemetry_sha256: createHash('sha256').update(JSON.stringify(run)).digest('hex'),
    }))
  }
  return results
}

describe('golden replays (M3.0)', () => {
  it('replays every first-party scenario and the demo pack exactly as recorded', async () => {
    const actual = await replay()

    if (process.env.UPDATE_GOLDEN === '1') {
      writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 2)}\n`)
      return
    }

    expect(existsSync(FIXTURE), 'No golden fixture: run `npm run test:golden:update` once to record it').toBe(true)
    const expected = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>
    expect(Object.keys(actual)).toEqual(Object.keys(expected))
    for (const name of Object.keys(expected)) {
      expect(actual[name], `golden replay drifted: ${name}`).toEqual(expected[name])
    }
  }, 120_000)
})
