import { describe, expect, it } from 'vitest'
import type { AuditFinding } from '@/domains/simulation/services/content_audit_contract'
import type { SimulationReport } from '@/domains/simulation/services/simulation_runner'
import { auditScenarioBalanceTargets } from '@/domains/simulation/services/audit/scenario_balance_targets_audit'
import { BASE_BALANCE_TARGETS } from '../support/base_balance_targets'

const MONOLITH = BASE_BALANCE_TARGETS.monolith_of_mild_despair

function makeReport(overrides: Partial<SimulationReport> = {}): SimulationReport {
  return {
    scenario_id: 'monolith_of_mild_despair',
    scenario_version: 1,
    base_seed: 'test',
    total_runs: 100,
    per_run: [],
    aggregate: {
      total_runs: 100,
      outcome_distribution: {},
      win_rate: 0.55,
      average_turns_completed: 8,
      average_scores: {},
      average_stakeholder_satisfaction: {
        cto: 50,
        vp_product: 50,
        operations_manager: 50,
        lead_developer: 50,
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
      successful_low_score_rates: {},
    },
    ...overrides,
  }
}

describe('auditScenarioBalanceTargets', () => {
  it('returns no findings when metrics are within configured target bands', () => {
    const findings = auditScenarioBalanceTargets(makeReport(), [], MONOLITH)
    expect(findings).toHaveLength(0)
  })

  it('flags scenario when win rate is below target minimum', () => {
    const report = makeReport({
      aggregate: {
        ...makeReport().aggregate,
        win_rate: MONOLITH.win_rate_min - 0.05,
      },
    })

    const findings = auditScenarioBalanceTargets(report, [], MONOLITH)
    expect(findings.some(f => f.id === 'scenario_target.win_rate_too_low.monolith_of_mild_despair')).toBe(true)
  })

  it('flags scenario when win rate is above target maximum', () => {
    const report = makeReport({
      aggregate: {
        ...makeReport().aggregate,
        win_rate: MONOLITH.win_rate_max + 0.05,
      },
    })

    const findings = auditScenarioBalanceTargets(report, [], MONOLITH)
    expect(findings.some(f => f.id === 'scenario_target.win_rate_too_high.monolith_of_mild_despair')).toBe(true)
  })

  it('flags when critical findings exceed scenario target', () => {
    const existing: AuditFinding[] = [
      {
        id: 'x',
        severity: 'critical',
        category: 'stakeholder_balance',
        title: 'x',
        description: 'x',
        evidence: [],
        recommended_fix_surface: 'content',
      },
    ]

    const findings = auditScenarioBalanceTargets(makeReport(), existing, MONOLITH)
    expect(findings.some(f => f.id === 'scenario_target.critical_findings_exceeded.monolith_of_mild_despair')).toBe(true)
  })

  it('flags stakeholders below configured satisfaction floors', () => {
    const report = makeReport({
      aggregate: {
        ...makeReport().aggregate,
        average_stakeholder_satisfaction: {
          ...makeReport().aggregate.average_stakeholder_satisfaction,
          vp_product: 35,
        },
      },
    })

    const findings = auditScenarioBalanceTargets(report, [], MONOLITH)
    expect(
      findings.some(
        f => f.id === 'scenario_target.stakeholder_satisfaction_too_low.monolith_of_mild_despair.vp_product',
      ),
    ).toBe(true)
  })

  it("reads the scenario's own targets, not a table keyed by id (ADR 0014)", () => {
    // A community scenario reusing the id gets nothing unless it declares targets
    expect(auditScenarioBalanceTargets(makeReport({ aggregate: { ...makeReport().aggregate, win_rate: 0.01 } }), [], undefined)).toEqual([])
    const own = { win_rate_min: 0, win_rate_max: 0.02, max_critical_findings: 0 }
    expect(auditScenarioBalanceTargets(makeReport({ aggregate: { ...makeReport().aggregate, win_rate: 0.01 } }), [], own)).toEqual([])
  })

  it('returns empty for scenarios without configured targets', () => {
    const report = makeReport({ scenario_id: 'unknown_scenario' })
    const findings = auditScenarioBalanceTargets(report, [], undefined)
    expect(findings).toHaveLength(0)
  })
})

describe('balance targets in content (journal M3.8)', () => {
  it('validation refuses a floor for a stakeholder the scenario lacks, and an upside-down band', async () => {
    const { createEmptyBundle } = await import('@/domains/content/model')
    const { validateScenarioBundle } = await import('@/domains/content/services/bundle_validator')
    const { ContentSchemaError, parseContentEntity } = await import('@/domains/content/validation')
    const scenario = {
      id: 'x', version: 1, name: 'X', description: 'X scenario', max_turns: 4,
      starting_scores: {}, score_refs: [], stakeholder_refs: [{ id: 'cto', version: 1 }], card_refs: [], event_refs: [],
    }
    const bundle = createEmptyBundle({ ...scenario, balance_targets: { win_rate_min: 0.2, win_rate_max: 0.5, max_critical_findings: 0, min_avg_stakeholder_satisfaction: { ghost: 40 } } })
    expect(validateScenarioBundle(bundle).errors.map((error) => error.type)).toContain('unknown_target_stakeholder')

    let issues: unknown[] = []
    try {
      parseContentEntity('scenarios', { id: 'x', version: 1 }, { ...scenario, balance_targets: { win_rate_min: 0.6, win_rate_max: 0.5, max_critical_findings: 0 } })
    } catch (error) {
      if (error instanceof ContentSchemaError) issues = error.issues
    }
    expect(JSON.stringify(issues)).toMatch(/win_rate_min must not be above win_rate_max/)
  })
})

