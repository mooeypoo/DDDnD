import { describe, expect, it } from 'vitest'
import {
  addToBundle,
  Card,
  createEmptyBundle,
  DelayedEffect,
  Event,
  OutcomeTier,
  Scenario,
  ScenarioBundle,
  Score,
  Stakeholder,
  StakeholderReactionRule
} from '@/domains/content/model'
import { create_engine } from '@/domains/simulation/services'
import { createDelayedEffectInstance } from '@/domains/simulation/model'

function buildTestBundle(input?: {
  max_turns?: number
  failure_conditions?: Scenario['failure_conditions']
}): ScenarioBundle {
  const scenario: Scenario = {
    id: 'simulation_pipeline_test',
    version: 1,
    name: 'Simulation Pipeline Test',
    description: 'Scenario used for deterministic turn pipeline testing',
    max_turns: input?.max_turns ?? 3,
    starting_scores: {
      technical_debt: 50,
      team_morale: 60,
      budget: 40,
      delivery_confidence: 45
    },
    score_refs: [
      { id: 'technical_debt', version: 1 },
      { id: 'team_morale', version: 1 },
      { id: 'budget', version: 1 },
      { id: 'delivery_confidence', version: 1 }
    ],
    stakeholder_refs: [{ id: 'tech_lead', version: 1 }],
    card_refs: [
      { id: 'stabilize_module', version: 1 },
      { id: 'cut_corners', version: 1 }
    ],
    event_refs: [
      { id: 'dependency_incident', version: 1 },
      { id: 'good_press', version: 1 }
    ],
    outcome_tier_refs: [
      { id: 'collapse', version: 1 },
      { id: 'struggle', version: 1 },
      { id: 'survival', version: 1 },
      { id: 'success', version: 1 },
      { id: 'triumph', version: 1 }
    ],
    failure_conditions: input?.failure_conditions
  }

  const bundle = createEmptyBundle(scenario)

  const scores: Score[] = [
    {
      id: 'technical_debt',
      version: 1,
      name: 'Technical Debt',
      description: 'Debt level',
      default_value: 50,
      min_value: 0,
      max_value: 100
    },
    {
      id: 'team_morale',
      version: 1,
      name: 'Team Morale',
      description: 'Morale level',
      default_value: 60,
      min_value: 0,
      max_value: 100
    },
    {
      id: 'budget',
      version: 1,
      name: 'Budget',
      description: 'Budget health',
      default_value: 40,
      min_value: 0,
      max_value: 100
    },
    {
      id: 'delivery_confidence',
      version: 1,
      name: 'Delivery confidence',
      description: 'Delivery confidence',
      default_value: 45,
      min_value: 0,
      max_value: 100
    }
  ]

  for (const score of scores) {
    addToBundle(bundle, 'score', score)
  }

  const rulePrimary: StakeholderReactionRule = {
    id: 'lead_pushes_quality',
    version: 1,
    name: 'Lead pushes quality',
    description: 'When debt is high, morale dips while pushing quality',
    condition_description: 'Technical debt > 40',
    score_changes: [
      { score_id: 'team_morale', delta: -2 },
      { score_id: 'technical_debt', delta: -30 }
    ],
    priority: 10
  }

  const ruleSecondary: StakeholderReactionRule = {
    id: 'secondary_trigger',
    version: 1,
    name: 'Secondary trigger',
    description: 'Should not activate recursively in same phase',
    condition_description: 'Technical debt < 40',
    score_changes: [{ score_id: 'delivery_confidence', delta: -4 }],
    priority: 20
  }

  addToBundle(bundle, 'stakeholder_reaction_rule', rulePrimary)
  addToBundle(bundle, 'stakeholder_reaction_rule', ruleSecondary)

  const stakeholder: Stakeholder = {
    id: 'tech_lead',
    version: 1,
    name: 'Tech Lead',
    description: 'Primary stakeholder',
    reaction_rule_refs: [
      { id: 'lead_pushes_quality', version: 1 },
      { id: 'secondary_trigger', version: 1 }
    ]
  }

  addToBundle(bundle, 'stakeholder', stakeholder)

  const delayedEffects: DelayedEffect[] = [
    {
      id: 'aftershock_a',
      version: 1,
      name: 'Aftershock A',
      description: 'First deterministic aftershock',
      turns_until_resolution: 1,
      score_changes: [{ score_id: 'technical_debt', delta: -3 }]
    },
    {
      id: 'aftershock_b',
      version: 1,
      name: 'Aftershock B',
      description: 'Second deterministic aftershock',
      turns_until_resolution: 1,
      score_changes: [{ score_id: 'team_morale', delta: 2 }]
    }
  ]

  for (const effect of delayedEffects) {
    addToBundle(bundle, 'delayed_effect', effect)
  }

  const stabilizeCard: Card = {
    id: 'stabilize_module',
    version: 1,
    name: 'Stabilize Module',
    description: 'Apply disciplined refactoring',
    score_changes: [
      { score_id: 'technical_debt', delta: -12 },
      { score_id: 'budget', delta: -5 }
    ],
    stakeholder_changes: [{ stakeholder_id: 'tech_lead', delta: 3 }],
    delayed_effect_refs: [
      { id: 'aftershock_b', version: 1 },
      { id: 'aftershock_a', version: 1 }
    ],
    requirements: [
      {
        target_type: 'score',
        target_id: 'technical_debt',
        operator: '>=',
        value: 40
      }
    ],
    style_tags: ['refactoring']
  }

  const cutCornersCard: Card = {
    id: 'cut_corners',
    version: 1,
    name: 'Cut Corners',
    description: 'Ship under pressure',
    score_changes: [
      { score_id: 'budget', delta: -60 },
      { score_id: 'technical_debt', delta: 15 }
    ],
    delayed_effect_refs: []
  }

  addToBundle(bundle, 'card', stabilizeCard)
  addToBundle(bundle, 'card', cutCornersCard)

  const events: Event[] = [
    {
      id: 'dependency_incident',
      version: 1,
      name: 'Dependency Incident',
      description: 'An upstream package breaks unexpectedly',
      occurrence_weight: 3,
      score_changes: [{ score_id: 'technical_debt', delta: 6 }],
      delayed_effect_refs: []
    },
    {
      id: 'good_press',
      version: 1,
      name: 'Good Press',
      description: 'A small PR wave improves confidence',
      occurrence_weight: 2,
      score_changes: [{ score_id: 'delivery_confidence', delta: 4 }],
      delayed_effect_refs: [],
      trigger_condition_description: 'Team morale > 40'
    }
  ]

  for (const event of events) {
    addToBundle(bundle, 'event', event)
  }

  const outcomeTiers: OutcomeTier[] = [
    {
      id: 'collapse',
      version: 1,
      name: 'Collapse',
      description: 'Collapse',
      rank: 1
    },
    {
      id: 'struggle',
      version: 1,
      name: 'Struggle',
      description: 'Struggle',
      rank: 2
    },
    {
      id: 'survival',
      version: 1,
      name: 'Survival',
      description: 'Survival',
      rank: 3
    },
    {
      id: 'success',
      version: 1,
      name: 'Success',
      description: 'Success',
      rank: 4
    },
    {
      id: 'triumph',
      version: 1,
      name: 'Triumph',
      description: 'Triumph',
      rank: 5
    }
  ]

  for (const tier of outcomeTiers) {
    addToBundle(bundle, 'outcome_tier', tier)
  }

  return bundle
}

describe('Simulation deterministic turn pipeline', () => {
  it('resolves delayed effects at the start of the turn', () => {
    const engine = create_engine({ scenario_bundle: buildTestBundle(), seed: 'aftershock-seed' })
    engine.create_run()

    engine.play_turn('stabilize_module')
    const turnTwoResult = engine.play_turn('cut_corners')

    expect(turnTwoResult.turn_resolution_context.resolved_aftershocks.length).toBeGreaterThan(0)
    expect(turnTwoResult.turn_resolution_context.resolved_aftershocks[0].effect_id).toBe('aftershock_a')
    expect(turnTwoResult.game_state.effect_state.resolved_effect_instance_ids.length).toBeGreaterThan(0)
  })

  it('resolves multiple delayed effects together in deterministic order', () => {
    const bundle = buildTestBundle()
    const engine = create_engine({ scenario_bundle: bundle, seed: 'det-order-seed' })
    const state = engine.create_run()

    state.effect_state.pending_delayed_effects = [
      createDelayedEffectInstance({
        effect_id: 'aftershock_b',
        effect_version: 1,
        source_type: 'card',
        source_id: 'stabilize_module',
        source_version: 1,
        source_turn: 0,
        turns_until_resolution: 1
      }),
      createDelayedEffectInstance({
        effect_id: 'aftershock_a',
        effect_version: 1,
        source_type: 'card',
        source_id: 'stabilize_module',
        source_version: 1,
        source_turn: 0,
        turns_until_resolution: 1
      })
    ]

    const result = engine.play_turn('stabilize_module')
    const orderedEffectIds = result.turn_resolution_context.resolved_aftershocks.map((effect) => effect.effect_id)
    expect(orderedEffectIds).toEqual(['aftershock_a', 'aftershock_b'])
  })

  it('applies immediate action score and stakeholder changes', () => {
    const engine = create_engine({ scenario_bundle: buildTestBundle(), seed: 'action-immediate-seed' })
    engine.create_run()

    const result = engine.play_turn('stabilize_module')
    expect(result.turn_resolution_context.action_resolution.score_changes).toEqual([
      { score_id: 'technical_debt', delta: -12 },
      { score_id: 'budget', delta: -5 }
    ])
    expect(result.turn_resolution_context.action_resolution.stakeholder_changes).toEqual([
      { stakeholder_id: 'tech_lead', delta: 3 }
    ])
  })

  it('queues delayed effects from action resolution', () => {
    const engine = create_engine({ scenario_bundle: buildTestBundle(), seed: 'action-delayed-seed' })
    engine.create_run()

    const result = engine.play_turn('stabilize_module')
    expect(result.turn_resolution_context.action_resolution.queued_delayed_effects).toHaveLength(2)
    expect(result.game_state.effect_state.pending_delayed_effects).toHaveLength(2)
  })

  it('resolves at most one event per turn', () => {
    const engine = create_engine({ scenario_bundle: buildTestBundle(), seed: 'one-event-seed' })
    engine.create_run()

    const result = engine.play_turn('stabilize_module')
    expect(result.turn_resolution_context.event_resolution === null || result.turn_resolution_context.event_resolution.selected_event).toBeTruthy()
    expect(result.game_state.event_state.triggered_event_refs.length).toBeLessThanOrEqual(1)
  })

  it('produces deterministic event choices and turn outcomes for same seed and actions', () => {
    const bundle = buildTestBundle()
    const actions = ['cut_corners', 'cut_corners']

    const engineA = create_engine({ scenario_bundle: bundle, seed: 'deterministic-seed' })
    const engineB = create_engine({ scenario_bundle: bundle, seed: 'deterministic-seed' })

    engineA.create_run()
    engineB.create_run()

    const contextsA = actions.map((actionId) => engineA.play_turn(actionId).turn_resolution_context)
    const contextsB = actions.map((actionId) => engineB.play_turn(actionId).turn_resolution_context)

    expect(contextsA).toEqual(contextsB)
    expect(engineA.get_turn_briefing()).toEqual(engineB.get_turn_briefing())
  })

  it('evaluates stakeholder rules once per turn', () => {
    const bundle = buildTestBundle()

    for (const event of bundle.events.values()) {
      event.occurrence_weight = 0
    }

    const engine = create_engine({ scenario_bundle: bundle, seed: 'stakeholder-once-seed' })
    engine.create_run()

    const result = engine.play_turn('cut_corners')
    expect(result.turn_resolution_context.stakeholder_resolution.reactions).toHaveLength(1)
    expect(result.turn_resolution_context.stakeholder_resolution.reactions[0].applied_rule_refs).toEqual([
      { id: 'lead_pushes_quality', version: 1 }
    ])
  })

  it('does not recursively trigger stakeholder rules in the same phase', () => {
    const bundle = buildTestBundle()

    for (const event of bundle.events.values()) {
      event.occurrence_weight = 0
    }

    const engine = create_engine({ scenario_bundle: bundle, seed: 'stakeholder-no-recursion-seed' })
    engine.create_run()

    const result = engine.play_turn('cut_corners')
    const appliedRuleIds = result.turn_resolution_context.stakeholder_resolution.reactions.flatMap((reaction) =>
      reaction.applied_rule_refs.map((ruleRef) => ruleRef.id)
    )

    expect(appliedRuleIds).toContain('lead_pushes_quality')
    expect(appliedRuleIds).not.toContain('secondary_trigger')
  })

  it('appends exactly one turn history entry with major sections', () => {
    const engine = create_engine({ scenario_bundle: buildTestBundle(), seed: 'history-seed' })
    engine.create_run()

    const result = engine.play_turn('stabilize_module')
    expect(result.game_state.history).toHaveLength(1)
    expect(result.turn_history_entry.action_resolution.selected_action.id).toBe('stabilize_module')
    expect(result.turn_history_entry.stakeholder_resolution.presentation.title).toBe('Stakeholder Resolution')
    expect(Array.isArray(result.turn_history_entry.total_score_changes)).toBe(true)
  })

  it('updates run outcome for max turns and failure conditions', () => {
    const maxTurnsEngine = create_engine({
      scenario_bundle: buildTestBundle({ max_turns: 1 }),
      seed: 'max-turn-seed'
    })
    maxTurnsEngine.create_run()
    maxTurnsEngine.play_turn('stabilize_module')

    const maxTurnsOutcome = maxTurnsEngine.get_run_outcome()
    expect(maxTurnsOutcome?.completion_reason).toBe('max_turns_reached')

    const failureEngine = create_engine({
      scenario_bundle: buildTestBundle({
        max_turns: 3,
        failure_conditions: [
          {
            target_type: 'score',
            target_id: 'budget',
            operator: '<=',
            value: 0
          }
        ]
      }),
      seed: 'failure-seed'
    })

    failureEngine.create_run()
    failureEngine.play_turn('cut_corners')

    const failureOutcome = failureEngine.get_run_outcome()
    expect(failureOutcome?.completion_reason).toBe('failure_condition_met')
    expect(failureOutcome?.run_status).toBe('completed_failure')
  })
})
