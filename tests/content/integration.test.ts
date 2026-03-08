import { describe, it, expect } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { assertValidBundle } from '@/domains/content/services/bundle_validator'
import { createMockContentProvider } from './test_helpers'

describe('Content Domain Integration', () => {
  it('should load, build, and validate a complete scenario bundle', async () => {
    // Create provider
    const provider = createMockContentProvider()
    
    // Build bundle
    const bundle = await buildScenarioBundle('test_scenario', 1, provider)
    
    // Validate bundle
    expect(() => assertValidBundle(bundle)).not.toThrow()
    
    // Verify bundle structure
    expect(bundle.scenario.id).toBe('test_scenario')
    expect(bundle.scores.size).toBe(2)
    expect(bundle.stakeholders.size).toBe(1)
    expect(bundle.stakeholder_reaction_rules.size).toBe(1)
    expect(bundle.cards.size).toBe(1)
    expect(bundle.events.size).toBe(1)
    expect(bundle.delayed_effects.size).toBe(1)
  })
  
  it('should correctly resolve transitive dependencies', async () => {
    const provider = createMockContentProvider()
    const bundle = await buildScenarioBundle('test_scenario', 1, provider)
    
    // Verify stakeholder -> reaction rule chain
    const stakeholder = bundle.stakeholders.get('tech_lead-v1')
    expect(stakeholder).toBeDefined()
    expect(stakeholder?.reaction_rule_refs).toHaveLength(1)
    
    const ruleRef = stakeholder!.reaction_rule_refs[0]
    const ruleKey = `${ruleRef.id}-v${ruleRef.version}`
    const rule = bundle.stakeholder_reaction_rules.get(ruleKey)
    expect(rule).toBeDefined()
    expect(rule?.id).toBe('concerned_about_debt')
    
    // Verify card -> delayed effect chain
    const card = bundle.cards.get('refactor_module-v1')
    expect(card).toBeDefined()
    expect(card?.delayed_effect_refs).toHaveLength(1)
    
    const effectRef = card!.delayed_effect_refs[0]
    const effectKey = `${effectRef.id}-v${effectRef.version}`
    const effect = bundle.delayed_effects.get(effectKey)
    expect(effect).toBeDefined()
    expect(effect?.id).toBe('improved_clarity')
  })
  
  it('should validate that all score references are satisfied', async () => {
    const provider = createMockContentProvider()
    const bundle = await buildScenarioBundle('test_scenario', 1, provider)
    
    // All scores referenced by the scenario should be in the bundle
    for (const scoreRef of bundle.scenario.score_refs) {
      const key = `${scoreRef.id}-v${scoreRef.version}`
      expect(bundle.scores.has(key)).toBe(true)
    }
    
    // All starting scores should reference valid score IDs
    for (const scoreId of Object.keys(bundle.scenario.starting_scores)) {
      const hasScore = Array.from(bundle.scores.values()).some(s => s.id === scoreId)
      expect(hasScore).toBe(true)
    }
  })
  
  it('should validate that all stakeholder references are satisfied', async () => {
    const provider = createMockContentProvider()
    const bundle = await buildScenarioBundle('test_scenario', 1, provider)
    
    // All stakeholders referenced by the scenario should be in the bundle
    for (const stakeholderRef of bundle.scenario.stakeholder_refs) {
      const key = `${stakeholderRef.id}-v${stakeholderRef.version}`
      expect(bundle.stakeholders.has(key)).toBe(true)
    }
    
    // All stakeholder reaction rules should be in the bundle
    for (const stakeholder of bundle.stakeholders.values()) {
      for (const ruleRef of stakeholder.reaction_rule_refs) {
        const key = `${ruleRef.id}-v${ruleRef.version}`
        expect(bundle.stakeholder_reaction_rules.has(key)).toBe(true)
      }
    }
  })
  
  it('should validate that all card and event delayed effects are satisfied', async () => {
    const provider = createMockContentProvider()
    const bundle = await buildScenarioBundle('test_scenario', 1, provider)
    
    // All delayed effects from cards should be in the bundle
    for (const card of bundle.cards.values()) {
      for (const effectRef of card.delayed_effect_refs) {
        const key = `${effectRef.id}-v${effectRef.version}`
        expect(bundle.delayed_effects.has(key)).toBe(true)
      }
    }
    
    // All delayed effects from events should be in the bundle
    for (const event of bundle.events.values()) {
      for (const effectRef of event.delayed_effect_refs) {
        const key = `${effectRef.id}-v${effectRef.version}`
        expect(bundle.delayed_effects.has(key)).toBe(true)
      }
    }
  })
  
  it('should preserve content metadata across loading and bundling', async () => {
    const provider = createMockContentProvider()
    const bundle = await buildScenarioBundle('test_scenario', 1, provider)
    
    // Verify a score retains all its properties
    const techDebtScore = bundle.scores.get('technical_debt-v1')
    expect(techDebtScore).toBeDefined()
    expect(techDebtScore?.id).toBe('technical_debt')
    expect(techDebtScore?.version).toBe(1)
    expect(techDebtScore?.name).toBe('Technical Debt')
    expect(techDebtScore?.description).toBeDefined()
    expect(techDebtScore?.default_value).toBe(50)
    
    // Verify a card retains all its properties
    const refactorCard = bundle.cards.get('refactor_module-v1')
    expect(refactorCard).toBeDefined()
    expect(refactorCard?.id).toBe('refactor_module')
    expect(refactorCard?.version).toBe(1)
    expect(refactorCard?.name).toBe('Refactor Core Module')
    expect(refactorCard?.description).toBeDefined()
    expect(refactorCard?.flavor_text).toBeDefined()
    expect(refactorCard?.score_changes).toHaveLength(2)
    expect(refactorCard?.delayed_effect_refs).toHaveLength(1)
    expect(refactorCard?.usage_limit).toBeUndefined()
    expect(refactorCard?.cooldown_turns).toBeUndefined()
  })
})
