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
import { parseConditionDescription, evaluateNumericCondition } from '@/domains/simulation/rules/condition_evaluator'

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
    loadPlayerClass: async (_ref) => {
      throw new Error('Player class loading is not required for scenario bundle construction')
    },
    loadChallengeModifier: async (_ref) => {
      throw new Error('Challenge modifier loading is not required for scenario bundle construction')
    }
  }
}

const contentRoot = path.resolve(__dirname, '../../content')

describe('Pass A content expansion', () => {
  describe('stakeholder reaction fixes', () => {
    it('concerned_about_debt rule targets tech_lead, not lead_developer', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'concerned_about_debt',
        version: 1
      })

      expect(rule.stakeholder_changes).toBeDefined()
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'tech_lead' })
        ])
      )
      expect(rule.stakeholder_changes).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'lead_developer' })
        ])
      )
    })

    it('tech_lead has both negative and positive reaction rules', async () => {
      const provider = createFileContentProvider(contentRoot)
      const stakeholder = await provider.loadStakeholder({ id: 'tech_lead', version: 1 })

      expect(stakeholder.reaction_rule_refs.length).toBeGreaterThanOrEqual(2)

      const ruleIds = stakeholder.reaction_rule_refs.map((r) => r.id)
      expect(ruleIds).toContain('concerned_about_debt')
      expect(ruleIds).toContain('tech_lead_appreciates_clean_code')
    })

    it('tech_lead_appreciates_clean_code loads with valid gameplay score ids', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'tech_lead_appreciates_clean_code',
        version: 1
      })

      expect(rule.condition_description).toBe('Maintainability > 65')
      expect(rule.score_changes.length).toBeGreaterThan(0)
      expect(rule.stakeholder_changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stakeholder_id: 'tech_lead', delta: expect.any(Number) })
        ])
      )

      // deltas should be positive (this is a positive reaction)
      for (const change of rule.score_changes) {
        expect(change.delta).toBeGreaterThan(0)
      }
      for (const sc of rule.stakeholder_changes ?? []) {
        expect(sc.delta).toBeGreaterThan(0)
      }
    })

    it('vp_product has at least one positive reaction rule', async () => {
      const provider = createFileContentProvider(contentRoot)
      const stakeholder = await provider.loadStakeholder({ id: 'vp_product', version: 1 })

      expect(stakeholder.reaction_rule_refs.length).toBeGreaterThanOrEqual(3)

      const ruleIds = stakeholder.reaction_rule_refs.map((r) => r.id)
      expect(ruleIds).toContain('vp_product_celebrates_user_growth')
    })

    it('vp_product_celebrates_user_growth loads with valid gameplay score ids', async () => {
      const provider = createFileContentProvider(contentRoot)
      const rule = await provider.loadStakeholderReactionRule({
        id: 'vp_product_celebrates_user_growth',
        version: 1
      })

      expect(rule.condition_description).toBe('User trust > 70')
      for (const change of rule.score_changes) {
        expect(change.delta).toBeGreaterThan(0)
      }
      for (const sc of rule.stakeholder_changes ?? []) {
        expect(sc.delta).toBeGreaterThan(0)
      }
    })

    it('tech_lead reaction rules resolve correctly through scenario bundles', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      expect(bundle.stakeholder_reaction_rules.has('concerned_about_debt-v1')).toBe(true)
      expect(bundle.stakeholder_reaction_rules.has('tech_lead_appreciates_clean_code-v1')).toBe(true)

      const negativeRule = bundle.stakeholder_reaction_rules.get('concerned_about_debt-v1')!
      const positiveRule = bundle.stakeholder_reaction_rules.get('tech_lead_appreciates_clean_code-v1')!

      const negCond = parseConditionDescription(negativeRule.condition_description, bundle)
      const posCond = parseConditionDescription(positiveRule.condition_description, bundle)

      expect(negCond).not.toBeNull()
      expect(posCond).not.toBeNull()

      // Negative fires when maintainability < 45
      expect(
        evaluateNumericCondition(negCond!, {
          scores: { maintainability: 30 },
          stakeholders: {}
        })
      ).toBe(true)
      expect(
        evaluateNumericCondition(negCond!, {
          scores: { maintainability: 50 },
          stakeholders: {}
        })
      ).toBe(false)

      // Positive fires when maintainability > 65
      expect(
        evaluateNumericCondition(posCond!, {
          scores: { maintainability: 70 },
          stakeholders: {}
        })
      ).toBe(true)
      expect(
        evaluateNumericCondition(posCond!, {
          scores: { maintainability: 40 },
          stakeholders: {}
        })
      ).toBe(false)
    })
  })

  describe('new cards', () => {
    const newCardIds = [
      'negotiate_technical_runway',
      'run_security_audit',
      'spike_on_migration_strategy',
      'absorb_emergency_production_fix',
      'pin_and_audit_dependencies'
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

    it('new cards use only valid score ids from the monolith scenario', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      const validScoreIds = new Set(
        Array.from(bundle.scores.values()).map((s) => s.id)
      )

      const monolithCardIds = ['negotiate_technical_runway', 'spike_on_migration_strategy', 'absorb_emergency_production_fix']
      for (const cardId of monolithCardIds) {
        const card = bundle.cards.get(`${cardId}-v1`)!
        expect(card).toBeDefined()
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
        if (card.usage_limit !== undefined) {
          expect(card.usage_limit).toBeGreaterThan(0)
        }
        if (card.cooldown_turns !== undefined) {
          expect(card.cooldown_turns).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('new delayed effects', () => {
    const newEffectIds = [
      'audit_findings_surface',
      'dependency_stability_improves',
      'knowledge_gap_widens'
    ]

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

    it('audit_findings_surface is loaded transitively through run_security_audit card', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      expect(bundle.cards.has('run_security_audit-v1')).toBe(true)
      expect(bundle.delayed_effects.has('audit_findings_surface-v1')).toBe(true)
    })

    it('dependency_stability_improves is loaded transitively through pin_and_audit_dependencies card', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      expect(bundle.cards.has('pin_and_audit_dependencies-v1')).toBe(true)
      expect(bundle.delayed_effects.has('dependency_stability_improves-v1')).toBe(true)
    })

    it('knowledge_gap_widens is loaded transitively through key_engineer_leaves event', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      expect(bundle.events.has('key_engineer_leaves-v1')).toBe(true)
      expect(bundle.delayed_effects.has('knowledge_gap_widens-v1')).toBe(true)
    })
  })

  describe('new events', () => {
    const newEventIds = [
      'key_engineer_leaves',
      'surprise_budget_cut',
      'regulatory_compliance_deadline',
      'service_outage_cascade',
      'customer_escalation'
    ]

    for (const eventId of newEventIds) {
      it(`loads ${eventId} with valid schema`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const event = await provider.loadEvent({ id: eventId, version: 1 })

        expect(event.id).toBe(eventId)
        expect(event.version).toBe(1)
        expect(event.name).toBeTruthy()
        expect(event.description).toBeTruthy()
        expect(event.flavor_text).toBeTruthy()
        expect(event.occurrence_weight).toBeGreaterThan(0)
        expect(event.score_changes.length).toBeGreaterThan(0)
      })
    }

    it('new events reference only existing delayed effects', async () => {
      const provider = createFileContentProvider(contentRoot)

      for (const eventId of newEventIds) {
        const event = await provider.loadEvent({ id: eventId, version: 1 })
        for (const ref of event.delayed_effect_refs) {
          const effect = await provider.loadDelayedEffect(ref)
          expect(effect.id).toBe(ref.id)
        }
      }
    })
  })

  describe('scenario event pool differentiation', () => {
    it('scenarios have distinct event pools', async () => {
      const provider = createFileContentProvider(contentRoot)

      const monolith = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)
      const startup = await buildScenarioBundle('startup_hypergrowth', 1, provider)
      const compliance = await buildScenarioBundle('compliance_gauntlet', 1, provider)
      const sprawl = await buildScenarioBundle('microservice_sprawl', 1, provider)

      const monolithEvents = new Set(monolith.scenario.event_refs.map((r) => r.id))
      const startupEvents = new Set(startup.scenario.event_refs.map((r) => r.id))
      const complianceEvents = new Set(compliance.scenario.event_refs.map((r) => r.id))
      const sprawlEvents = new Set(sprawl.scenario.event_refs.map((r) => r.id))

      // Verify they are not identical
      function setsEqual(a: Set<string>, b: Set<string>): boolean {
        if (a.size !== b.size) return false
        for (const item of a) if (!b.has(item)) return false
        return true
      }

      expect(setsEqual(monolithEvents, startupEvents)).toBe(false)
      expect(setsEqual(monolithEvents, complianceEvents)).toBe(false)
      expect(setsEqual(monolithEvents, sprawlEvents)).toBe(false)
      expect(setsEqual(startupEvents, complianceEvents)).toBe(false)
      expect(setsEqual(startupEvents, sprawlEvents)).toBe(false)
      expect(setsEqual(complianceEvents, sprawlEvents)).toBe(false)
    })

    it('monolith has legacy-focused events and no service_outage_cascade', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('key_engineer_leaves')).toBe(true)
      expect(eventIds.has('customer_escalation')).toBe(true)
      expect(eventIds.has('urgent_feature_request')).toBe(true)
      expect(eventIds.has('service_outage_cascade')).toBe(false)
      expect(eventIds.has('regulatory_compliance_deadline')).toBe(false)
    })

    it('startup_hypergrowth has budget pressure events', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('surprise_budget_cut')).toBe(true)
      expect(eventIds.has('key_engineer_leaves')).toBe(true)
      expect(eventIds.has('customer_escalation')).toBe(true)
    })

    it('compliance_gauntlet has regulatory events and no urgent_feature_request', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('regulatory_compliance_deadline')).toBe(true)
      expect(eventIds.has('key_engineer_leaves')).toBe(true)
      expect(eventIds.has('urgent_feature_request')).toBe(false)
    })

    it('microservice_sprawl has cascade events and no urgent_feature_request', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('microservice_sprawl', 1, provider)
      const eventIds = new Set(bundle.scenario.event_refs.map((r) => r.id))

      expect(eventIds.has('service_outage_cascade')).toBe(true)
      expect(eventIds.has('key_engineer_leaves')).toBe(true)
      expect(eventIds.has('urgent_feature_request')).toBe(false)
    })
  })

  describe('scenario card pool integration', () => {
    it('monolith includes new legacy-facing cards', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

      expect(bundle.cards.has('negotiate_technical_runway-v1')).toBe(true)
      expect(bundle.cards.has('spike_on_migration_strategy-v1')).toBe(true)
      expect(bundle.cards.has('absorb_emergency_production_fix-v1')).toBe(true)
    })

    it('startup_hypergrowth includes growth-pressure cards', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('startup_hypergrowth', 1, provider)

      expect(bundle.cards.has('negotiate_technical_runway-v1')).toBe(true)
      expect(bundle.cards.has('absorb_emergency_production_fix-v1')).toBe(true)
    })

    it('compliance_gauntlet includes security and audit cards', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('compliance_gauntlet', 1, provider)

      expect(bundle.cards.has('run_security_audit-v1')).toBe(true)
      expect(bundle.cards.has('pin_and_audit_dependencies-v1')).toBe(true)
    })

    it('microservice_sprawl includes dependency and migration cards', async () => {
      const provider = createFileContentProvider(contentRoot)
      const bundle = await buildScenarioBundle('microservice_sprawl', 1, provider)

      expect(bundle.cards.has('spike_on_migration_strategy-v1')).toBe(true)
      expect(bundle.cards.has('pin_and_audit_dependencies-v1')).toBe(true)
    })

    it('new cards are not placed into every scenario indiscriminately', async () => {
      const provider = createFileContentProvider(contentRoot)

      const monolith = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)
      const compliance = await buildScenarioBundle('compliance_gauntlet', 1, provider)
      const sprawl = await buildScenarioBundle('microservice_sprawl', 1, provider)

      // run_security_audit is NOT in monolith (not a security-focused scenario)
      expect(monolith.cards.has('run_security_audit-v1')).toBe(false)

      // absorb_emergency_production_fix is NOT in compliance (compliance is proactive)
      expect(compliance.cards.has('absorb_emergency_production_fix-v1')).toBe(false)

      // negotiate_technical_runway is NOT in sprawl (sprawl is more about structure than runway)
      expect(sprawl.cards.has('negotiate_technical_runway-v1')).toBe(false)
    })
  })

  describe('all expanded scenario bundles validate', () => {
    const scenarios: VersionRef[] = [
      { id: 'monolith_of_mild_despair', version: 1 },
      { id: 'microservice_sprawl', version: 1 },
      { id: 'compliance_gauntlet', version: 1 },
      { id: 'startup_hypergrowth', version: 1 }
    ]

    for (const scenarioRef of scenarios) {
      it(`${scenarioRef.id} builds and validates successfully`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)

        expect(() => assertValidBundle(bundle)).not.toThrow()
      })

      it(`${scenarioRef.id} has all cross-references intact`, async () => {
        const provider = createFileContentProvider(contentRoot)
        const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)

        // All stakeholder rules are loaded
        for (const stakeholder of bundle.stakeholders.values()) {
          for (const ruleRef of stakeholder.reaction_rule_refs) {
            expect(bundle.stakeholder_reaction_rules.has(`${ruleRef.id}-v${ruleRef.version}`)).toBe(true)
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

  describe('stakeholder reaction condition parsing in expanded bundles', () => {
    it('all reaction rules parse their condition_description to a valid NumericCondition', async () => {
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
})
