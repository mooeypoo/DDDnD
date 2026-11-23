/**
 * Endings are chosen by their content (M3 slice 4, journal M3.5).
 *
 * The old classifier (TypeScript predicates in a fixed order) is kept and
 * compared with the base endings' declarative criteria on many generated
 * runs. The golden replays never reach three endings (boundary_builder,
 * budget_hawk, the_pragmatist), so this sweep is what proves them.
 */

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { addToBundle, createEmptyBundle, type OutcomeArchetype, type Scenario, type ScenarioBundle } from '@/domains/content/model'
import { validateScenarioBundle } from '@/domains/content/services/bundle_validator'
import { ContentSchemaError, parseContentEntity } from '@/domains/content/validation'
import { classifyOutcomeArchetype, selectEnding, type EndingRunState } from '@/domains/simulation/rules'
import { createInitialGameState } from '@/domains/simulation/model'
import { getRunOutcome } from '@/domains/simulation/services'
import type { RunAnalytics } from '@/domains/simulation/model'
import { createSeededRandom } from '@/shared/random/seeded_random'

const DIR = 'content/outcome-archetypes'
const BASE_ENDINGS: OutcomeArchetype[] = readdirSync(DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(path.resolve(DIR, file), 'utf8')) as OutcomeArchetype)

const SCORE_IDS = ['domain_clarity', 'maintainability', 'delivery_confidence', 'budget', 'user_trust', 'team_morale']
const STAKEHOLDER_IDS = ['cto', 'cfo', 'head_of_product']

const SCENARIO: Scenario = {
  id: 'ending_test',
  version: 1,
  name: 'Ending Test',
  description: 'Scenario for ending tests',
  max_turns: 8,
  starting_scores: Object.fromEntries(SCORE_IDS.map((id) => [id, 50])),
  score_refs: SCORE_IDS.map((id) => ({ id, version: 1 })),
  stakeholder_refs: STAKEHOLDER_IDS.map((id) => ({ id, version: 1 })),
  card_refs: [],
  event_refs: [],
}

function bundleWith(endings: OutcomeArchetype[]): ScenarioBundle {
  const bundle = createEmptyBundle(SCENARIO)
  for (const ending of endings) addToBundle(bundle, 'outcome_archetype', ending)
  return bundle
}

/**
 * A generated finished run. Values cluster around the thresholds the
 * endings use, so every boundary is crossed many times.
 */
function generateRuns(count: number): EndingRunState[] {
  const random = createSeededRandom('content-endings-equivalence')
  const pick = <T,>(values: T[]): T => values[Math.floor(random.next() * values.length)]
  const near = (centres: number[], spread: number) => pick(centres) + Math.round((random.next() * 2 - 1) * spread)
  const runs: EndingRunState[] = []
  for (let index = 0; index < count; index++) {
    const deltas = Object.fromEntries(SCORE_IDS.map((id) => [id, near([-12, -5, -3, 0, 3, 5, 10, 15], 6)]))
    const scores = Object.fromEntries(SCORE_IDS.map((id) => [id, near([25, 30, 45, 65, 50], 6)]))
    const stakeholderDeltas = Object.fromEntries(STAKEHOLDER_IDS.map((id) => [id, near([-3, 0, 3, 5], 4)]))
    const turns = pick([1, 4, 6, 8, 10])
    const pressure = Math.round(turns * pick([0, 0.5, 1, 1.5, 2]) + (random.next() * 2 - 1) * 2)
    const events = Math.max(0, Math.round(pressure * random.next()))
    const analytics: RunAnalytics = {
      turns_completed: turns,
      total_aftershocks_resolved: Math.max(0, pressure - events),
      total_events_triggered: events,
      total_actions_played: turns,
      cumulative_score_deltas: deltas,
      cumulative_stakeholder_deltas: stakeholderDeltas,
      card_usage: {},
      style_tags_used: {},
    }
    runs.push({ scores, run_analytics: analytics })
  }
  return runs
}

describe('base endings from content', () => {
  it('pick the same ending as the old classifier on 40,000 generated runs, and every ending is reached', () => {
    const bundle = bundleWith(BASE_ENDINGS)
    const reached = new Map<string, number>()
    for (const run of generateRuns(40_000)) {
      const expected = classifyOutcomeArchetype({ game_state: run })
      const actual = selectEnding(run, bundle)?.id
      if (actual !== expected) {
        expect.fail(`expected ${expected}, got ${actual} for ${JSON.stringify(run)}`)
      }
      reached.set(expected, (reached.get(expected) ?? 0) + 1)
    }
    expect([...reached.keys()].sort()).toEqual(BASE_ENDINGS.map((ending) => ending.id).sort())
    for (const [id, count] of reached) {
      expect(count, id).toBeGreaterThan(100)
    }
  })

  it('pass the bundle checks', () => {
    // The bare test scenario has no score or stakeholder files; only ending checks matter here
    const endingErrors = validateScenarioBundle(bundleWith(BASE_ENDINGS)).errors.filter((error) => /ending/.test(error.type))
    expect(endingErrors).toEqual([])
  })
})

describe('pack endings', () => {
  const ending = (id: string, priority: number, when: NonNullable<OutcomeArchetype['criteria']>['when']): OutcomeArchetype => ({
    id, version: 1, name: id, description: `${id} ending`, criteria: { priority, when },
  })
  const run = (overrides: Partial<RunAnalytics>, scores: Record<string, number> = {}): EndingRunState => ({
    scores,
    run_analytics: {
      turns_completed: 4, total_aftershocks_resolved: 0, total_events_triggered: 0, total_actions_played: 4,
      cumulative_score_deltas: {}, cumulative_stakeholder_deltas: {}, card_usage: {}, style_tags_used: {},
      ...overrides,
    },
  })

  it("choose a pack's own ending on its own scores, by priority", () => {
    const bundle = bundleWith([
      ending('pager_hero', 20, [{ measure: 'final_score', score_id: 'user_trust', operator: '>=', value: 70 }]),
      ending('toil_tamer', 10, [{ measure: 'score_change', score_ids: ['maintainability'], operator: '>', value: 0 }]),
      ending('on_call', 0, []),
    ])
    expect(selectEnding(run({ cumulative_score_deltas: { maintainability: 5 } }, { user_trust: 80 }), bundle)?.id).toBe('pager_hero')
    expect(selectEnding(run({ cumulative_score_deltas: { maintainability: 5 } }, { user_trust: 60 }), bundle)?.id).toBe('toil_tamer')
    expect(selectEnding(run({}, { user_trust: 60 }), bundle)?.id).toBe('on_call')
  })

  it("is the run's recorded ending, under the pack's own id (journal M3.7)", () => {
    const bundle = bundleWith([
      ending('pager_hero', 20, [{ measure: 'final_score', score_id: 'user_trust', operator: '>=', value: 70 }]),
      ending('on_call', 0, []),
    ])
    const state = createInitialGameState({
      run_id: 'r', seed: 's', scenario_ref: { id: SCENARIO.id, version: 1 }, max_turns: 8,
      starting_scores: { ...SCENARIO.starting_scores, user_trust: 80 }, stakeholder_refs: [], available_action_refs: [], available_event_refs: [],
      created_at_utc: '2026-11-23T00:00:00.000Z',
    })
    state.progress.run_status = 'completed_max_turns'
    state.run_analytics.turns_completed = 8
    expect(getRunOutcome(state, bundle)).toMatchObject({ archetype: 'pager_hero', selected_archetype_id: 'pager_hero' })
  })

  it('can check named stakeholders only', () => {
    const bundle = bundleWith([
      ending('cfo_friend', 10, [{ measure: 'stakeholder_change', stakeholder_ids: ['cfo'], operator: '>=', value: 5 }]),
      ending('default', 0, []),
    ])
    expect(selectEnding(run({ cumulative_stakeholder_deltas: { cfo: 6, cto: -20 } }), bundle)?.id).toBe('cfo_friend')
    expect(selectEnding(run({ cumulative_stakeholder_deltas: { cfo: 4, cto: 20 } }), bundle)?.id).toBe('default')
  })

  it('a final score the run lacks never satisfies a condition', () => {
    const bundle = bundleWith([
      ending('low_budget', 10, [{ measure: 'final_score', score_id: 'budget', operator: '<', value: 1000 }]),
      ending('default', 0, []),
    ])
    expect(selectEnding(run({}, {}), bundle)?.id).toBe('default')
  })

  it('no ending with criteria: no content ending (the tutorial keeps the old classifier for now)', () => {
    const bare: OutcomeArchetype = { id: 'tutorial_learner', version: 1, name: 'Learner', description: 'Learned' }
    expect(selectEnding(run({}), bundleWith([bare]))).toBeNull()
  })

  it('validation: refuses shared priorities, no fallback, unreachable endings, and unknown scores or stakeholders', () => {
    const types = (endings: OutcomeArchetype[]) => validateScenarioBundle(bundleWith(endings)).errors.map((error) => error.type)
    expect(types([ending('a', 5, []), ending('b', 5, [{ measure: 'pressure_per_turn', operator: '>', value: 1 }])])).toContain('duplicate_ending_priority')
    expect(types([ending('a', 5, [{ measure: 'pressure_per_turn', operator: '>', value: 1 }])])).toContain('no_fallback_ending')
    expect(types([ending('a', 5, []), ending('b', 1, [{ measure: 'pressure_per_turn', operator: '>', value: 1 }])])).toContain('unreachable_ending')
    expect(types([ending('a', 5, [{ measure: 'final_score', score_id: 'uptime', operator: '>', value: 1 }]), ending('z', 0, [])])).toContain('untracked_ending_score')
    expect(types([ending('a', 5, [{ measure: 'stakeholder_change', stakeholder_ids: ['ghost'], operator: '>', value: 1 }]), ending('z', 0, [])])).toContain('unknown_ending_stakeholder')
  })

  it('schema: refuses unknown measures, operators, and fields', () => {
    const issues = (criteria: unknown) => {
      try {
        parseContentEntity('outcome-archetypes', { id: 'x', version: 1 }, { id: 'x', version: 1, name: 'X', description: 'X ending', criteria })
        return []
      } catch (error) {
        if (error instanceof ContentSchemaError) return error.issues
        throw error
      }
    }
    expect(issues({ priority: 1, when: [{ measure: 'pressure_per_turn', operator: '>=', value: 1.5 }] })).toEqual([])
    expect(issues({ priority: 1, when: [{ measure: 'vibes', operator: '>=', value: 1 }] })).not.toEqual([])
    expect(issues({ priority: 1, when: [{ measure: 'pressure_per_turn', operator: '==', value: 1 }] })).not.toEqual([])
    expect(issues({ priority: 1, when: [{ measure: 'pressure_per_turn', operator: '>', value: 1, score_id: 'budget' }] })).not.toEqual([])
    expect(issues({ priority: 1, when: [{ measure: 'score_change', score_ids: [], operator: '>', value: 1 }] })).not.toEqual([])
  })
})
