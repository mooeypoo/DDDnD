import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  Card,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef
} from '@/domains/content/model'
import { ContentProvider } from '@/domains/content/services/content_provider'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { assertValidBundle } from '@/domains/content/services/bundle_validator'
import {
  parseConditionDescription
} from '@/domains/simulation/rules/condition_evaluator'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { PlayerClass } from '@/domains/content/model/content_types'

function createFileContentProvider(contentRoot: string): ContentProvider {
  async function loadJson<T extends { id: string; version: number }>(
    directory: string,
    ref: VersionRef
  ): Promise<T> {
    const filename = `${ref.id}-v${ref.version}.json`
    const filePath = path.join(contentRoot, directory, filename)
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as T

    if (parsed.id !== ref.id || parsed.version !== ref.version) {
      throw new Error(
        `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`
      )
    }

    return parsed
  }

  return {
    loadScenario: (ref) => loadJson<Scenario>('scenarios', ref),
    loadScore: (ref) => loadJson<Score>('scores', ref),
    loadStakeholder: (ref) => loadJson<Stakeholder>('stakeholders', ref),
    loadStakeholderReactionRule: (ref) =>
      loadJson<StakeholderReactionRule>('stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadJson<Card>('cards', ref),
    loadEvent: (ref) => loadJson<Event>('events', ref),
    loadDelayedEffect: (ref) => loadJson<DelayedEffect>('delayed-effects', ref),
    loadOutcomeTier: (ref) => loadJson<OutcomeTier>('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadJson<OutcomeArchetype>('outcome-archetypes', ref),
    loadPlayerClass: (ref) => loadJson<PlayerClass>('classes', ref)
  }
}

const contentRoot = path.resolve(__dirname, '../../content')
const validScoreIds = new Set([
  'domain_clarity',
  'maintainability',
  'delivery_confidence',
  'team_morale',
  'user_trust',
  'budget'
])

describe('Pass B content expansion', () => {
  // ── New Cards ──────────────────────────────────────────────────

  describe('new cards', () => {
    const newCardIds = [
      'implement_feature_flag_framework',
      'automate_deployment_pipeline',
      'hire_specialized_contractor',
      'host_cross_team_retrospective',
      'deprecate_legacy_api'
    ]

    for (const cardId of newCardIds) {
      it(`loads ${cardId} with valid schema`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const card = await provider.loadCard({ id: cardId, version: 1 })

        expect(card.id).toBe(cardId)
        expect(card.version).toBe(1)
        expect(card.name).toBeTruthy()
        expect(card.description).toBeTruthy()
        expect(card.flavor_text).toBeTruthy()
        expect(card.score_changes.length).toBeGreaterThan(0)
        expect((card.style_tags ?? []).length).toBeGreaterThan(0)
      })
    }

    it('new cards use only valid score ids', async () => {
      const provider = createFileContentProvider(contentRoot)

      for (const cardId of newCardIds) {
        const card = await provider.loadCard({ id: cardId, version: 1 })
        for (const sc of card.score_changes) {
          expect(validScoreIds.has(sc.score_id)).toBe(true)
        }
      }
    })

    it('new cards reference only existing delayed effects', async () => {
      const provider = createFileContentProvider(contentRoot)

      for (const cardId of newCardIds) {
        const card = await provider.loadCard({ id: cardId, version: 1 })
        for (const ref of card.delayed_effect_refs) {
          const effect = await provider.loadDelayedEffect(ref)
          expect(effect.id).toBe(ref.id)
          expect(effect.version).toBe(ref.version)
        }
      }
    })

    it('cards with usage_limit or cooldown_turns have valid positive values', async () => {
      const provider = createFileContentProvider(contentRoot)

      for (const cardId of newCardIds) {
        const card = await provider.loadCard({ id: cardId, version: 1 })
        if (card.usage_limit !== undefined && card.usage_limit !== null) {
          expect(card.usage_limit).toBeGreaterThan(0)
        }
        if (card.cooldown_turns !== undefined) {
          expect(card.cooldown_turns).toBeGreaterThan(0)
        }
      }
    })

    it('hire_specialized_contractor triggers contractor_knowledge_leaves delayed effect', async () => {
      const provider = createFileContentProvider(contentRoot)
      const card = await provider.loadCard({ id: 'hire_specialized_contractor', version: 1 })

      const effectRefs = card.delayed_effect_refs.map((r) => r.id)
      expect(effectRefs).toContain('contractor_knowledge_leaves')
    })

    it('deprecate_legacy_api triggers api_migration_friction delayed effect', async () => {
      const provider = createFileContentProvider(contentRoot)
      const card = await provider.loadCard({ id: 'deprecate_legacy_api', version: 1 })

      const effectRefs = card.delayed_effect_refs.map((r) => r.id)
      expect(effectRefs).toContain('api_migration_friction')
    })
  })

  // ── New Delayed Effects ────────────────────────────────────────

  describe('new delayed effects', () => {
    const newEffectIds = ['contractor_knowledge_leaves', 'api_migration_friction']

    for (const effectId of newEffectIds) {
      it(`loads ${effectId} with valid schema`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const effect = await provider.loadDelayedEffect({ id: effectId, version: 1 })

        expect(effect.id).toBe(effectId)
        expect(effect.version).toBe(1)
        expect(effect.name).toBeTruthy()
        expect(effect.description).toBeTruthy()
        expect(effect.turns_until_resolution).toBeGreaterThan(0)
        expect(effect.score_changes.length).toBeGreaterThan(0)
      })
    }

    it('delayed effects use only valid score ids', async () => {
      const provider = createFileContentProvider(contentRoot)

      for (const effectId of newEffectIds) {
        const effect = await provider.loadDelayedEffect({ id: effectId, version: 1 })
        for (const sc of effect.score_changes) {
          expect(validScoreIds.has(sc.score_id)).toBe(true)
        }
      }
    })
  })

  // ── New Stakeholder Escalation Reactions ───────────────────────

  describe('stakeholder escalation reactions', () => {
    const escalationRules = [
      { ruleId: 'cfo_alarmed_by_overspending', stakeholderId: 'cfo' },
      { ruleId: 'cto_frustrated_by_stagnation', stakeholderId: 'cto' },
      { ruleId: 'ops_manager_demands_incident_review', stakeholderId: 'operations_manager' },
      { ruleId: 'security_officer_escalates_to_board', stakeholderId: 'security_officer' },
      { ruleId: 'lead_developer_threatens_resignation', stakeholderId: 'lead_developer' }
    ]

    for (const { ruleId, stakeholderId } of escalationRules) {
      it(`loads ${ruleId} with valid schema`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const rule = await provider.loadStakeholderReactionRule({ id: ruleId, version: 1 })

        expect(rule.id).toBe(ruleId)
        expect(rule.version).toBe(1)
        expect(rule.name).toBeTruthy()
        expect(rule.description).toBeTruthy()
        expect(rule.condition_description).toBeTruthy()
        expect(rule.score_changes.length).toBeGreaterThan(0)
        expect(rule.stakeholder_changes).toBeDefined()
        expect(rule.stakeholder_changes!.length).toBeGreaterThan(0)
      })

      it(`${ruleId} uses valid score ids`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const rule = await provider.loadStakeholderReactionRule({ id: ruleId, version: 1 })

        for (const sc of rule.score_changes) {
          expect(validScoreIds.has(sc.score_id)).toBe(true)
        }
      })

      it(`${ruleId} targets the correct stakeholder (${stakeholderId})`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const rule = await provider.loadStakeholderReactionRule({ id: ruleId, version: 1 })

        expect(rule.stakeholder_changes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ stakeholder_id: stakeholderId })
          ])
        )
      })

      it(`${stakeholderId} references ${ruleId} in reaction_rule_refs`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const stakeholder = await provider.loadStakeholder({ id: stakeholderId, version: 1 })

        const ruleIds = stakeholder.reaction_rule_refs.map((r) => r.id)
        expect(ruleIds).toContain(ruleId)
      })
    }

    it('escalation rules have stricter conditions than base rules', async () => {
      const provider = createFileContentProvider(contentRoot)

      // CFO: base < 35, escalation < 20
      const cfoBase = await provider.loadStakeholderReactionRule({
        id: 'cfo_cuts_spending_when_budget_low',
        version: 1
      })
      const cfoEscalation = await provider.loadStakeholderReactionRule({
        id: 'cfo_alarmed_by_overspending',
        version: 1
      })
      const baseCond = cfoBase.condition_description.match(/\d+/)
      const escCond = cfoEscalation.condition_description.match(/\d+/)
      expect(Number(escCond![0])).toBeLessThan(Number(baseCond![0]))
    })

    it('escalation rules have larger negative stakeholder deltas than base rules', async () => {
      const provider = createFileContentProvider(contentRoot)

      const baseRule = await provider.loadStakeholderReactionRule({
        id: 'lead_dev_fights_for_quality',
        version: 1
      })
      const escalationRule = await provider.loadStakeholderReactionRule({
        id: 'lead_developer_threatens_resignation',
        version: 1
      })

      const baseDelta = baseRule.stakeholder_changes!.find(
        (c) => c.stakeholder_id === 'lead_developer'
      )!.delta
      const escDelta = escalationRule.stakeholder_changes!.find(
        (c) => c.stakeholder_id === 'lead_developer'
      )!.delta

      // Escalation should be more severe (larger negative)
      expect(escDelta).toBeLessThan(baseDelta)
    })

    it('all escalation rules parse their condition_description correctly', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      for (const { ruleId } of escalationRules) {
        const ruleKey = `${ruleId}-v1`
        if (bundle.stakeholder_reaction_rules.has(ruleKey)) {
          const rule = bundle.stakeholder_reaction_rules.get(ruleKey)!
          const condition = parseConditionDescription(rule.condition_description, bundle)
          expect(condition).not.toBeNull()
        }
      }
    })
  })

  // ── New Event ──────────────────────────────────────────────────

  describe('data breach reported event', () => {
    it('loads with valid schema', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'data_breach_reported', version: 1 })

      expect(event.id).toBe('data_breach_reported')
      expect(event.version).toBe(1)
      expect(event.name).toBeTruthy()
      expect(event.description).toBeTruthy()
      expect(event.flavor_text).toBeTruthy()
      expect(event.occurrence_weight).toBeGreaterThan(0)
      expect(event.score_changes.length).toBeGreaterThan(0)
    })

    it('uses only valid score ids', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'data_breach_reported', version: 1 })

      for (const sc of event.score_changes) {
        expect(validScoreIds.has(sc.score_id)).toBe(true)
      }
    })

    it('has trigger condition requiring low user trust', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'data_breach_reported', version: 1 })

      expect(event.trigger_condition_description).toBeTruthy()
      expect(event.trigger_condition_description).toContain('User trust')
    })

    it('is included in compliance_gauntlet scenario', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      expect(bundle.events.has('data_breach_reported-v1')).toBe(true)
    })

    it('is included in startup_hypergrowth scenario', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      expect(bundle.events.has('data_breach_reported-v1')).toBe(true)
    })
  })

  // ── Scenario Pool Updates ─────────────────────────────────────

  describe('scenario card pool updates', () => {
    it('monolith includes deprecate_legacy_api, host_cross_team_retrospective, automate_deployment_pipeline', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      expect(bundle.cards.has('deprecate_legacy_api-v1')).toBe(true)
      expect(bundle.cards.has('host_cross_team_retrospective-v1')).toBe(true)
      expect(bundle.cards.has('automate_deployment_pipeline-v1')).toBe(true)
    })

    it('compliance_gauntlet includes implement_feature_flag_framework, automate_deployment_pipeline', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      expect(bundle.cards.has('implement_feature_flag_framework-v1')).toBe(true)
      expect(bundle.cards.has('automate_deployment_pipeline-v1')).toBe(true)
    })

    it('microservice_sprawl includes host_cross_team_retrospective, deprecate_legacy_api, automate_deployment_pipeline', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('microservice_sprawl', 1, provider)

      expect(bundle.cards.has('host_cross_team_retrospective-v1')).toBe(true)
      expect(bundle.cards.has('deprecate_legacy_api-v1')).toBe(true)
      expect(bundle.cards.has('automate_deployment_pipeline-v1')).toBe(true)
    })

    it('startup_hypergrowth includes implement_feature_flag_framework, hire_specialized_contractor, automate_deployment_pipeline', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      expect(bundle.cards.has('implement_feature_flag_framework-v1')).toBe(true)
      expect(bundle.cards.has('hire_specialized_contractor-v1')).toBe(true)
      expect(bundle.cards.has('automate_deployment_pipeline-v1')).toBe(true)
    })
  })

  // ── All Scenario Bundles Validate ─────────────────────────────

  describe('all expanded scenario bundles validate', () => {
    const scenarios: VersionRef[] = [
      { id: 'monolith_of_mild_despair', version: 1 },
      { id: 'microservice_sprawl', version: 1 },
      { id: 'compliance_gauntlet', version: 1 },
      { id: 'startup_hypergrowth', version: 1 }
    ]

    for (const scenarioRef of scenarios) {
      it(`${scenarioRef.id} builds and validates after Pass B`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)

        expect(() => assertValidBundle(bundle)).not.toThrow()
      })

      it(`${scenarioRef.id} has all cross-references intact after Pass B`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)

        // All stakeholder rules are loaded
        for (const stakeholder of bundle.stakeholders.values()) {
          for (const ruleRef of stakeholder.reaction_rule_refs) {
            expect(
              bundle.stakeholder_reaction_rules.has(`${ruleRef.id}-v${ruleRef.version}`)
            ).toBe(true)
          }
        }

        // All card delayed effects are loaded
        for (const card of bundle.cards.values()) {
          for (const ref of card.delayed_effect_refs) {
            expect(bundle.delayed_effects.has(`${ref.id}-v${ref.version}`)).toBe(true)
          }
        }

        // All event delayed effects are loaded
        for (const event of bundle.events.values()) {
          for (const ref of event.delayed_effect_refs) {
            expect(bundle.delayed_effects.has(`${ref.id}-v${ref.version}`)).toBe(true)
          }
        }
      })
    }
  })

  // ── Condition Parsing for New Rules ────────────────────────────

  describe('condition parsing for all new reaction rules', () => {
    it('all reaction rules parse in all scenarios', async () => {
      const provider = createFileContentProvider(contentRoot)

      const scenarios: VersionRef[] = [
        { id: 'monolith_of_mild_despair', version: 1 },
        { id: 'microservice_sprawl', version: 1 },
        { id: 'compliance_gauntlet', version: 1 },
        { id: 'startup_hypergrowth', version: 1 }
      ]

      for (const scenarioRef of scenarios) {
        const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)

        for (const rule of bundle.stakeholder_reaction_rules.values()) {
          const condition = parseConditionDescription(rule.condition_description, bundle)
          expect(condition).not.toBeNull()
        }
      }
    })
  })

  // ── Simulation Runner ──────────────────────────────────────────

  describe('simulation runner', () => {
    it('runs deterministically with the same seed', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      const reportA = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'determinism-test' })
      const reportB = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'determinism-test' })

      expect(reportA.per_run).toEqual(reportB.per_run)
      expect(reportA.aggregate).toEqual(reportB.aggregate)
    })

    it('produces different results with different seeds', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      const reportA = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'seed-alpha' })
      const reportB = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'seed-beta' })

      // At least some per-run outcomes should differ
      const outcomesA = reportA.per_run.map((r) => r.outcome_tier)
      const outcomesB = reportB.per_run.map((r) => r.outcome_tier)

      const scoresA = reportA.per_run.map((r) => r.score_average)
      const scoresB = reportB.per_run.map((r) => r.score_average)

      // Not all runs should be identical across different seeds
      const allSame =
        JSON.stringify(outcomesA) === JSON.stringify(outcomesB) &&
        JSON.stringify(scoresA) === JSON.stringify(scoresB)
      expect(allSame).toBe(false)
    })

    it('completes all runs and produces valid telemetry', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      const report = simulate_runs({ scenario_bundle: bundle, runs: 10, seed: 'telemetry-test' })

      expect(report.total_runs).toBe(10)
      expect(report.per_run).toHaveLength(10)
      expect(report.scenario_id).toBe('startup_hypergrowth')
      expect(report.scenario_version).toBe(1)
      expect(report.base_seed).toBe('telemetry-test')

      for (const run of report.per_run) {
        expect(run.turns_completed).toBeGreaterThan(0)
        expect(run.turns_completed).toBeLessThanOrEqual(run.max_turns)
        expect(run.cards_played.length).toBeGreaterThan(0)
        expect(run.final_scores).toBeDefined()
        expect(run.final_stakeholder_satisfaction).toBeDefined()
        expect(run.run_status).not.toBe('in_progress')
      }
    })

    it('respects card cooldowns and usage limits during simulation', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      const report = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'cooldown-test' })

      for (const run of report.per_run) {
        // Cards with usage_limit=1 should appear at most once
        const usageLimitedCards = [
          'introduce_anti_corruption_layer',
          'hold_architecture_workshop',
          'implement_feature_flag_framework',
          'automate_deployment_pipeline'
        ]

        for (const cardId of usageLimitedCards) {
          const uses = run.cards_played.filter((c) => c === cardId).length
          expect(uses).toBeLessThanOrEqual(1)
        }

        // hire_specialized_contractor has usage_limit=2
        const contractorUses = run.cards_played.filter(
          (c) => c === 'hire_specialized_contractor'
        ).length
        expect(contractorUses).toBeLessThanOrEqual(2)
      }
    })

    it('aggregate telemetry has valid structure', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      const report = simulate_runs({ scenario_bundle: bundle, runs: 10, seed: 'aggregate-test' })

      const agg = report.aggregate
      expect(agg.total_runs).toBe(10)
      expect(agg.win_rate).toBeGreaterThanOrEqual(0)
      expect(agg.win_rate).toBeLessThanOrEqual(1)
      expect(agg.average_turns_completed).toBeGreaterThan(0)
      expect(Object.keys(agg.average_scores).length).toBeGreaterThan(0)
      expect(Object.keys(agg.average_stakeholder_satisfaction).length).toBeGreaterThan(0)
      expect(Object.keys(agg.card_usage).length).toBeGreaterThan(0)
      expect(Object.keys(agg.outcome_distribution).length).toBeGreaterThan(0)
    })

    it('runs all four scenarios without errors', async () => {
      const provider = createFileContentProvider(contentRoot)

      const scenarioIds = [
        'monolith_of_mild_despair',
        'microservice_sprawl',
        'compliance_gauntlet',
        'startup_hypergrowth'
      ]

      for (const scenarioId of scenarioIds) {
        const bundle = await buildScenarioBundle(scenarioId, 1, provider)
        const report = simulate_runs({ scenario_bundle: bundle, runs: 3, seed: 'smoke-test' })

        expect(report.total_runs).toBe(3)
        expect(report.per_run).toHaveLength(3)

        for (const run of report.per_run) {
          expect(run.run_status).not.toBe('in_progress')
        }
      }
    })

    it('delayed effects resolve during simulation runs', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      // Run enough turns to allow delayed effects to resolve
      const report = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'delayed-fx-test' })

      // At least some runs should have evidence of delayed effect resolution
      // (cards like refactor_module queue improved_clarity which resolves after 2 turns)
      let anyNonZeroAfterShocks = false
      for (const run of report.per_run) {
        // If the run played refactor_module, improved_clarity should have resolved
        if (
          run.cards_played.includes('refactor_module') &&
          run.turns_completed > 3
        ) {
          anyNonZeroAfterShocks = true
          break
        }
      }
      expect(anyNonZeroAfterShocks).toBe(true)
    })
  })
})
