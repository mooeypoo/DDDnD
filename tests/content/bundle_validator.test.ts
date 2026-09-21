import { describe, it, expect } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import {
  validateScenarioBundle,
  assertValidBundle,
  BundleValidationError
} from '@/domains/content/services/bundle_validator'
import { addToBundle, createEmptyBundle, Scenario } from '@/domains/content/model'
import { createMockContentProvider } from './test_helpers'

describe('Bundle Validator', () => {
  describe('valid bundles', () => {
    it('should validate a complete bundle as valid', async () => {
      const provider = createMockContentProvider()
      const bundle = await buildScenarioBundle('test_scenario', 1, provider)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should not throw when asserting a valid bundle', async () => {
      const provider = createMockContentProvider()
      const bundle = await buildScenarioBundle('test_scenario', 1, provider)
      
      expect(() => assertValidBundle(bundle)).not.toThrow()
    })
  })
  
  describe('invalid bundles', () => {
    it('should detect missing score references', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [{ id: 'missing_score', version: 1 }],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].type).toBe('missing_score')
      expect(result.errors[0].message).toContain('missing_score-v1')
    })
    
    it('should detect missing stakeholder references', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [{ id: 'missing_stakeholder', version: 1 }],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_stakeholder')).toBe(true)
    })
    
    it('should detect missing stakeholder reaction rules', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      // Add a stakeholder with a missing rule reference
      bundle.stakeholders.set('test_stakeholder-v1', {
        id: 'test_stakeholder',
        version: 1,
        name: 'Test Stakeholder',
        description: 'Test',
        reaction_rule_refs: [{ id: 'missing_rule', version: 1 }]
      })
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_stakeholder_rule')).toBe(true)
    })
    
    it('should detect missing card references', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [{ id: 'missing_card', version: 1 }],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_card')).toBe(true)
    })
    
    it('should detect missing delayed effect references from cards', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      // Add a card with a missing delayed effect reference
      bundle.cards.set('test_card-v1', {
        id: 'test_card',
        version: 1,
        name: 'Test Card',
        description: 'Test',
        score_changes: [],
        delayed_effect_refs: [{ id: 'missing_effect', version: 1 }]
      })
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_delayed_effect')).toBe(true)
    })
    
    it('should detect missing event references', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: [{ id: 'missing_event', version: 1 }]
      }
      const bundle = createEmptyBundle(scenario)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_event')).toBe(true)
    })
    
    it('should detect missing delayed effect references from events', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      // Add an event with a missing delayed effect reference
      bundle.events.set('test_event-v1', {
        id: 'test_event',
        version: 1,
        name: 'Test Event',
        description: 'Test',
        occurrence_weight: 1,
        score_changes: [],
        delayed_effect_refs: [{ id: 'missing_effect', version: 1 }]
      })
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_delayed_effect')).toBe(true)
    })
    
    it('should detect invalid starting scores', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {
          'nonexistent_score': 100
        },
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'invalid_starting_score')).toBe(true)
    })
    
    it('should throw BundleValidationError when asserting invalid bundle', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [{ id: 'missing', version: 1 }],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      expect(() => assertValidBundle(bundle)).toThrow(BundleValidationError)
    })
    
    it('should report multiple validation errors', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [{ id: 'missing_score', version: 1 }],
        stakeholder_refs: [{ id: 'missing_stakeholder', version: 1 }],
        card_refs: [{ id: 'missing_card', version: 1 }],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      
      const result = validateScenarioBundle(bundle)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })

    it('should detect invalid card usage_limit values', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)

      bundle.cards.set('test_card-v1', {
        id: 'test_card',
        version: 1,
        name: 'Test Card',
        description: 'Test',
        usage_limit: 0,
        score_changes: [],
        delayed_effect_refs: []
      })

      const result = validateScenarioBundle(bundle)

      expect(result.valid).toBe(false)
      expect(result.errors.some((error) => error.type === 'invalid_card_usage_limit')).toBe(true)
    })

    it('should detect invalid card cooldown_turns values', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: {},
        score_refs: [],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)

      bundle.cards.set('test_card-v1', {
        id: 'test_card',
        version: 1,
        name: 'Test Card',
        description: 'Test',
        cooldown_turns: -1,
        score_changes: [],
        delayed_effect_refs: []
      })

      const result = validateScenarioBundle(bundle)

      expect(result.valid).toBe(false)
      expect(result.errors.some((error) => error.type === 'invalid_card_cooldown_turns')).toBe(true)
    })

    it('should reject delayed effects that change scores the scenario does not track', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: { team_morale: 60 },
        score_refs: [{ id: 'team_morale', version: 1 }],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      addToBundle(bundle, 'score', {
        id: 'team_morale',
        version: 1,
        name: 'Team Morale',
        short_name: 'Morale',
        description: 'Morale',
        default_value: 60
      })
      addToBundle(bundle, 'delayed_effect', {
        id: 'improved_clarity',
        version: 1,
        name: 'Improved Domain Clarity',
        description: 'Payoff',
        turns_until_resolution: 2,
        score_changes: [
          { score_id: 'technical_debt', delta: -10 },
          { score_id: 'team_morale', delta: 5 }
        ]
      })

      const result = validateScenarioBundle(bundle)

      expect(result.valid).toBe(false)
      expect(result.errors.some((error) => error.type === 'untracked_score')).toBe(true)
      expect(result.errors.some((error) =>
        error.type === 'untracked_score'
        && error.details?.scoreId === 'technical_debt'
        && error.details?.sourceType === 'delayed_effect'
      )).toBe(true)
      expect(result.errors.some((error) =>
        error.type === 'untracked_score' && error.details?.scoreId === 'team_morale'
      )).toBe(false)
    })

    it('should reject cards, events, rules, requirements, and failure conditions that use untracked scores', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: { team_morale: 60 },
        score_refs: [{ id: 'team_morale', version: 1 }],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: [],
        failure_conditions: [
          { target_type: 'score', target_id: 'budget', operator: '<', value: 10 }
        ]
      }
      const bundle = createEmptyBundle(scenario)
      addToBundle(bundle, 'score', {
        id: 'team_morale',
        version: 1,
        name: 'Team Morale',
        short_name: 'Morale',
        description: 'Morale',
        default_value: 60
      })
      bundle.cards.set('test_card-v1', {
        id: 'test_card',
        version: 1,
        name: 'Test Card',
        description: 'Test',
        score_changes: [{ score_id: 'maintainability', delta: 4 }],
        delayed_effect_refs: [],
        requirements: [
          { target_type: 'score', target_id: 'domain_clarity', operator: '>', value: 20 }
        ]
      })
      bundle.events.set('test_event-v1', {
        id: 'test_event',
        version: 1,
        name: 'Test Event',
        description: 'Test',
        occurrence_weight: 1,
        score_changes: [{ score_id: 'user_trust', delta: -3 }],
        delayed_effect_refs: []
      })
      bundle.stakeholder_reaction_rules.set('test_rule-v1', {
        id: 'test_rule',
        version: 1,
        name: 'Test Rule',
        description: 'Test',
        condition_description: 'Team morale < 40',
        score_changes: [{ score_id: 'delivery_confidence', delta: -2 }]
      })

      const result = validateScenarioBundle(bundle)
      const untracked = result.errors.filter((error) => error.type === 'untracked_score')

      expect(result.valid).toBe(false)
      expect(untracked.map((error) => error.details?.scoreId).sort()).toEqual([
        'budget',
        'delivery_confidence',
        'domain_clarity',
        'maintainability',
        'user_trust'
      ])
    })

    it('should allow delayed effect score changes that the scenario tracks', () => {
      const scenario: Scenario = {
        id: 'test',
        version: 1,
        name: 'Test',
        description: 'Test scenario',
        max_turns: 10,
        starting_scores: { team_morale: 60, domain_clarity: 40 },
        score_refs: [
          { id: 'team_morale', version: 1 },
          { id: 'domain_clarity', version: 1 }
        ],
        stakeholder_refs: [],
        card_refs: [],
        event_refs: []
      }
      const bundle = createEmptyBundle(scenario)
      addToBundle(bundle, 'score', {
        id: 'team_morale',
        version: 1,
        name: 'Team Morale',
        short_name: 'Morale',
        description: 'Morale',
        default_value: 60
      })
      addToBundle(bundle, 'score', {
        id: 'domain_clarity',
        version: 1,
        name: 'Domain Clarity',
        short_name: 'Clarity',
        description: 'Clarity',
        default_value: 40
      })
      addToBundle(bundle, 'delayed_effect', {
        id: 'improved_clarity',
        version: 2,
        name: 'Improved Domain Clarity',
        description: 'Payoff',
        turns_until_resolution: 2,
        score_changes: [
          { score_id: 'domain_clarity', delta: 7 },
          { score_id: 'team_morale', delta: 5 }
        ]
      })

      const result = validateScenarioBundle(bundle)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
