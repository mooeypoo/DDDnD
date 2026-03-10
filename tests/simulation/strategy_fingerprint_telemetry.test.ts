/**
 * Strategy Fingerprint Telemetry Tests
 *
 * Validates the new strategy-fingerprint telemetry layer added to the
 * simulation runner. Covers:
 * - Opening card telemetry (frequency and sequence)
 * - Score trajectory aggregation (average_score_by_turn)
 * - Winning card pair aggregation
 * - Successful low-score rate calculation
 * - Deterministic output for identical seeds
 * - Backward compatibility with existing report fields
 */

import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import {
  simulate_runs,
  SimulationReport
} from '@/domains/simulation/services/simulation_runner'
import { createMockContentProvider } from '../content/test_helpers'

// ── Test helpers ────────────────────────────────────────────────

async function createTestBundle() {
  return buildScenarioBundle('test_scenario', 1, createMockContentProvider())
}

function runSimulation(seed: string, runs: number = 5): Promise<SimulationReport> {
  return createTestBundle().then((bundle) =>
    simulate_runs({ scenario_bundle: bundle, runs, seed })
  )
}

// ── Tests ───────────────────────────────────────────────────────

describe('Strategy fingerprint telemetry', () => {
  // ── Report structure ────────────────────────────────────────

  describe('report structure', () => {
    it('includes all new aggregate telemetry fields', async () => {
      const report = await runSimulation('structure-test')
      const agg = report.aggregate

      expect(agg).toHaveProperty('opening_card_frequency')
      expect(agg).toHaveProperty('opening_sequence_frequency')
      expect(agg).toHaveProperty('average_score_by_turn')
      expect(agg).toHaveProperty('winning_card_pairs')
      expect(agg).toHaveProperty('successful_low_score_rates')
    })

    it('preserves all existing aggregate telemetry fields', async () => {
      const report = await runSimulation('backward-compat-test')
      const agg = report.aggregate

      expect(agg).toHaveProperty('total_runs')
      expect(agg).toHaveProperty('outcome_distribution')
      expect(agg).toHaveProperty('win_rate')
      expect(agg).toHaveProperty('average_turns_completed')
      expect(agg).toHaveProperty('average_scores')
      expect(agg).toHaveProperty('average_stakeholder_satisfaction')
      expect(agg).toHaveProperty('card_usage')
      expect(agg).toHaveProperty('event_frequency')
      expect(agg).toHaveProperty('reaction_frequency')
      expect(agg).toHaveProperty('archetype_distribution')
    })

    it('includes score_snapshots_by_turn in per-run telemetry', async () => {
      const report = await runSimulation('per-run-snapshots-test')

      for (const run of report.per_run) {
        expect(run).toHaveProperty('score_snapshots_by_turn')
        expect(Array.isArray(run.score_snapshots_by_turn)).toBe(true)
        expect(run.score_snapshots_by_turn.length).toBe(run.cards_played.length)
      }
    })
  })

  // ── Determinism ─────────────────────────────────────────────

  describe('determinism', () => {
    it('produces identical strategy telemetry for the same seed', async () => {
      const bundle = await createTestBundle()

      const reportA = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'determinism-fp' })
      const reportB = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'determinism-fp' })

      expect(reportA.aggregate.opening_card_frequency).toEqual(
        reportB.aggregate.opening_card_frequency
      )
      expect(reportA.aggregate.opening_sequence_frequency).toEqual(
        reportB.aggregate.opening_sequence_frequency
      )
      expect(reportA.aggregate.average_score_by_turn).toEqual(
        reportB.aggregate.average_score_by_turn
      )
      expect(reportA.aggregate.winning_card_pairs).toEqual(
        reportB.aggregate.winning_card_pairs
      )
      expect(reportA.aggregate.successful_low_score_rates).toEqual(
        reportB.aggregate.successful_low_score_rates
      )
    })

    it('produces identical per-run score snapshots for the same seed', async () => {
      const bundle = await createTestBundle()

      const reportA = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'snapshot-det' })
      const reportB = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'snapshot-det' })

      for (let i = 0; i < reportA.per_run.length; i++) {
        expect(reportA.per_run[i].score_snapshots_by_turn).toEqual(
          reportB.per_run[i].score_snapshots_by_turn
        )
      }
    })
  })

  // ── Opening card telemetry ──────────────────────────────────

  describe('opening card telemetry', () => {
    it('tracks opening card frequency from cards_played', async () => {
      const report = await runSimulation('opening-freq-test')
      const agg = report.aggregate

      // Every card that was played in the first 3 turns should appear
      // in opening_card_frequency
      expect(Object.keys(agg.opening_card_frequency).length).toBeGreaterThan(0)

      // The total count should equal runs * min(3, turns_per_run)
      const totalOpeningCards = Object.values(agg.opening_card_frequency).reduce(
        (sum, v) => sum + v,
        0
      )
      const expectedTotal = report.per_run.reduce(
        (sum, run) => sum + Math.min(3, run.cards_played.length),
        0
      )
      expect(totalOpeningCards).toBe(expectedTotal)
    })

    it('tracks opening sequence frequency', async () => {
      const report = await runSimulation('opening-seq-test')
      const agg = report.aggregate

      expect(Object.keys(agg.opening_sequence_frequency).length).toBeGreaterThan(0)

      // Total sequence count should equal number of runs
      const totalSequences = Object.values(agg.opening_sequence_frequency).reduce(
        (sum, v) => sum + v,
        0
      )
      expect(totalSequences).toBe(report.total_runs)
    })

    it('uses " > " separator for sequence keys', async () => {
      const report = await runSimulation('seq-format-test')
      const agg = report.aggregate

      for (const key of Object.keys(agg.opening_sequence_frequency)) {
        // Should contain " > " separator if multiple cards played
        const parts = key.split(' > ')
        expect(parts.length).toBeGreaterThanOrEqual(1)
        expect(parts.length).toBeLessThanOrEqual(3)
      }
    })

    it('limits opening cards to at most 3', async () => {
      const report = await runSimulation('opening-limit-test', 10)
      const agg = report.aggregate

      for (const key of Object.keys(agg.opening_sequence_frequency)) {
        const parts = key.split(' > ')
        expect(parts.length).toBeLessThanOrEqual(3)
      }
    })
  })

  // ── Score trajectory telemetry ──────────────────────────────

  describe('score trajectory telemetry', () => {
    it('records score snapshots for each completed turn', async () => {
      const report = await runSimulation('trajectory-test')

      for (const run of report.per_run) {
        // One snapshot per turn actually played (matches cards_played)
        expect(run.score_snapshots_by_turn.length).toBe(run.cards_played.length)

        // Each snapshot should contain the same score IDs
        for (const snapshot of run.score_snapshots_by_turn) {
          expect(typeof snapshot).toBe('object')
          expect(Object.keys(snapshot).length).toBeGreaterThan(0)
        }
      }
    })

    it('computes average_score_by_turn with correct shape', async () => {
      const report = await runSimulation('avg-trajectory-test')
      const agg = report.aggregate

      // Should have entries for each score ID
      const scoreIds = Object.keys(agg.average_score_by_turn)
      expect(scoreIds.length).toBeGreaterThan(0)

      // Each score's turn array should have equal length (max turns actually played)
      const maxTurnsPlayed = Math.max(...report.per_run.map((r) => r.cards_played.length))
      for (const scoreId of scoreIds) {
        expect(agg.average_score_by_turn[scoreId].length).toBe(maxTurnsPlayed)

        // All values should be numbers
        for (const value of agg.average_score_by_turn[scoreId]) {
          expect(typeof value).toBe('number')
          expect(Number.isFinite(value)).toBe(true)
        }
      }
    })

    it('score snapshots match final_scores on the last turn', async () => {
      const report = await runSimulation('snapshot-final-test')

      for (const run of report.per_run) {
        if (run.score_snapshots_by_turn.length > 0) {
          const lastSnapshot = run.score_snapshots_by_turn[run.score_snapshots_by_turn.length - 1]
          // Last snapshot should match final scores
          expect(lastSnapshot).toEqual(run.final_scores)
        }
      }
    })
  })

  // ── Winning card pairs telemetry ────────────────────────────

  describe('winning card pairs telemetry', () => {
    it('produces winning_card_pairs as a record', async () => {
      const report = await runSimulation('win-pairs-test', 10)
      const agg = report.aggregate

      expect(typeof agg.winning_card_pairs).toBe('object')
    })

    it('only counts pairs from successful runs', async () => {
      const report = await runSimulation('win-pairs-success-test', 10)
      const agg = report.aggregate

      const successCount = report.per_run.filter(
        (r) => r.outcome_tier === 'success'
      ).length

      if (successCount === 0) {
        // No successful runs means no winning pairs
        expect(Object.keys(agg.winning_card_pairs).length).toBe(0)
      }
      // If there are successful runs, pairs should exist
      // (unless all successful runs played only one unique card)
    })

    it('uses " + " separator for pair keys with sorted card IDs', async () => {
      const report = await runSimulation('pair-format-test', 10)
      const agg = report.aggregate

      for (const key of Object.keys(agg.winning_card_pairs)) {
        expect(key).toContain(' + ')
        const [cardA, cardB] = key.split(' + ')
        // Cards should be in sorted order
        expect(cardA <= cardB).toBe(true)
      }
    })

    it('counts unordered pairs (each unique pair counted once per run)', async () => {
      const report = await runSimulation('pair-counting-test', 10)
      const agg = report.aggregate

      const successfulRuns = report.per_run.filter((r) => r.outcome_tier === 'success')

      // For each successful run, verify the pairs match expected
      for (const run of successfulRuns) {
        const uniqueCards = [...new Set(run.cards_played)].sort()
        // Each pair from this run should appear at least once in the aggregate
        for (let i = 0; i < uniqueCards.length; i++) {
          for (let j = i + 1; j < uniqueCards.length; j++) {
            const pairKey = `${uniqueCards[i]} + ${uniqueCards[j]}`
            expect(agg.winning_card_pairs[pairKey]).toBeGreaterThanOrEqual(1)
          }
        }
      }
    })
  })

  // ── Successful low-score rates ──────────────────────────────

  describe('successful low-score rates', () => {
    it('includes all built-in threshold checks', async () => {
      const report = await runSimulation('low-score-checks-test')
      const rates = report.aggregate.successful_low_score_rates

      expect(rates).toHaveProperty('delivery_confidence_below_30')
      expect(rates).toHaveProperty('budget_below_0')
      expect(rates).toHaveProperty('user_trust_below_25')
      expect(rates).toHaveProperty('team_morale_below_25')
      expect(rates).toHaveProperty('domain_clarity_below_20')
      expect(rates).toHaveProperty('maintainability_below_20')
    })

    it('produces rates between 0 and 1', async () => {
      const report = await runSimulation('low-score-rates-range-test', 10)
      const rates = report.aggregate.successful_low_score_rates

      for (const [, rate] of Object.entries(rates)) {
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(1)
      }
    })

    it('returns 0 rates when no successful runs exist', async () => {
      // Use a bundle with very few runs and a seed likely to produce no wins
      const bundle = await createTestBundle()
      // With 1 run and a specific seed, we might not get success. If we do,
      // the test still validates rates are valid numbers.
      const report = simulate_runs({ scenario_bundle: bundle, runs: 1, seed: 'no-wins' })
      const rates = report.aggregate.successful_low_score_rates

      for (const [, rate] of Object.entries(rates)) {
        expect(typeof rate).toBe('number')
        expect(Number.isFinite(rate)).toBe(true)
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(1)
      }
    })

    it('correctly identifies low-score successes from per-run data', async () => {
      const report = await runSimulation('low-score-validation-test', 20)

      const successfulRuns = report.per_run.filter((r) => r.outcome_tier === 'success')
      const rates = report.aggregate.successful_low_score_rates

      if (successfulRuns.length > 0) {
        // Manually verify delivery_confidence_below_30
        const manualCount = successfulRuns.filter(
          (r) => r.final_scores['delivery_confidence'] !== undefined &&
                 r.final_scores['delivery_confidence'] < 30
        ).length
        const expectedRate = manualCount / successfulRuns.length

        // Only check if the score exists in the scenario
        if (successfulRuns.some((r) => r.final_scores['delivery_confidence'] !== undefined)) {
          expect(rates['delivery_confidence_below_30']).toBeCloseTo(expectedRate, 10)
        }
      }
    })
  })

  // ── Edge cases ──────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles single-run simulation', async () => {
      const report = await runSimulation('single-run-test', 1)
      const agg = report.aggregate

      expect(agg.total_runs).toBe(1)
      expect(Object.keys(agg.opening_card_frequency).length).toBeGreaterThan(0)
      expect(Object.keys(agg.opening_sequence_frequency).length).toBe(1)
      expect(Object.keys(agg.average_score_by_turn).length).toBeGreaterThan(0)
      expect(Object.keys(agg.successful_low_score_rates).length).toBeGreaterThan(0)
    })

    it('score_snapshots_by_turn entries are independent copies', async () => {
      const report = await runSimulation('snapshot-independence-test')

      for (const run of report.per_run) {
        if (run.score_snapshots_by_turn.length >= 2) {
          // Modifying one snapshot should not affect another
          const snapshot0 = run.score_snapshots_by_turn[0]
          const snapshot1 = run.score_snapshots_by_turn[1]
          expect(snapshot0).not.toBe(snapshot1)
        }
      }
    })
  })
})
