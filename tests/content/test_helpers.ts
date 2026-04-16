/**
 * Test Content Helpers
 * 
 * Provides mock content data and a mock content provider for testing.
 */

import {
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  Card,
  Event,
  DelayedEffect,
  ContentMetadata
} from '@/domains/content/model'
import { ContentProvider } from '@/domains/content/services/content_provider'

// Mock content data
export const mockScores: Record<string, Score> = {
  'technical_debt-v1': {
    id: 'technical_debt',
    version: 1,
    name: 'Technical Debt',
    description: 'Accumulated shortcuts and compromises in the codebase',
    default_value: 50
  },
  'team_morale-v1': {
    id: 'team_morale',
    version: 1,
    name: 'Team Morale',
    description: 'Developer satisfaction and productivity',
    default_value: 60
  },
  'mismatched_score-v1': {
    id: 'wrong_id',
    version: 1,
    name: 'Mismatched Score',
    description: 'This score has an ID that doesn\'t match its filename',
    default_value: 0
  },
  'version_mismatch-v1': {
    id: 'version_mismatch',
    version: 2,
    name: 'Version Mismatch Score',
    description: 'This score has a version that doesn\'t match its filename',
    default_value: 0
  }
}

export const mockDelayedEffects: Record<string, DelayedEffect> = {
  'improved_clarity-v1': {
    id: 'improved_clarity',
    version: 1,
    name: 'Improved Domain Clarity',
    description: 'The refactoring pays off with better understanding',
    turns_until_resolution: 2,
    score_changes: [
      { score_id: 'technical_debt', delta: -10 },
      { score_id: 'team_morale', delta: 5 }
    ]
  }
}

export const mockStakeholderReactionRules: Record<string, StakeholderReactionRule> = {
  'concerned_about_debt-v1': {
    id: 'concerned_about_debt',
    version: 1,
    name: 'Concerned About Technical Debt',
    description: 'React negatively when technical debt is high',
    condition_description: 'Technical debt > 70',
    score_changes: [
      { score_id: 'team_morale', delta: -5 }
    ]
  }
}

export const mockStakeholders: Record<string, Stakeholder> = {
  'tech_lead-v1': {
    id: 'tech_lead',
    version: 1,
    name: 'Technical Lead',
    description: 'Experienced developer who cares about code quality',
    reaction_rule_refs: [
      { id: 'concerned_about_debt', version: 1 }
    ]
  }
}

export const mockCards: Record<string, Card> = {
  'refactor_module-v1': {
    id: 'refactor_module',
    version: 1,
    name: 'Refactor Core Module',
    description: 'Clean up a messy module to improve maintainability',
    flavor_text: 'Time to pay down some of that technical debt',
    score_changes: [
      { score_id: 'technical_debt', delta: -5 },
      { score_id: 'team_morale', delta: -2 }
    ],
    delayed_effect_refs: [
      { id: 'improved_clarity', version: 1 }
    ]
  }
}

export const mockEvents: Record<string, Event> = {
  'production_incident-v1': {
    id: 'production_incident',
    version: 1,
    name: 'Production Incident',
    description: 'A critical bug has escaped to production',
    flavor_text: 'The pager is going off',
    occurrence_weight: 5,
    score_changes: [
      { score_id: 'team_morale', delta: -10 },
      { score_id: 'technical_debt', delta: 5 }
    ],
    delayed_effect_refs: []
  }
}

export const mockScenarios: Record<string, Scenario> = {
  'test_scenario-v1': {
    id: 'test_scenario',
    version: 1,
    name: 'Test Scenario',
    description: 'A minimal test scenario for validating the content system',
    short_description: 'A compact validation scenario for content tests',
    flavor_text: 'Testing the content loading pipeline',
    max_turns: 10,
    starting_scores: {
      technical_debt: 50,
      team_morale: 60
    },
    score_refs: [
      { id: 'technical_debt', version: 1 },
      { id: 'team_morale', version: 1 }
    ],
    stakeholder_refs: [
      { id: 'tech_lead', version: 1 }
    ],
    card_refs: [
      { id: 'refactor_module', version: 1 }
    ],
    event_refs: [
      { id: 'production_incident', version: 1 }
    ]
  }
}

// All mock content combined
export const mockContent: Record<string, ContentMetadata> = {
  ...mockScores,
  ...mockDelayedEffects,
  ...mockStakeholderReactionRules,
  ...mockStakeholders,
  ...mockCards,
  ...mockEvents,
  ...mockScenarios
}

/**
 * Creates a mock content provider for testing.
 */
export function createMockContentProvider(): ContentProvider {
  return {
    loadScenario: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockScenarios[key]
      if (!content) {
        throw new Error(`Mock scenario not found: ${key}`)
      }
      if (content.id !== ref.id || content.version !== ref.version) {
        throw new Error(`Version mismatch for ${key}: expected ${ref.id} v${ref.version}, got ${content.id} v${content.version}`)
      }
      return content
    },
    loadScore: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockScores[key]
      if (!content) {
        throw new Error(`Mock score not found: ${key}`)
      }
      if (content.id !== ref.id || content.version !== ref.version) {
        throw new Error(`Version mismatch for ${key}: expected ${ref.id} v${ref.version}, got ${content.id} v${content.version}`)
      }
      return content
    },
    loadStakeholder: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockStakeholders[key]
      if (!content) {
        throw new Error(`Mock stakeholder not found: ${key}`)
      }
      return content
    },
    loadStakeholderReactionRule: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockStakeholderReactionRules[key]
      if (!content) {
        throw new Error(`Mock stakeholder reaction rule not found: ${key}`)
      }
      return content
    },
    loadCard: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockCards[key]
      if (!content) {
        throw new Error(`Mock card not found: ${key}`)
      }
      return content
    },
    loadEvent: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockEvents[key]
      if (!content) {
        throw new Error(`Mock event not found: ${key}`)
      }
      return content
    },
    loadDelayedEffect: async (ref) => {
      const key = `${ref.id}-v${ref.version}`
      const content = mockDelayedEffects[key]
      if (!content) {
        throw new Error(`Mock delayed effect not found: ${key}`)
      }
      return content
    },
    loadOutcomeTier: async (_ref) => {
      throw new Error('Mock outcome tier not implemented')
    },
    loadOutcomeArchetype: async (_ref) => {
      throw new Error('Mock outcome archetype not implemented')
    },
    loadPlayerClass: async (_ref) => {
      throw new Error('Mock player class not implemented')
    },
    loadChallengeModifier: async (_ref) => {
      throw new Error('Mock challenge modifier not implemented')
    }
  }
}
