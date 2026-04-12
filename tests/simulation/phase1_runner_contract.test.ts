import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import {
  simulate_runs,
  type SimulationReport,
} from '@/domains/simulation/services/simulation_runner'
import { createMockContentProvider } from '../content/test_helpers'

async function createTestBundle() {
  return buildScenarioBundle('test_scenario', 1, createMockContentProvider())
}

function runSimulation(seed: string, runs = 3): Promise<SimulationReport> {
  return createTestBundle().then((bundle) =>
    simulate_runs({ scenario_bundle: bundle, runs, seed })
  )
}

describe('Phase 1 runner contract', () => {
  it('includes additive per-turn telemetry arrays in each run', async () => {
    const report = await runSimulation('phase1-shape')

    for (const run of report.per_run) {
      expect(Array.isArray(run.stakeholder_telemetry_by_turn)).toBe(true)
      expect(Array.isArray(run.event_telemetry_by_turn)).toBe(true)
      expect(Array.isArray(run.action_telemetry_by_turn)).toBe(true)

      expect(run.stakeholder_telemetry_by_turn.length).toBe(run.cards_played.length)
      expect(run.event_telemetry_by_turn.length).toBe(run.cards_played.length)
      expect(run.action_telemetry_by_turn.length).toBe(run.cards_played.length)
    }
  })

  it('uses turn_number progression and selected_card_id aligned with cards_played', async () => {
    const report = await runSimulation('phase1-turn-alignment', 1)
    const run = report.per_run[0]

    for (let i = 0; i < run.cards_played.length; i++) {
      const expectedTurn = i + 1

      expect(run.stakeholder_telemetry_by_turn[i].turn_number).toBe(expectedTurn)
      expect(run.event_telemetry_by_turn[i].turn_number).toBe(expectedTurn)
      expect(run.action_telemetry_by_turn[i].turn_number).toBe(expectedTurn)
      expect(run.action_telemetry_by_turn[i].selected_card_id).toBe(run.cards_played[i])
    }
  })

  it('produces deterministic Phase 1 telemetry for the same seed', async () => {
    const bundle = await createTestBundle()

    const reportA = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'phase1-det' })
    const reportB = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'phase1-det' })

    for (let i = 0; i < reportA.per_run.length; i++) {
      expect(reportA.per_run[i].stakeholder_telemetry_by_turn).toEqual(
        reportB.per_run[i].stakeholder_telemetry_by_turn
      )
      expect(reportA.per_run[i].event_telemetry_by_turn).toEqual(
        reportB.per_run[i].event_telemetry_by_turn
      )
      expect(reportA.per_run[i].action_telemetry_by_turn).toEqual(
        reportB.per_run[i].action_telemetry_by_turn
      )
    }
  })

  it('includes additive aggregate stakeholder telemetry metrics with bounded rates', async () => {
    const report = await runSimulation('phase1-aggregate-shape', 5)
    const agg = report.aggregate

    expect(agg).toHaveProperty('average_stakeholder_satisfaction_by_turn')
    expect(agg).toHaveProperty('stakeholder_recovery_rate')
    expect(agg).toHaveProperty('stakeholder_decline_rate')
    expect(agg).toHaveProperty('rule_trigger_rate_by_stakeholder')

    for (const rate of Object.values(agg.stakeholder_recovery_rate)) {
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(1)
    }

    for (const rate of Object.values(agg.stakeholder_decline_rate)) {
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(1)
    }

    for (const ruleRates of Object.values(agg.rule_trigger_rate_by_stakeholder)) {
      for (const rate of Object.values(ruleRates)) {
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(1)
      }
    }
  })
})
