import { describe, it, expect } from 'vitest'
import { createMockContentProvider } from './test_helpers'

describe('Content Provider', () => {
  describe('successful loading', () => {
    it('should load a valid score file', async () => {
      const provider = createMockContentProvider()
      
      const score = await provider.loadScore({ id: 'technical_debt', version: 1 })
      
      expect(score.id).toBe('technical_debt')
      expect(score.version).toBe(1)
      expect(score.name).toBe('Technical Debt')
      expect(score.default_value).toBe(50)
    })
    
    it('should load a valid stakeholder file', async () => {
      const provider = createMockContentProvider()
      
      const stakeholder = await provider.loadStakeholder({ id: 'tech_lead', version: 1 })
      
      expect(stakeholder.id).toBe('tech_lead')
      expect(stakeholder.version).toBe(1)
      expect(stakeholder.name).toBe('Technical Lead')
      expect(stakeholder.reaction_rule_refs).toHaveLength(1)
      expect(stakeholder.reaction_rule_refs[0].id).toBe('concerned_about_debt')
    })
    
    it('should load a valid card file', async () => {
      const provider = createMockContentProvider()
      
      const card = await provider.loadCard({ id: 'refactor_module', version: 1 })
      
      expect(card.id).toBe('refactor_module')
      expect(card.version).toBe(1)
      expect(card.name).toBe('Refactor Core Module')
      expect(card.score_changes).toHaveLength(2)
      expect(card.delayed_effect_refs).toHaveLength(1)
    })
    
    it('should load a valid delayed effect file', async () => {
      const provider = createMockContentProvider()
      
      const effect = await provider.loadDelayedEffect({ id: 'improved_clarity', version: 1 })
      
      expect(effect.id).toBe('improved_clarity')
      expect(effect.version).toBe(1)
      expect(effect.turns_until_resolution).toBe(2)
      expect(effect.score_changes).toHaveLength(2)
    })
    
    it('should load a valid scenario file', async () => {
      const provider = createMockContentProvider()
      
      const scenario = await provider.loadScenario({ id: 'test_scenario', version: 1 })
      
      expect(scenario.id).toBe('test_scenario')
      expect(scenario.version).toBe(1)
      expect(scenario.max_turns).toBe(10)
      expect(scenario.score_refs).toHaveLength(2)
      expect(scenario.stakeholder_refs).toHaveLength(1)
      expect(scenario.card_refs).toHaveLength(1)
      expect(scenario.event_refs).toHaveLength(1)
    })
  })
  
  describe('error handling', () => {
    it('should throw error when file does not exist', async () => {
      const provider = createMockContentProvider()
      
      await expect(
        provider.loadScore({ id: 'nonexistent', version: 1 })
      ).rejects.toThrow()
    })
    
    it('should throw error when internal id does not match filename', async () => {
      const provider = createMockContentProvider()
      
      await expect(
        provider.loadScore({ id: 'mismatched_score', version: 1 })
      ).rejects.toThrow(/Version mismatch/)
    })
    
    it('should throw error when internal version does not match filename', async () => {
      const provider = createMockContentProvider()
      
      await expect(
        provider.loadScore({ id: 'version_mismatch', version: 1 })
      ).rejects.toThrow(/Version mismatch/)
    })
    
    it('should provide detailed error message for version mismatch', async () => {
      const provider = createMockContentProvider()
      
      try {
        await provider.loadScore({ id: 'mismatched_score', version: 1 })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message).toContain('Version mismatch')
          expect(error.message).toContain('mismatched_score')
        }
      }
    })
  })
})
