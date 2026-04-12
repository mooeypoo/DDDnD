import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { auditStakeholderBalance } from '@/domains/simulation/services/audit/stakeholder_balance_audit'
import { createMockContentProvider } from '../content/test_helpers'
import type { SimulationReport } from '@/domains/simulation/services/simulation_runner'

async function createTestBundle() {
  return buildScenarioBundle('test_scenario', 1, createMockContentProvider())
}

function runSimulation(seed: string, runs = 20): Promise<SimulationReport> {
  return createTestBundle().then((bundle) =>
    simulate_runs({ scenario_bundle: bundle, runs, seed })
  )
}

describe('auditStakeholderBalance', () => {
  it('returns an array of AuditFinding objects', async () => {
    const report = await runSimulation('audit-shape')
    const findings = auditStakeholderBalance(report)

    expect(Array.isArray(findings)).toBe(true)
    for (const finding of findings) {
      expect(typeof finding.id).toBe('string')
      expect(['info', 'warning', 'critical']).toContain(finding.severity)
      expect(finding.category).toBe('stakeholder_balance')
      expect(typeof finding.title).toBe('string')
      expect(typeof finding.description).toBe('string')
      expect(Array.isArray(finding.evidence)).toBe(true)
      expect(finding.recommended_fix_surface).toBe('content')
    }
  })

  it('emits no findings for a healthy synthetic report', () => {
    const healthyReport: SimulationReport = {
      scenario_id: 'test',
      scenario_version: 1,
      base_seed: 'healthy',
      total_runs: 10,
      per_run: [],
      aggregate: {
        total_runs: 10,
        outcome_distribution: {},
        win_rate: 0.8,
        average_turns_completed: 6,
        average_scores: {},
        average_stakeholder_satisfaction: {
          cto: 72,
          finance_team: 68,
        },
        card_usage: {},
        event_frequency: {},
        reaction_frequency: {},
        archetype_distribution: {},
        opening_card_frequency: {},
        opening_sequence_frequency: {},
        average_score_by_turn: {},
        average_stakeholder_satisfaction_by_turn: {},
        stakeholder_recovery_rate: { cto: 0.55, finance_team: 0.50 },
        stakeholder_decline_rate: { cto: 0.30, finance_team: 0.35 },
        rule_trigger_rate_by_stakeholder: {},
        winning_card_pairs: {},
        successful_low_score_rates: {},
      },
    }

    const findings = auditStakeholderBalance(healthyReport)
    expect(findings).toHaveLength(0)
  })

  it('emits a critical finding when decline rate is very high', () => {
    const report: SimulationReport = {
      scenario_id: 'test',
      scenario_version: 1,
      base_seed: 'unbalanced',
      total_runs: 10,
      per_run: [],
      aggregate: {
        total_runs: 10,
        outcome_distribution: {},
        win_rate: 0.2,
        average_turns_completed: 6,
        average_scores: {},
        average_stakeholder_satisfaction: { cto: 28 },
        card_usage: {},
        event_frequency: {},
        reaction_frequency: {},
        archetype_distribution: {},
        opening_card_frequency: {},
        opening_sequence_frequency: {},
        average_score_by_turn: {},
        average_stakeholder_satisfaction_by_turn: {},
        stakeholder_recovery_rate: { cto: 0.08 },
        stakeholder_decline_rate: { cto: 0.80 },
        rule_trigger_rate_by_stakeholder: {},
        winning_card_pairs: {},
        successful_low_score_rates: {},
      },
    }

    const findings = auditStakeholderBalance(report)

    const criticalDecline = findings.find(f => f.id.includes('high_decline_rate.critical.cto'))
    expect(criticalDecline).toBeDefined()
    expect(criticalDecline!.severity).toBe('critical')

    const criticalSatisfaction = findings.find(f => f.id.includes('low_satisfaction.critical.cto'))
    expect(criticalSatisfaction).toBeDefined()
    expect(criticalSatisfaction!.severity).toBe('critical')
  })

  it('emits a warning finding when decline rate is elevated', () => {
    const report: SimulationReport = {
      scenario_id: 'test',
      scenario_version: 1,
      base_seed: 'elevated',
      total_runs: 10,
      per_run: [],
      aggregate: {
        total_runs: 10,
        outcome_distribution: {},
        win_rate: 0.4,
        average_turns_completed: 6,
        average_scores: {},
        average_stakeholder_satisfaction: { cto: 48 },
        card_usage: {},
        event_frequency: {},
        reaction_frequency: {},
        archetype_distribution: {},
        opening_card_frequency: {},
        opening_sequence_frequency: {},
        average_score_by_turn: {},
        average_stakeholder_satisfaction_by_turn: {},
        stakeholder_recovery_rate: { cto: 0.22 },
        stakeholder_decline_rate: { cto: 0.62 },
        rule_trigger_rate_by_stakeholder: {},
        winning_card_pairs: {},
        successful_low_score_rates: {},
      },
    }

    const findings = auditStakeholderBalance(report)

    const warningDecline = findings.find(f => f.id.includes('high_decline_rate.warning.cto'))
    expect(warningDecline).toBeDefined()
    expect(warningDecline!.severity).toBe('warning')
  })

  it('emits an asymmetry finding when decline/recovery ratio is extreme', () => {
    const report: SimulationReport = {
      scenario_id: 'test',
      scenario_version: 1,
      base_seed: 'asymmetric',
      total_runs: 10,
      per_run: [],
      aggregate: {
        total_runs: 10,
        outcome_distribution: {},
        win_rate: 0.3,
        average_turns_completed: 6,
        average_scores: {},
        average_stakeholder_satisfaction: { cto: 50 },
        card_usage: {},
        event_frequency: {},
        reaction_frequency: {},
        archetype_distribution: {},
        opening_card_frequency: {},
        opening_sequence_frequency: {},
        average_score_by_turn: {},
        average_stakeholder_satisfaction_by_turn: {},
        stakeholder_recovery_rate: { cto: 0.10 },
        stakeholder_decline_rate: { cto: 0.60 },
        rule_trigger_rate_by_stakeholder: {},
        winning_card_pairs: {},
        successful_low_score_rates: {},
      },
    }

    const findings = auditStakeholderBalance(report)
    const asymmetry = findings.find(f => f.id.includes('asymmetric_ratio.cto'))
    expect(asymmetry).toBeDefined()
    expect(asymmetry!.severity).toBe('warning')
  })

  it('produces findings deterministically for the same report', async () => {
    const report = await runSimulation('audit-det', 15)
    const first = auditStakeholderBalance(report)
    const second = auditStakeholderBalance(report)
    expect(first).toEqual(second)
  })
})
