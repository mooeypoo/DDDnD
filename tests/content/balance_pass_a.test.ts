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
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { PlayerClass, ChallengeModifier } from '@/domains/content/model/content_types'

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
    loadPlayerClass: (ref) => loadJson<PlayerClass>('classes', ref),
    loadChallengeModifier: (ref) => loadJson<ChallengeModifier>('challenge-modifiers', ref)
  }
}

const contentRoot = path.resolve(__dirname, '../../content')

describe('Balance pass A — telemetry-informed tuning', () => {
  // ── Scenario configuration checks ─────────────────────────────

  describe('scenario starting scores and turn limits', () => {
    it('compliance_gauntlet starts with reduced delivery_confidence and user_trust', async () => {
      const provider = createFileContentProvider(contentRoot)
      const scenario = await provider.loadScenario({ id: 'compliance_gauntlet', version: 1 })

      expect(scenario.starting_scores.delivery_confidence).toBe(35)
      expect(scenario.starting_scores.user_trust).toBe(55)
      expect(scenario.starting_scores.team_morale).toBe(32)
      expect(scenario.starting_scores.maintainability).toBe(44)
    })

    it('monolith_of_mild_despair has extended turns and higher starting delivery/budget', async () => {
      const provider = createFileContentProvider(contentRoot)
      const scenario = await provider.loadScenario({ id: 'monolith_of_mild_despair', version: 1 })

      expect(scenario.max_turns).toBe(10)
      expect(scenario.starting_scores.delivery_confidence).toBe(55)
      expect(scenario.starting_scores.budget).toBe(58)
    })

    it('monolith_of_mild_despair includes align_budget_with_architecture', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      expect(bundle.cards.has('align_budget_with_architecture-v1')).toBe(true)
    })

    it('startup_hypergrowth starts with higher budget and morale', async () => {
      const provider = createFileContentProvider(contentRoot)
      const scenario = await provider.loadScenario({ id: 'startup_hypergrowth', version: 1 })

      expect(scenario.starting_scores.budget).toBe(57)
      expect(scenario.starting_scores.team_morale).toBe(45)
    })

    it('microservice_sprawl uses tuned starting user_trust', async () => {
      const provider = createFileContentProvider(contentRoot)
      const scenario = await provider.loadScenario({ id: 'microservice_sprawl', version: 1 })

      expect(scenario.starting_scores.user_trust).toBe(52)
    })
  })

  // ── Reaction rule tuning checks ────────────────────────────────

  describe('positive reaction rules are dampened', () => {
    it('security_officer_supports_clear_boundaries has raised threshold and reduced deltas', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'security_officer_supports_clear_boundaries',
        version: 1
      })

      expect(rule.condition_description).toBe('Domain clarity >= 65')
      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'user_trust', delta: 3 }),
          expect.objectContaining({ score_id: 'delivery_confidence', delta: 1 })
        ])
      )
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'security_officer', delta: 5 })
        ])
      )
    })

    it('tech_lead_appreciates_clean_code has raised threshold and reduced deltas', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'tech_lead_appreciates_clean_code',
        version: 1
      })

      expect(rule.condition_description).toBe('Maintainability > 65')
      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'team_morale', delta: 2 }),
          expect.objectContaining({ score_id: 'delivery_confidence', delta: 2 })
        ])
      )
    })

    it('vp_product_celebrates_user_growth has raised threshold and reduced deltas', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'vp_product_celebrates_user_growth',
        version: 1
      })

      expect(rule.condition_description).toBe('User trust > 70')
      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'budget', delta: 2 }),
          expect.objectContaining({ score_id: 'team_morale', delta: 1 })
        ])
      )
    })

    it('ops_manager_confident_in_stability has lowered threshold and adjusted deltas', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'ops_manager_confident_in_stability',
        version: 1
      })

      expect(rule.condition_description).toBe('User trust > 60')
      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'delivery_confidence', delta: 2 }),
          expect.objectContaining({ score_id: 'team_morale', delta: 1 })
        ])
      )
    })
  })

  describe('negative reaction rules are softened', () => {
    it('vp_product_demands_features has reduced punishment severity', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'vp_product_demands_features',
        version: 1
      })

      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'team_morale', delta: -2 }),
          expect.objectContaining({ score_id: 'delivery_confidence', delta: -1 })
        ])
      )
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'vp_product', delta: -5 })
        ])
      )
    })

    it('cfo_cuts_spending_when_budget_low has reduced severity', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'cfo_cuts_spending_when_budget_low',
        version: 1
      })

      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'team_morale', delta: -2 }),
          expect.objectContaining({ score_id: 'delivery_confidence', delta: -1 })
        ])
      )
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'cfo', delta: -5 })
        ])
      )
    })

    it('cfo_alarmed_by_overspending has reduced severity', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'cfo_alarmed_by_overspending',
        version: 1
      })

      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'delivery_confidence', delta: -3 }),
          expect.objectContaining({ score_id: 'team_morale', delta: -2 })
        ])
      )
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'cfo', delta: -7 })
        ])
      )
    })

    it('ops_manager_stressed_by_instability has reduced severity', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'ops_manager_stressed_by_instability',
        version: 1
      })

      expect(rule.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'user_trust', delta: -2 }),
          expect.objectContaining({ score_id: 'team_morale', delta: -2 })
        ])
      )
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'operations_manager', delta: -5 })
        ])
      )
    })
  })

  describe('cfo_rewards_predictable_delivery has lowered threshold', () => {
    it('fires at delivery_confidence > 55 instead of > 65', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'cfo_rewards_predictable_delivery',
        version: 1
      })

      expect(rule.condition_description).toBe('Delivery confidence > 55')
    })
  })

  // ── Event tuning checks ────────────────────────────────────────

  describe('event weight and magnitude tuning', () => {
    it('regulatory_compliance_deadline has increased weight for compliance pressure', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'regulatory_compliance_deadline', version: 1 })

      expect(event.occurrence_weight).toBe(5)
    })

    it('urgent_feature_request has reduced weight and softer impact', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'urgent_feature_request', version: 1 })

      expect(event.occurrence_weight).toBe(5)
      expect(event.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'delivery_confidence', delta: -5 }),
          expect.objectContaining({ score_id: 'team_morale', delta: -4 })
        ])
      )
    })

    it('surprise_budget_cut has reduced magnitude', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'surprise_budget_cut', version: 1 })

      expect(event.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'budget', delta: -9 }),
          expect.objectContaining({ score_id: 'team_morale', delta: -3 })
        ])
      )
    })

    it('service_outage_cascade has slightly reduced user_trust impact', async () => {
      const provider = createFileContentProvider(contentRoot)
      const event = await provider.loadEvent({ id: 'service_outage_cascade', version: 1 })

      expect(event.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'user_trust', delta: -8 }),
          expect.objectContaining({ score_id: 'team_morale', delta: -6 })
        ])
      )
    })
  })

  // ── Delayed effect tuning checks ───────────────────────────────

  describe('delayed effect magnitude tuning', () => {
    it('boundaries_clarify has reduced snowball potential', async () => {
      const provider = createFileContentProvider(contentRoot)
      const effect = await provider.loadDelayedEffect({ id: 'boundaries_clarify', version: 1 })

      expect(effect.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'domain_clarity', delta: 7 }),
          expect.objectContaining({ score_id: 'maintainability', delta: 3 })
        ])
      )
    })

    it('documentation_helps_onboarding has reduced snowball potential', async () => {
      const provider = createFileContentProvider(contentRoot)
      const effect = await provider.loadDelayedEffect({
        id: 'documentation_helps_onboarding',
        version: 1
      })

      expect(effect.score_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ score_id: 'domain_clarity', delta: 5 }),
          expect.objectContaining({ score_id: 'delivery_confidence', delta: 3 })
        ])
      )
    })
  })

  // ── Bundle validation after tuning ─────────────────────────────

  describe('all scenario bundles remain valid after tuning', () => {
    const scenarios: VersionRef[] = [
      { id: 'monolith_of_mild_despair', version: 1 },
      { id: 'microservice_sprawl', version: 1 },
      { id: 'compliance_gauntlet', version: 1 },
      { id: 'startup_hypergrowth', version: 1 }
    ]

    for (const scenarioRef of scenarios) {
      it(`${scenarioRef.id} builds and validates after balance pass`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)

        expect(() => assertValidBundle(bundle)).not.toThrow()
      })
    }
  })

  // ── Determinism preserved ──────────────────────────────────────

  describe('determinism is preserved after tuning', () => {
    const scenarios = [
      'monolith_of_mild_despair',
      'compliance_gauntlet',
      'startup_hypergrowth',
      'microservice_sprawl'
    ]

    for (const scenarioId of scenarios) {
      it(`${scenarioId} produces identical results with same seed`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const bundle = await buildScenarioBundle(scenarioId, 1, provider)

        const reportA = simulate_runs({
          scenario_bundle: bundle,
          runs: 5,
          seed: 'balance-determinism'
        })
        const reportB = simulate_runs({
          scenario_bundle: bundle,
          runs: 5,
          seed: 'balance-determinism'
        })

        expect(reportA.per_run).toEqual(reportB.per_run)
        expect(reportA.aggregate).toEqual(reportB.aggregate)
      })
    }
  })

  // ── Scenario identity preservation checks ──────────────────────

  describe('scenario identities remain distinct', () => {
    it('monolith has legacy-focused events and no compliance/cascade events', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('urgent_feature_request')).toBe(true)
      expect(eventIds.has('service_outage_cascade')).toBe(false)
      expect(eventIds.has('regulatory_compliance_deadline')).toBe(false)
      expect(eventIds.has('data_breach_reported')).toBe(false)
    })

    it('compliance has regulatory events and no legacy/microservice events', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('regulatory_compliance_deadline')).toBe(true)
      expect(eventIds.has('data_breach_reported')).toBe(true)
      expect(eventIds.has('urgent_feature_request')).toBe(false)
      expect(eventIds.has('service_outage_cascade')).toBe(false)
    })

    it('startup has budget pressure events', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('surprise_budget_cut')).toBe(true)
      expect(eventIds.has('data_breach_reported')).toBe(true)
    })

    it('microservice sprawl has cascade events and no legacy events', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('microservice_sprawl', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('service_outage_cascade')).toBe(true)
      expect(eventIds.has('urgent_feature_request')).toBe(false)
      expect(eventIds.has('surprise_budget_cut')).toBe(false)
    })

    it('scenarios have different stakeholder compositions', async () => {
      const provider = createFileContentProvider(contentRoot)

      const monolith = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)
      const compliance = await buildScenarioBundle('compliance_gauntlet', 1, provider)
      const startup = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      const monolithStakeholders = new Set(monolith.scenario.stakeholder_refs.map((r) => r.id))
      const complianceStakeholders = new Set(compliance.scenario.stakeholder_refs.map((r) => r.id))
      const startupStakeholders = new Set(startup.scenario.stakeholder_refs.map((r) => r.id))

      // Compliance has security_officer, others don't
      expect(complianceStakeholders.has('security_officer')).toBe(true)
      expect(monolithStakeholders.has('security_officer')).toBe(false)

      // Startup has CFO, others don't
      expect(startupStakeholders.has('cfo')).toBe(true)
      expect(monolithStakeholders.has('cfo')).toBe(false)
    })
  })
})
