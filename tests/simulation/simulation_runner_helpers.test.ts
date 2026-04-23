/**
 * Simulation Runner Helper Tests
 *
 * Verifies extracted pure helper behavior for deterministic seed derivation,
 * delta-map folding, and aggregate telemetry shaping.
 */

import { describe, expect, it } from 'vitest'

import type {
  ActionTurnTelemetry,
  EventTurnTelemetry,
  PerRunTelemetry,
  StakeholderTurnTelemetry,
} from '@/domains/simulation/services/simulation_runner'
import {
  average,
  buildScoreDeltaMap,
  buildStakeholderDeltaMap,
  computeAggregate,
  deriveRunSeed,
} from '@/domains/simulation/services/simulation_runner_helpers'

function buildStakeholderTurnTelemetry(
  turn: number,
  satisfaction: Record<string, number>,
  delta: Record<string, number>,
  rules: Record<string, string[]>
): StakeholderTurnTelemetry {
  return {
    turn_number: turn,
    satisfaction_by_stakeholder: satisfaction,
    delta_by_stakeholder: delta,
    matched_reaction_rule_ids_by_stakeholder: rules,
  }
}

function buildEventTurnTelemetry(
  turn: number,
  eventId: string | null,
  scoreDeltas: Record<string, number>,
  stakeholderDeltas: Record<string, number>
): EventTurnTelemetry {
  return {
    turn_number: turn,
    triggered_event_id: eventId,
    score_deltas: scoreDeltas,
    stakeholder_deltas: stakeholderDeltas,
  }
}

function buildActionTurnTelemetry(
  turn: number,
  cardId: string,
  scoreDeltas: Record<string, number>,
  stakeholderDeltas: Record<string, number>
): ActionTurnTelemetry {
  return {
    turn_number: turn,
    selected_card_id: cardId,
    score_deltas: scoreDeltas,
    stakeholder_deltas: stakeholderDeltas,
  }
}

function buildRunTelemetry(overrides: Partial<PerRunTelemetry>): PerRunTelemetry {
  return {
    run_index: 0,
    seed: 'seed',
    outcome_tier: 'success',
    archetype: 'system_stabilizer',
    run_status: 'completed',
    turns_completed: 2,
    max_turns: 3,
    final_scores: {
      delivery_confidence: 40,
      budget: 10,
      user_trust: 30,
      team_morale: 35,
      domain_clarity: 25,
      maintainability: 20,
    },
    final_stakeholder_satisfaction: {
      tech_lead: 55,
    },
    cards_played: ['card_a', 'card_b', 'card_c'],
    events_triggered: ['event_a'],
    reactions_triggered: ['rule_alpha'],
    score_average: 30,
    score_snapshots_by_turn: [
      {
        delivery_confidence: 35,
        budget: 15,
      },
      {
        delivery_confidence: 40,
        budget: 10,
      },
    ],
    stakeholder_telemetry_by_turn: [
      buildStakeholderTurnTelemetry(
        1,
        { tech_lead: 52 },
        { tech_lead: 2 },
        { tech_lead: ['rule_alpha'] }
      ),
      buildStakeholderTurnTelemetry(
        2,
        { tech_lead: 55 },
        { tech_lead: 3 },
        { tech_lead: ['rule_alpha'] }
      ),
    ],
    event_telemetry_by_turn: [
      buildEventTurnTelemetry(1, 'event_a', { budget: -2 }, { tech_lead: -1 }),
      buildEventTurnTelemetry(2, null, {}, {}),
    ],
    action_telemetry_by_turn: [
      buildActionTurnTelemetry(1, 'card_a', { delivery_confidence: 1 }, { tech_lead: 1 }),
      buildActionTurnTelemetry(2, 'card_b', { delivery_confidence: 2 }, { tech_lead: 2 }),
    ],
    ...overrides,
  }
}

describe('simulation_runner_helpers', () => {
  describe('deriveRunSeed', () => {
    it('derives deterministic child seed format', () => {
      expect(deriveRunSeed('base-seed', 0)).toBe('base-seed__run_0')
      expect(deriveRunSeed('base-seed', 12)).toBe('base-seed__run_12')
    })
  })

  describe('average', () => {
    it('returns zero for empty arrays', () => {
      expect(average([])).toBe(0)
    })

    it('returns arithmetic mean for non-empty arrays', () => {
      expect(average([2, 4, 6])).toBe(4)
      expect(average([1, 2])).toBe(1.5)
    })
  })

  describe('delta map builders', () => {
    it('aggregates score deltas by score id', () => {
      const map = buildScoreDeltaMap([
        { score_id: 'budget', delta: -2 },
        { score_id: 'budget', delta: 5 },
        { score_id: 'delivery_confidence', delta: 3 },
      ])

      expect(map).toEqual({
        budget: 3,
        delivery_confidence: 3,
      })
    })

    it('aggregates stakeholder deltas by stakeholder id', () => {
      const map = buildStakeholderDeltaMap([
        { stakeholder_id: 'tech_lead', delta: 1 },
        { stakeholder_id: 'tech_lead', delta: -4 },
        { stakeholder_id: 'finance', delta: 2 },
      ])

      expect(map).toEqual({
        tech_lead: -3,
        finance: 2,
      })
    })
  })

  describe('computeAggregate', () => {
    it('computes opening telemetry, usage frequencies, and rates across runs', () => {
      const runA = buildRunTelemetry({
        run_index: 0,
        seed: 'seed__run_0',
        outcome_tier: 'success',
        cards_played: ['card_a', 'card_b', 'card_c', 'card_d'],
        reactions_triggered: ['rule_alpha', 'rule_beta'],
      })

      const runB = buildRunTelemetry({
        run_index: 1,
        seed: 'seed__run_1',
        outcome_tier: 'partial_success',
        archetype: 'firefighter',
        cards_played: ['card_a', 'card_x'],
        events_triggered: ['event_b'],
        reactions_triggered: ['rule_beta'],
        final_scores: {
          delivery_confidence: 20,
          budget: -5,
          user_trust: 20,
          team_morale: 20,
          domain_clarity: 15,
          maintainability: 10,
        },
        stakeholder_telemetry_by_turn: [
          buildStakeholderTurnTelemetry(
            1,
            { tech_lead: 50 },
            { tech_lead: -2 },
            { tech_lead: ['rule_beta'] }
          ),
        ],
      })

      const aggregate = computeAggregate([runA, runB])

      expect(aggregate.total_runs).toBe(2)
      expect(aggregate.outcome_distribution).toEqual({ success: 1, partial_success: 1 })
      expect(aggregate.win_rate).toBe(0.5)

      expect(aggregate.opening_card_frequency.card_a).toBe(2)
      expect(aggregate.opening_sequence_frequency['card_a > card_b > card_c']).toBe(1)
      expect(aggregate.opening_sequence_frequency['card_a > card_x']).toBe(1)

      expect(aggregate.card_usage.card_a).toBe(2)
      expect(aggregate.event_frequency.event_a).toBe(1)
      expect(aggregate.event_frequency.event_b).toBe(1)
      expect(aggregate.reaction_frequency.rule_beta).toBe(2)

      expect(aggregate.average_scores.delivery_confidence).toBe(30)
      expect(aggregate.average_stakeholder_satisfaction.tech_lead).toBe(55)

      expect(aggregate.average_score_by_turn.delivery_confidence.length).toBe(2)
      expect(aggregate.average_stakeholder_satisfaction_by_turn.tech_lead[0]).toBe(51)

      expect(aggregate.stakeholder_recovery_rate.tech_lead).toBeGreaterThanOrEqual(0)
      expect(aggregate.stakeholder_decline_rate.tech_lead).toBeGreaterThanOrEqual(0)
      expect(aggregate.rule_trigger_rate_by_stakeholder.tech_lead.rule_alpha).toBeGreaterThan(0)

      expect(aggregate.winning_card_pairs['card_a + card_b']).toBe(1)
      expect(aggregate.successful_low_score_rates.delivery_confidence_below_30).toBe(0)
    })

    it('returns zero successful low-score rates when there are no successful runs', () => {
      const run = buildRunTelemetry({
        outcome_tier: 'failure',
        cards_played: ['card_a'],
      })

      const aggregate = computeAggregate([run])

      expect(aggregate.win_rate).toBe(0)
      expect(aggregate.successful_low_score_rates).toEqual({
        delivery_confidence_below_30: 0,
        budget_below_0: 0,
        user_trust_below_25: 0,
        team_morale_below_25: 0,
        domain_clarity_below_20: 0,
        maintainability_below_20: 0,
      })
    })

    it('handles empty per-run arrays', () => {
      const aggregate = computeAggregate([])

      expect(aggregate.total_runs).toBe(0)
      expect(aggregate.win_rate).toBe(0)
      expect(aggregate.average_turns_completed).toBe(0)
      expect(aggregate.outcome_distribution).toEqual({})
      expect(aggregate.average_scores).toEqual({})
      expect(aggregate.average_stakeholder_satisfaction).toEqual({})
      expect(aggregate.card_usage).toEqual({})
      expect(aggregate.event_frequency).toEqual({})
      expect(aggregate.reaction_frequency).toEqual({})
      expect(aggregate.archetype_distribution).toEqual({})
      expect(aggregate.opening_card_frequency).toEqual({})
      expect(aggregate.opening_sequence_frequency).toEqual({})
      expect(aggregate.average_score_by_turn).toEqual({})
      expect(aggregate.average_stakeholder_satisfaction_by_turn).toEqual({})
      expect(aggregate.stakeholder_recovery_rate).toEqual({})
      expect(aggregate.stakeholder_decline_rate).toEqual({})
      expect(aggregate.rule_trigger_rate_by_stakeholder).toEqual({})
      expect(aggregate.winning_card_pairs).toEqual({})
      expect(aggregate.successful_low_score_rates).toEqual({
        delivery_confidence_below_30: 0,
        budget_below_0: 0,
        user_trust_below_25: 0,
        team_morale_below_25: 0,
        domain_clarity_below_20: 0,
        maintainability_below_20: 0,
      })
    })
  })
})
