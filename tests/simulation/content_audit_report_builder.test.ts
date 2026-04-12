import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { buildContentAuditReport } from '@/domains/simulation/services/audit/content_audit_report_builder'
import type { SimulationReport } from '@/domains/simulation/services/simulation_runner'
import { createMockContentProvider } from '../content/test_helpers'

async function createTestBundle() {
  return buildScenarioBundle('test_scenario', 1, createMockContentProvider())
}

describe('buildContentAuditReport', () => {
  it('builds report with expected contract shape', async () => {
    const scenarioBundle = await createTestBundle()
    const simulationReport = simulate_runs({ scenario_bundle: scenarioBundle, runs: 10, seed: 'audit-contract' })

    const report = buildContentAuditReport({
      scenario_bundle: scenarioBundle,
      simulation_report: simulationReport,
      content_pack_id: 'core',
    })

    expect(report.content_pack_id).toBe('core')
    expect(report.scenario_id).toBe(simulationReport.scenario_id)
    expect(report.scenario_version).toBe(simulationReport.scenario_version)
    expect(report.dynamic_metrics.simulation_report).toEqual(simulationReport)
    expect(Array.isArray(report.structural_checks.checks)).toBe(true)
    expect(Array.isArray(report.findings)).toBe(true)
    expect(['pass', 'warning', 'critical']).toContain(report.summary.overall_status)
  })

  it('maps structural findings into structural_checks entries', async () => {
    const scenarioBundle = await createTestBundle()
    const simulationReport = simulate_runs({ scenario_bundle: scenarioBundle, runs: 5, seed: 'audit-structural' })

    const report = buildContentAuditReport({
      scenario_bundle: scenarioBundle,
      simulation_report: simulationReport,
    })

    // The mock test bundle is intentionally sparse and should produce structural warnings.
    expect(report.structural_checks.checks.length).toBeGreaterThan(0)
    expect(report.structural_checks.checks.some(c => c.status === 'warning' || c.status === 'critical')).toBe(true)
  })

  it('sorts findings by severity then id deterministically', () => {
    const synthetic: SimulationReport = {
      scenario_id: 'test',
      scenario_version: 1,
      base_seed: 'seed',
      total_runs: 10,
      per_run: [],
      aggregate: {
        total_runs: 10,
        outcome_distribution: {},
        win_rate: 0.2,
        average_turns_completed: 6,
        average_scores: {},
        average_stakeholder_satisfaction: { cto: 25 },
        card_usage: {},
        event_frequency: {},
        reaction_frequency: {},
        archetype_distribution: {},
        opening_card_frequency: {},
        opening_sequence_frequency: {},
        average_score_by_turn: {},
        average_stakeholder_satisfaction_by_turn: {},
        stakeholder_recovery_rate: { cto: 0.1 },
        stakeholder_decline_rate: { cto: 0.8 },
        rule_trigger_rate_by_stakeholder: {},
        winning_card_pairs: {},
        successful_low_score_rates: {},
      },
    }

    const scenarioBundle = {
      scenario: {
        id: 'test',
        version: 1,
        name: 'Test',
        description: '',
        short_description: '',
        flavor_text: '',
        max_turns: 8,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: [],
        outcome_tier_refs: [],
        outcome_archetype_refs: [],
      },
      scores: new Map(),
      stakeholders: new Map(),
      stakeholder_reaction_rules: new Map(),
      cards: new Map(),
      events: new Map(),
      delayed_effects: new Map(),
      outcome_tiers: new Map(),
      outcome_archetypes: new Map(),
    }

    const first = buildContentAuditReport({ scenario_bundle: scenarioBundle, simulation_report: synthetic })
    const second = buildContentAuditReport({ scenario_bundle: scenarioBundle, simulation_report: synthetic })

    expect(first.findings).toEqual(second.findings)

    const severities = first.findings.map(f => f.severity)
    const firstWarningIdx = severities.findIndex(s => s === 'warning')
    const firstInfoIdx = severities.findIndex(s => s === 'info')
    const lastCriticalIdx = severities.lastIndexOf('critical')

    if (firstWarningIdx !== -1) {
      expect(lastCriticalIdx).toBeLessThan(firstWarningIdx)
    }
    if (firstInfoIdx !== -1 && firstWarningIdx !== -1) {
      expect(firstWarningIdx).toBeLessThan(firstInfoIdx)
    }
  })

  it('computes summary counters and overall status from findings', () => {
    const synthetic: SimulationReport = {
      scenario_id: 'test',
      scenario_version: 1,
      base_seed: 'seed',
      total_runs: 10,
      per_run: [],
      aggregate: {
        total_runs: 10,
        outcome_distribution: {},
        win_rate: 0.3,
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
        stakeholder_recovery_rate: { cto: 0.1 },
        stakeholder_decline_rate: { cto: 0.75 },
        rule_trigger_rate_by_stakeholder: {},
        winning_card_pairs: {},
        successful_low_score_rates: {},
      },
    }

    const scenarioBundle = {
      scenario: {
        id: 'test',
        version: 1,
        name: 'Test',
        description: '',
        short_description: '',
        flavor_text: '',
        max_turns: 8,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: [],
        outcome_tier_refs: [],
        outcome_archetype_refs: [],
      },
      scores: new Map(),
      stakeholders: new Map(),
      stakeholder_reaction_rules: new Map(),
      cards: new Map(),
      events: new Map(),
      delayed_effects: new Map(),
      outcome_tiers: new Map(),
      outcome_archetypes: new Map(),
    }

    const report = buildContentAuditReport({ scenario_bundle: scenarioBundle, simulation_report: synthetic })

    expect(report.summary.critical_count).toBeGreaterThan(0)
    expect(report.summary.overall_status).toBe('critical')
    expect(report.summary.info_count + report.summary.warning_count + report.summary.critical_count).toBe(report.findings.length)
  })
})
