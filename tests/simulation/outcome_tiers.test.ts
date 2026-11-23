/**
 * Outcome tiers are content (M3 slice 3, journal M3.4): each tier declares
 * the score average that reaches it and the coarse result it counts as.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { addToBundle, createEmptyBundle, type OutcomeTier, type Scenario, type ScenarioBundle } from '@/domains/content/model'
import { validateScenarioBundle } from '@/domains/content/services/bundle_validator'
import { ContentSchemaError, parseContentEntity } from '@/domains/content/validation'
import { createInitialGameState } from '@/domains/simulation/model'
import { selectOutcomeTier } from '@/domains/simulation/rules'
import { getRunOutcome } from '@/domains/simulation/services'

const BASE_TIERS: OutcomeTier[] = ['triumph', 'success', 'survival', 'struggle', 'collapse'].map(
  (id) => JSON.parse(readFileSync(path.resolve(`content/outcome-tiers/${id}-v1.json`), 'utf8')) as OutcomeTier,
)

const SCENARIO: Scenario = {
  id: 'tier_test',
  version: 1,
  name: 'Tier Test',
  description: 'Scenario for tier tests',
  max_turns: 4,
  starting_scores: { a: 50, b: 50 },
  score_refs: [{ id: 'a', version: 1 }, { id: 'b', version: 1 }],
  stakeholder_refs: [],
  card_refs: [],
  event_refs: [],
}

function bundleWith(tiers: OutcomeTier[]): ScenarioBundle {
  const bundle = createEmptyBundle(SCENARIO)
  for (const tier of tiers) addToBundle(bundle, 'outcome_tier', tier)
  return bundle
}

/** The tier selection the engine hard-coded before slice 3, kept to prove equivalence. */
function legacyTierId(average: number, present: Set<string>): string | null {
  if (average >= 75 && present.has('triumph')) return 'triumph'
  if (average >= 60 && present.has('success')) return 'success'
  if (average >= 45 && present.has('survival')) return 'survival'
  if (average >= 30 && present.has('struggle')) return 'struggle'
  if (present.has('collapse')) return 'collapse'
  return null
}

function averages(): number[] {
  const values: number[] = []
  for (let tenth = -200; tenth <= 1200; tenth += 1) values.push(tenth / 10)
  // Exactly on and just around every boundary
  for (const edge of [0, 30, 45, 60, 75]) values.push(edge - 1e-9, edge, edge + 1e-9)
  return values
}

describe('tier selection from content', () => {
  it('picks the same base tier as the old hard-coded cutoffs, at every average', () => {
    const bundle = bundleWith(BASE_TIERS)
    const present = new Set(BASE_TIERS.map((tier) => tier.id))
    for (const average of averages()) {
      expect(selectOutcomeTier(average, bundle)?.id ?? null, `average ${average}`).toBe(legacyTierId(average, present))
    }
  })

  it('matches the old cutoffs when a scenario uses only some base tiers', () => {
    const subsets = [['success', 'collapse'], ['triumph', 'survival', 'collapse'], ['struggle', 'collapse'], ['success', 'survival', 'struggle', 'collapse']]
    for (const ids of subsets) {
      const tiers = BASE_TIERS.filter((tier) => ids.includes(tier.id))
      const bundle = bundleWith(tiers)
      for (const average of averages()) {
        expect(selectOutcomeTier(average, bundle)?.id ?? null, `${ids.join(',')} at ${average}`).toBe(legacyTierId(average, new Set(ids)))
      }
    }
  })

  it("picks a pack's own tiers, which the old code never could", () => {
    const tiers: OutcomeTier[] = [
      { id: 'pager_peace', version: 1, name: 'Pager Peace', description: 'Quiet nights', rank: 3, min_average: 70, result: 'success' },
      { id: 'toil', version: 1, name: 'Toil', description: 'Mostly toil', rank: 2, min_average: 40, result: 'partial_success' },
      { id: 'outage', version: 1, name: 'Outage', description: 'Down', rank: 1, min_average: 10, result: 'failure' },
    ]
    const bundle = bundleWith(tiers)
    expect(selectOutcomeTier(85, bundle)?.id).toBe('pager_peace')
    expect(selectOutcomeTier(40, bundle)?.id).toBe('toil')
    expect(selectOutcomeTier(39.9, bundle)?.id).toBe('outage')
    // Below every threshold, the lowest tier is the floor
    expect(selectOutcomeTier(-5, bundle)?.id).toBe('outage')
  })

  it('never picks a tier without a threshold (the tutorial today)', () => {
    const tiers: OutcomeTier[] = [{ id: 'tutorial_done', version: 1, name: 'Done', description: 'Done', rank: 1 }]
    expect(selectOutcomeTier(50, bundleWith(tiers))).toBeNull()
  })
})

describe('the coarse result comes from the tier', () => {
  function outcomeAt(scores: Record<string, number>, tiers: OutcomeTier[], status: 'completed_max_turns' | 'completed_failure' = 'completed_max_turns') {
    const bundle = bundleWith(tiers)
    if (status === 'completed_failure') {
      bundle.scenario = { ...SCENARIO, failure_conditions: [{ target_type: 'score', target_id: 'a', operator: '<', value: 101 }] }
    }
    const state = createInitialGameState({
      run_id: 'r', seed: 's', scenario_ref: { id: SCENARIO.id, version: 1 }, max_turns: 4,
      starting_scores: scores, stakeholder_refs: [], available_action_refs: [], available_event_refs: [],
      created_at_utc: '2026-11-23T00:00:00.000Z',
    })
    state.progress.run_status = 'completed_max_turns'
    state.run_analytics.turns_completed = 4
    return getRunOutcome(state, bundle)
  }

  it('counts a Struggle run as partial, including averages 30–35 that used to be failure', () => {
    expect(outcomeAt({ a: 32, b: 32 }, BASE_TIERS)).toMatchObject({ selected_tier_id: 'struggle', tier: 'partial_success' })
    expect(outcomeAt({ a: 40, b: 40 }, BASE_TIERS)).toMatchObject({ selected_tier_id: 'struggle', tier: 'partial_success' })
  })

  it('keeps every other base band as it was', () => {
    expect(outcomeAt({ a: 80, b: 80 }, BASE_TIERS)?.tier).toBe('success')
    expect(outcomeAt({ a: 60, b: 60 }, BASE_TIERS)?.tier).toBe('success')
    expect(outcomeAt({ a: 50, b: 50 }, BASE_TIERS)?.tier).toBe('partial_success')
    expect(outcomeAt({ a: 29, b: 29 }, BASE_TIERS)?.tier).toBe('failure')
  })

  it('still fails a run that met a failure condition, whatever its tier', () => {
    expect(outcomeAt({ a: 80, b: 80 }, BASE_TIERS, 'completed_failure')).toMatchObject({ selected_tier_id: 'triumph', tier: 'failure' })
  })

  it('uses the old cutoffs when no tier is picked', () => {
    expect(outcomeAt({ a: 32, b: 32 }, [])).toMatchObject({ selected_tier_id: null, tier: 'failure' })
    expect(outcomeAt({ a: 40, b: 40 }, [])?.tier).toBe('partial_success')
  })
})

describe('tier validation', () => {
  const ref = { id: 'x', version: 1 }
  const tier = { id: 'x', version: 1, name: 'X', description: 'X tier', rank: 1 }

  function issuesOf(value: unknown) {
    try {
      parseContentEntity('outcome-tiers', ref, value)
    } catch (error) {
      if (error instanceof ContentSchemaError) return error.issues.map((issue) => issue.message)
      throw error
    }
    return []
  }

  it('accepts a threshold with its result, or neither', () => {
    expect(issuesOf({ ...tier, min_average: 42.5, result: 'partial_success' })).toEqual([])
    expect(issuesOf(tier)).toEqual([])
  })

  it('refuses a threshold without a result, and the reverse', () => {
    expect(issuesOf({ ...tier, min_average: 40 }).join()).toMatch(/set both, or neither/)
    expect(issuesOf({ ...tier, result: 'success' }).join()).toMatch(/set both, or neither/)
  })

  it('refuses an unknown result', () => {
    expect(issuesOf({ ...tier, min_average: 40, result: 'win' })).not.toEqual([])
  })

  it('refuses two tiers in one scenario with the same threshold', () => {
    const twin = { ...BASE_TIERS[3], id: 'twin' }
    const errors = validateScenarioBundle(bundleWith([...BASE_TIERS, twin])).errors
    expect(errors.map((error) => error.type)).toContain('duplicate_tier_threshold')
    expect(validateScenarioBundle(bundleWith(BASE_TIERS)).errors.map((error) => error.type)).not.toContain('duplicate_tier_threshold')
  })
})
