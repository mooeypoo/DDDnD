import { describe, expect, it } from 'vitest'
import { buildContentAuditReport } from '@/domains/simulation/services/audit/content_audit_report_builder'
import {
  auditCatalogOnlyRecovery,
  CATALOG_ONLY_RECOVERY_WIN_RATE_GAP
} from '@/domains/simulation/services/audit/catalog_only_recovery_audit'
import type { SimulationReport } from '@/domains/simulation/services/simulation_runner'

function emptyAggregate(winRate: number): SimulationReport['aggregate'] {
  return {
    total_runs: 20,
    outcome_distribution: {},
    win_rate: winRate,
    average_turns_completed: 8,
    average_scores: {},
    average_stakeholder_satisfaction: {
      cto: 50,
      vp_product: 50,
      operations_manager: 50,
      lead_developer: 50
    },
    card_usage: {},
    event_frequency: {},
    reaction_frequency: {},
    archetype_distribution: {},
    opening_card_frequency: {},
    opening_sequence_frequency: {},
    average_score_by_turn: {},
    average_stakeholder_satisfaction_by_turn: {},
    stakeholder_recovery_rate: {},
    stakeholder_decline_rate: {},
    rule_trigger_rate_by_stakeholder: {},
    winning_card_pairs: {},
    successful_low_score_rates: {}
  }
}

function report(winRate: number, playPolicy: 'player_true' | 'full_pool_oracle'): SimulationReport {
  return {
    scenario_id: 'monolith_of_mild_despair',
    scenario_version: 1,
    base_seed: 'catalog-recovery',
    play_policy: playPolicy,
    total_runs: 20,
    per_run: [],
    aggregate: emptyAggregate(winRate)
  }
}

const sparseBundle = {
  scenario: {
    id: 'monolith_of_mild_despair',
    version: 1,
    name: 'Monolith',
    description: '',
    short_description: '',
    flavor_text: '',
    max_turns: 10,
    starting_scores: {},
    score_refs: [],
    stakeholder_refs: [],
    card_refs: [],
    event_refs: [],
    outcome_tier_refs: [],
    outcome_archetype_refs: []
  },
  scores: new Map(),
  stakeholders: new Map(),
  stakeholder_reaction_rules: new Map(),
  cards: new Map(),
  events: new Map(),
  delayed_effects: new Map(),
  outcome_tiers: new Map(),
  outcome_archetypes: new Map()
}

describe('Catalog-only recovery diagnostic', () => {
  it('emits an info finding when the oracle wins substantially more often', () => {
    const findings = auditCatalogOnlyRecovery(report(0.30, 'player_true'), report(0.55, 'full_pool_oracle'))

    expect(CATALOG_ONLY_RECOVERY_WIN_RATE_GAP).toBe(0.15)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('info')
    expect(findings[0].category).toBe('card_ecosystem')
    expect(findings[0].id).toBe('card_ecosystem.catalog_only_recovery.monolith_of_mild_despair')
    expect(findings[0].recommended_fix_surface).toBe('content')
  })

  it('does not emit when the gap is below the diagnostic threshold', () => {
    const findings = auditCatalogOnlyRecovery(report(0.50, 'player_true'), report(0.58, 'full_pool_oracle'))
    expect(findings).toEqual([])
  })

  it('does not use the oracle report as the pass-gate win-rate check', () => {
    const auditReport = buildContentAuditReport({
      scenario_bundle: sparseBundle as never,
      simulation_report: report(0.50, 'player_true'),
      oracle_simulation_report: report(0.95, 'full_pool_oracle')
    })

    expect(auditReport.dynamic_metrics.simulation_report.aggregate.win_rate).toBe(0.5)
    expect(auditReport.dynamic_metrics.oracle_simulation_report?.aggregate.win_rate).toBe(0.95)
    expect(
      auditReport.findings.some((finding) => finding.id.includes('win_rate_too_high'))
    ).toBe(false)
    expect(
      auditReport.findings.some((finding) => finding.id.includes('catalog_only_recovery'))
    ).toBe(true)
    expect(
      auditReport.findings.find((finding) => finding.id.includes('catalog_only_recovery'))?.severity
    ).toBe('info')
    expect(auditReport.summary.overall_status).not.toBe('critical')
  })

  it('skips the diagnostic when no oracle report is provided', () => {
    const auditReport = buildContentAuditReport({
      scenario_bundle: sparseBundle as never,
      simulation_report: report(0.20, 'player_true')
    })

    expect(auditReport.dynamic_metrics.oracle_simulation_report).toBeUndefined()
    expect(
      auditReport.findings.some((finding) => finding.id.includes('catalog_only_recovery'))
    ).toBe(false)
  })
})
