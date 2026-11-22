import { describe, expect, it } from 'vitest'
import { createEmptyBundle, Scenario, addToBundle } from '@/domains/content/model'
import { applyScoreChanges, computeCouplingMultiplier } from '@/domains/simulation/rules'
import { ScoreChangeRecord } from '@/shared/contracts'
import { GameState } from '@/domains/simulation/model'
import { BASE_COUPLING_RULES } from '../support/base_coupling_rules'

function createTestScenario(): Scenario {
  return {
    id: 'coupling_test',
    version: 1,
    name: 'Coupling Test Scenario',
    description: 'Scenario for system coupling tests',
    max_turns: 10,
    starting_scores: {
      domain_clarity: 50,
      maintainability: 50,
      delivery_confidence: 50,
      team_morale: 50,
      user_trust: 50,
      budget: 50
    },
    score_refs: [
      { id: 'domain_clarity', version: 1 },
      { id: 'maintainability', version: 1 },
      { id: 'delivery_confidence', version: 1 },
      { id: 'team_morale', version: 1 },
      { id: 'user_trust', version: 1 },
      { id: 'budget', version: 1 }
    ],
    stakeholder_refs: [],
    card_refs: [],
    event_refs: []
  }
}

function createTestBundle() {
  const scenario = createTestScenario()
  const bundle = createEmptyBundle(scenario)

  const scoreIds = ['domain_clarity', 'maintainability', 'delivery_confidence', 'team_morale', 'user_trust', 'budget']
  for (const id of scoreIds) {
    addToBundle(bundle, 'score', {
      id,
      version: 1,
      name: id,
      short_name: 'Short',
      description: `Test score: ${id}`,
      default_value: 50
    })
  }

  for (const rule of BASE_COUPLING_RULES) {
    addToBundle(bundle, 'coupling_rule', rule)
  }

  return bundle
}

describe('System coupling rules', () => {
  describe('computeCouplingMultiplier', () => {
    it('returns 1.0 when all scores are healthy', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 50,
        team_morale: 50,
        user_trust: 50
      }

      expect(computeCouplingMultiplier('domain_clarity', scores, BASE_COUPLING_RULES)).toBe(1.0)
      expect(computeCouplingMultiplier('maintainability', scores, BASE_COUPLING_RULES)).toBe(1.0)
      expect(computeCouplingMultiplier('delivery_confidence', scores, BASE_COUPLING_RULES)).toBe(1.0)
    })

    it('returns 0.7 for domain_clarity when delivery_confidence < 25', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 20,
        team_morale: 50,
        user_trust: 50
      }

      expect(computeCouplingMultiplier('domain_clarity', scores, BASE_COUPLING_RULES)).toBe(0.7)
    })

    it('returns 0.7 for maintainability when only delivery_confidence < 25', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 20,
        team_morale: 50,
        user_trust: 50
      }

      expect(computeCouplingMultiplier('maintainability', scores, BASE_COUPLING_RULES)).toBe(0.7)
    })

    it('returns 0.75 for maintainability when only team_morale < 25', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 50,
        team_morale: 20,
        user_trust: 50
      }

      expect(computeCouplingMultiplier('maintainability', scores, BASE_COUPLING_RULES)).toBe(0.75)
    })

    it('returns 0.7 for delivery_confidence when user_trust < 25', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 50,
        team_morale: 50,
        user_trust: 20
      }

      expect(computeCouplingMultiplier('delivery_confidence', scores, BASE_COUPLING_RULES)).toBe(0.7)
    })

    it('stacks multipliers for maintainability when both delivery and morale collapse', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 20,
        team_morale: 20,
        user_trust: 50
      }

      // 0.7 * 0.75 = 0.525
      const multiplier = computeCouplingMultiplier('maintainability', scores, BASE_COUPLING_RULES)
      expect(multiplier).toBeCloseTo(0.525, 5)
    })

    it('returns 1.0 for scores not affected by any coupling rule', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 10,
        team_morale: 10,
        user_trust: 10
      }

      expect(computeCouplingMultiplier('budget', scores, BASE_COUPLING_RULES)).toBe(1.0)
      expect(computeCouplingMultiplier('team_morale', scores, BASE_COUPLING_RULES)).toBe(1.0)
      expect(computeCouplingMultiplier('user_trust', scores, BASE_COUPLING_RULES)).toBe(1.0)
    })

    it('does not trigger at exactly the threshold value', () => {
      const scores: GameState['scores'] = {
        delivery_confidence: 25,
        team_morale: 25,
        user_trust: 25
      }

      expect(computeCouplingMultiplier('domain_clarity', scores, BASE_COUPLING_RULES)).toBe(1.0)
      expect(computeCouplingMultiplier('maintainability', scores, BASE_COUPLING_RULES)).toBe(1.0)
      expect(computeCouplingMultiplier('delivery_confidence', scores, BASE_COUPLING_RULES)).toBe(1.0)
    })
  })

  describe('applyScoreChanges with coupling rules', () => {
    it('reduces positive domain_clarity gains when delivery_confidence is low', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 40,
        delivery_confidence: 20,
        maintainability: 50,
        team_morale: 50,
        user_trust: 50,
        budget: 50
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'domain_clarity', delta: 10 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      // +10 * 0.7 = +7
      expect(result.domain_clarity).toBe(47)
    })

    it('does not reduce negative deltas when coupling rules are active', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 40,
        delivery_confidence: 20,
        maintainability: 50,
        team_morale: 50,
        user_trust: 50,
        budget: 50
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'domain_clarity', delta: -10 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      // Negative delta unchanged: 40 + (-10) = 30
      expect(result.domain_clarity).toBe(30)
    })

    it('applies full gains when scores are healthy', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 40,
        delivery_confidence: 50,
        maintainability: 50,
        team_morale: 50,
        user_trust: 50,
        budget: 50
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'domain_clarity', delta: 10 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      expect(result.domain_clarity).toBe(50)
    })

    it('stacks delivery + morale collapse on maintainability gains', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 50,
        delivery_confidence: 20,
        maintainability: 40,
        team_morale: 20,
        user_trust: 50,
        budget: 50
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'maintainability', delta: 10 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      // +10 * 0.7 * 0.75 = +5.25, rounded to +5
      expect(result.maintainability).toBe(45)
    })

    it('reduces delivery_confidence gains when user_trust is low', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 50,
        delivery_confidence: 40,
        maintainability: 50,
        team_morale: 50,
        user_trust: 20,
        budget: 50
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'delivery_confidence', delta: 10 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      // +10 * 0.7 = +7
      expect(result.delivery_confidence).toBe(47)
    })

    it('does not affect budget gains regardless of system state', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 50,
        delivery_confidence: 10,
        maintainability: 50,
        team_morale: 10,
        user_trust: 10,
        budget: 30
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'budget', delta: 15 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      // Budget has no coupling rules, full gain applied
      expect(result.budget).toBe(45)
    })

    it('produces deterministic results for identical inputs', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 40,
        delivery_confidence: 20,
        maintainability: 40,
        team_morale: 20,
        user_trust: 20,
        budget: 30
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'domain_clarity', delta: 10 },
        { score_id: 'maintainability', delta: 8 },
        { score_id: 'delivery_confidence', delta: 6 },
        { score_id: 'budget', delta: 5 }
      ]

      const result1 = applyScoreChanges(scores, changes, bundle)
      const result2 = applyScoreChanges(scores, changes, bundle)

      expect(result1).toEqual(result2)
    })

    it('applies coupling rules correctly across multiple score changes in one batch', () => {
      const bundle = createTestBundle()
      const scores: GameState['scores'] = {
        domain_clarity: 40,
        delivery_confidence: 20,
        maintainability: 50,
        team_morale: 50,
        user_trust: 50,
        budget: 50
      }

      const changes: ScoreChangeRecord[] = [
        { score_id: 'domain_clarity', delta: 10 },
        { score_id: 'maintainability', delta: 10 },
        { score_id: 'budget', delta: 10 },
        { score_id: 'delivery_confidence', delta: -5 }
      ]

      const result = applyScoreChanges(scores, changes, bundle)

      // domain_clarity: 40 + round(10 * 0.7) = 47
      expect(result.domain_clarity).toBe(47)
      // maintainability: 50 + round(10 * 0.7) = 57
      expect(result.maintainability).toBe(57)
      // budget: no coupling, 50 + 10 = 60
      expect(result.budget).toBe(60)
      // delivery_confidence: negative delta unchanged, 20 + (-5) = 15
      expect(result.delivery_confidence).toBe(15)
    })
  })
})

describe('coupling comes only from the scenario (M3 slice 2)', () => {
  it('applies no coupling to a scenario that lists no rules, even with base score ids', () => {
    const bundle = createEmptyBundle(createTestScenario())
    const scores: GameState['scores'] = { delivery_confidence: 10, domain_clarity: 50 }
    const changes: ScoreChangeRecord[] = [{ score_id: 'domain_clarity', delta: 10 }]
    expect(applyScoreChanges(scores, changes, bundle).domain_clarity).toBe(60)
  })

  it("applies a pack's own rule to its own scores", () => {
    const bundle = createEmptyBundle(createTestScenario())
    addToBundle(bundle, 'coupling_rule', {
      id: 'pager_overload', version: 1, name: 'Pager Overload', description: 'Exhausted on-call slows everything.',
      trigger_score_id: 'rested_on_call', threshold: 30, affected_score_ids: ['change_velocity'], gain_multiplier: 0.5,
    })
    const scores: GameState['scores'] = { rested_on_call: 20, change_velocity: 40 }
    expect(applyScoreChanges(scores, [{ score_id: 'change_velocity', delta: 10 }], bundle).change_velocity).toBe(45)
  })
})


describe('coupling rule validation (M3 slice 2)', () => {
  it('refuses a rule about a score the scenario does not track, and a missing rule', async () => {
    const { validateScenarioBundle } = await import('@/domains/content/services/bundle_validator')
    const scenario = { ...createTestScenario(), coupling_rule_refs: [{ id: 'pager_overload', version: 1 }, { id: 'gone', version: 1 }] }
    const bundle = createEmptyBundle(scenario)
    for (const score of createTestBundle().scores.values()) addToBundle(bundle, 'score', score)
    addToBundle(bundle, 'coupling_rule', {
      id: 'pager_overload', version: 1, name: 'Pager Overload', description: 'd',
      trigger_score_id: 'rested_on_call', threshold: 30, affected_score_ids: ['budget'], gain_multiplier: 0.5,
    })
    const messages = validateScenarioBundle(bundle).errors.map((error) => error.message)
    expect(messages).toContain('Coupling rule pager_overload-v1 uses score "rested_on_call", which this scenario doesn\'t track (add it to score_refs or use another rule)')
    expect(messages).toContain('Scenario references missing coupling rule: gone-v1')
    expect(messages.some((message) => message.includes('"budget"'))).toBe(false)
  })
})
