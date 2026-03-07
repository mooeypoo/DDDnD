import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { createMockContentProvider } from '../content/test_helpers'
import { create_engine } from '@/domains/simulation/services'

async function createScenarioBundle() {
  return buildScenarioBundle('test_scenario', 1, createMockContentProvider())
}

describe('Simulation engine shell orchestration', () => {
  it('creates an engine with a scenario bundle', async () => {
    const scenarioBundle = await createScenarioBundle()

    expect(() => create_engine({ scenario_bundle: scenarioBundle })).not.toThrow()
    expect(() => create_engine({ scenario_bundle: undefined as unknown as never })).toThrow(
      'create_engine requires a scenario_bundle'
    )
  })

  it('initializes a valid game_state from the scenario bundle', async () => {
    const scenarioBundle = await createScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'seed-init' })

    const gameState = engine.create_run()

    expect(gameState.progress.current_turn).toBe(1)
    expect(gameState.progress.max_turns).toBe(scenarioBundle.scenario.max_turns)
    expect(gameState.scores).toEqual(scenarioBundle.scenario.starting_scores)
    expect(gameState.scenario_ref).toEqual({ id: 'test_scenario', version: 1 })
    expect(gameState.action_state.available_action_refs).toEqual([{ id: 'refactor_module', version: 1 }])
    expect(gameState.event_state.available_event_refs).toEqual([{ id: 'production_incident', version: 1 }])
    expect(gameState.history).toEqual([])
  })

  it('returns a turn briefing with expected structure', async () => {
    const scenarioBundle = await createScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'seed-briefing' })

    engine.create_run()
    const briefing = engine.get_turn_briefing()

    expect(briefing.turn_number).toBe(1)
    expect(briefing.current_scores).toEqual({ technical_debt: 50, team_morale: 60 })
    expect(briefing.stakeholder_satisfaction).toEqual({ tech_lead: 50 })
    expect(briefing.available_action_card_ids).toEqual(['refactor_module'])
    expect(briefing.available_action_summaries[0]).toMatchObject({
      card_id: 'refactor_module',
      card_version: 1
    })
    expect(Array.isArray(briefing.pending_delayed_effects_resolving_this_turn)).toBe(true)
  })

  it('increments turn number and records a turn history entry when playing a turn', async () => {
    const scenarioBundle = await createScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'seed-turn' })

    engine.create_run()
    const result = engine.play_turn('refactor_module')

    expect(result.game_state.progress.current_turn).toBe(2)
    expect(result.game_state.run_analytics.turns_completed).toBe(1)
    expect(result.game_state.history).toHaveLength(1)
    expect(result.turn_history_entry.turn_number).toBe(1)
    expect(result.turn_history_entry.action_resolution.selected_action).toEqual({
      id: 'refactor_module',
      version: 1
    })
    expect(result.turn_resolution_context.selected_action).toEqual({
      id: 'refactor_module',
      version: 1
    })
  })

  it('returns deterministic results for same seed and action sequence', async () => {
    const scenarioBundle = await createScenarioBundle()
    const actions = ['refactor_module', 'refactor_module']

    const engineA = create_engine({ scenario_bundle: scenarioBundle, seed: 'seed-deterministic' })
    const engineB = create_engine({ scenario_bundle: scenarioBundle, seed: 'seed-deterministic' })

    engineA.create_run()
    engineB.create_run()

    for (const actionId of actions) {
      engineA.play_turn(actionId)
      engineB.play_turn(actionId)
    }

    const briefingA = engineA.get_turn_briefing()
    const briefingB = engineB.get_turn_briefing()

    expect(briefingA).toEqual(briefingB)
    expect(engineA.get_run_outcome()).toEqual(engineB.get_run_outcome())
  })
})
