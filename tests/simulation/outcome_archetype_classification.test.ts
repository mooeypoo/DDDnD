import { describe, expect, it } from 'vitest'
import { createEmptyBundle, Scenario } from '@/domains/content/model'
import { createInitialGameState, RunAnalytics } from '@/domains/simulation/model'
import { classifyOutcomeArchetype } from '@/domains/simulation/rules'
import { getRunOutcome } from '@/domains/simulation/services'

function createAnalytics(overrides: Partial<RunAnalytics> = {}): RunAnalytics {
  return {
    turns_completed: 4,
    total_aftershocks_resolved: 0,
    total_events_triggered: 1,
    total_actions_played: 4,
    cumulative_score_deltas: {},
    cumulative_stakeholder_deltas: {},
    card_usage: {},
    style_tags_used: {},
    ...overrides
  }
}

function createOutcomeScenario(maxTurns: number): Scenario {
  return {
    id: 'outcome_test_scenario',
    version: 1,
    name: 'Outcome Test Scenario',
    description: 'Scenario used for run outcome tests',
    max_turns: maxTurns,
    starting_scores: {
      domain_clarity: 50,
      maintainability: 50,
      delivery_confidence: 50,
      budget: 50
    },
    score_refs: [
      { id: 'domain_clarity', version: 1 },
      { id: 'maintainability', version: 1 },
      { id: 'delivery_confidence', version: 1 },
      { id: 'budget', version: 1 }
    ],
    stakeholder_refs: [{ id: 'cto', version: 1 }],
    card_refs: [],
    event_refs: []
  }
}

describe('Outcome archetype classification', () => {
  it('classifies boundary_builder when architecture improves and delivery remains viable', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        cumulative_score_deltas: {
          domain_clarity: 25,
          maintainability: 15,
          delivery_confidence: -5,
          budget: -10
        },
        cumulative_stakeholder_deltas: {
          cto: 5
        }
      })
    })

    expect(archetype).toBe('boundary_builder')
  })

  it('classifies stakeholder_whisperer when stakeholder satisfaction dominates', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        cumulative_score_deltas: {
          domain_clarity: 1,
          maintainability: 1,
          delivery_confidence: 0,
          budget: 0
        },
        cumulative_stakeholder_deltas: {
          cto: 5,
          vp_product: 6
        }
      })
    })

    expect(archetype).toBe('stakeholder_whisperer')
  })

  it('classifies runaway_refactorer when architecture improves but delivery collapses', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        cumulative_score_deltas: {
          domain_clarity: 25,
          maintainability: 15,
          delivery_confidence: -25,
          budget: -20
        },
        cumulative_stakeholder_deltas: {
          cto: -5
        }
      })
    })

    expect(archetype).toBe('runaway_refactorer')
  })

  it('classifies firefighter when volatility is extreme and stability suffered', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        turns_completed: 4,
        total_events_triggered: 5,
        total_aftershocks_resolved: 2,
        cumulative_score_deltas: {
          user_trust: -8,
          team_morale: -5
        }
      })
    })

    expect(archetype).toBe('firefighter')
  })

  it('classifies system_stabilizer when improvements are moderate without dominant pattern', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        turns_completed: 5,
        total_events_triggered: 1,
        total_aftershocks_resolved: 0,
        cumulative_score_deltas: {
          domain_clarity: 4,
          maintainability: 2,
          delivery_confidence: 2,
          budget: 1,
          user_trust: 1
        },
        cumulative_stakeholder_deltas: {
          cto: 2,
          vp_product: 1
        }
      })
    })

    expect(archetype).toBe('system_stabilizer')
  })

  it('boundary_builder vs runaway_refactorer depends on final delivery_confidence', () => {
    // delivery_confidence at 30 (50 + (-20)) → boundary_builder
    const builder = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        cumulative_score_deltas: {
          domain_clarity: 20,
          maintainability: 10,
          delivery_confidence: -20,
          budget: -10
        }
      })
    })
    expect(builder).toBe('boundary_builder')

    // delivery_confidence at 29 (50 + (-21)) → runaway_refactorer
    const refactorer = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        cumulative_score_deltas: {
          domain_clarity: 20,
          maintainability: 10,
          delivery_confidence: -21,
          budget: -10
        }
      })
    })
    expect(refactorer).toBe('runaway_refactorer')
  })

  it('uses game_state scores when provided instead of delta estimates', () => {
    // Deltas suggest delivery at 50 + (-5) = 45, but actual score is 20
    const archetype = classifyOutcomeArchetype({
      game_state: {
        scores: {
          domain_clarity: 80,
          maintainability: 70,
          delivery_confidence: 20,
          budget: 15
        },
        run_analytics: createAnalytics({
          cumulative_score_deltas: {
            domain_clarity: 30,
            maintainability: 20,
            delivery_confidence: -5,
            budget: -5
          }
        })
      }
    })

    // Final delivery_confidence from scores is 20 < 30 → runaway_refactorer
    expect(archetype).toBe('runaway_refactorer')
  })

  it('firefighter takes priority over architecture archetypes when volatility is extreme', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        turns_completed: 4,
        total_events_triggered: 5,
        total_aftershocks_resolved: 1,
        cumulative_score_deltas: {
          domain_clarity: 25,
          maintainability: 15,
          delivery_confidence: -10,
          budget: -5,
          user_trust: -8,
          team_morale: -5
        }
      })
    })

    // volatility 6/4 = 1.5 >= 1.5, stability -13 < -10 → firefighter wins
    expect(archetype).toBe('firefighter')
  })

  it('is deterministic for identical run state', () => {
    const analytics = createAnalytics({
      turns_completed: 5,
      cumulative_score_deltas: {
        domain_clarity: 20,
        maintainability: 15,
        delivery_confidence: -5,
        budget: -3
      },
      cumulative_stakeholder_deltas: {
        cto: 3
      }
    })

    const first = classifyOutcomeArchetype({ run_analytics: analytics })
    const second = classifyOutcomeArchetype({ run_analytics: analytics })

    expect(first).toBe(second)
  })

  it('always returns exactly one archetype id', () => {
    const archetype = classifyOutcomeArchetype({
      run_analytics: createAnalytics({
        turns_completed: 0,
        total_events_triggered: 0,
        total_aftershocks_resolved: 0
      })
    })

    expect(archetype).toBeTruthy()
    expect(
      [
        'boundary_builder',
        'stakeholder_whisperer',
        'runaway_refactorer',
        'firefighter',
        'system_stabilizer'
      ]
    ).toContain(archetype)
  })

  it('getRunOutcome returns tier, archetype, and persistence-safe snapshot', () => {
    const scenario = createOutcomeScenario(4)
    const bundle = createEmptyBundle(scenario)

    const gameState = createInitialGameState({
      run_id: 'run-outcome-001',
      seed: 'seed-outcome-001',
      scenario_ref: { id: scenario.id, version: scenario.version },
      max_turns: scenario.max_turns,
      starting_scores: scenario.starting_scores,
      stakeholder_refs: scenario.stakeholder_refs,
      available_action_refs: [],
      available_event_refs: [],
      created_at_utc: '2026-03-07T00:00:00.000Z'
    })

    gameState.progress.run_status = 'completed_max_turns'
    gameState.run_analytics.turns_completed = 4
    gameState.scores = {
      domain_clarity: 75,
      maintainability: 65,
      delivery_confidence: 45,
      budget: 40
    }
    gameState.run_analytics.cumulative_score_deltas = {
      domain_clarity: 25,
      maintainability: 15,
      delivery_confidence: -5,
      budget: -10
    }
    gameState.run_analytics.cumulative_stakeholder_deltas = { cto: 5 }

    const outcome = getRunOutcome(gameState, bundle)

    expect(outcome).not.toBeNull()
    if (!outcome) {
      throw new Error('Expected run outcome')
    }

    expect(outcome.tier).toBeDefined()
    expect(outcome.archetype).toBe('boundary_builder')
    expect(outcome.outcome_snapshot.tier).toBe(outcome.tier)
    expect(outcome.outcome_snapshot.archetype).toBe(outcome.archetype)
    expect(outcome.outcome_snapshot.turns_completed).toBe(4)
    expect(Array.isArray(outcome.outcome_snapshot.matched_failure_conditions)).toBe(true)
  })
})
