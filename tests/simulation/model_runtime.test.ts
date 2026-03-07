import { describe, it, expect } from 'vitest'
import {
  ActionResolutionRecord,
  createDelayedEffectInstance,
  createInitialGameState,
  EventResolutionRecord,
  StakeholderResolutionRecord,
  TurnHistoryEntry
} from '@/domains/simulation/model'

function createBaseActionResolution(): ActionResolutionRecord {
  return {
    selected_action: { id: 'define_bounded_context', version: 1 },
    score_changes: [{ score_id: 'domain_clarity', delta: 8 }],
    stakeholder_changes: [{ stakeholder_id: 'cto', delta: 2 }],
    queued_delayed_effects: [],
    presentation: {
      title: 'Defined Bounded Context',
      summary: 'A clear boundary was introduced.'
    }
  }
}

function createBaseEventResolution(): EventResolutionRecord {
  return {
    selected_event: { id: 'critical_bug_discovered', version: 1 },
    score_changes: [{ score_id: 'user_trust', delta: -8 }],
    stakeholder_changes: [{ stakeholder_id: 'operations_manager', delta: -4 }],
    queued_delayed_effects: [],
    presentation: {
      title: 'Critical Bug Discovered',
      summary: 'A production incident reduced trust.'
    }
  }
}

function createBaseStakeholderResolution(): StakeholderResolutionRecord {
  return {
    reactions: [
      {
        stakeholder_id: 'cto',
        applied_rule_refs: [{ id: 'cto_wants_clarity', version: 1 }],
        score_changes: [{ score_id: 'delivery_confidence', delta: -2 }],
        stakeholder_changes: [{ stakeholder_id: 'cto', delta: -1 }],
        presentation: {
          title: 'CTO Concerned',
          summary: 'Pressure increased due to low clarity.'
        }
      }
    ],
    presentation: {
      title: 'Stakeholder Reactions',
      summary: 'Stakeholders reacted to current state.'
    }
  }
}

describe('Simulation model runtime structures', () => {
  it('creates a serializable initial game state', () => {
    const state = createInitialGameState({
      run_id: 'run-001',
      seed: 'seed-001',
      scenario_ref: { id: 'monolith_of_mild_despair', version: 1 },
      max_turns: 8,
      starting_scores: {
        domain_clarity: 30,
        maintainability: 38,
        delivery_confidence: 45,
        developer_morale: 50,
        user_trust: 55,
        budget: 60
      },
      stakeholder_refs: [
        { id: 'cto', version: 1 },
        { id: 'vp_product', version: 1 },
        { id: 'lead_developer', version: 1 },
        { id: 'operations_manager', version: 1 }
      ],
      available_action_refs: [{ id: 'define_bounded_context', version: 1 }],
      available_event_refs: [{ id: 'critical_bug_discovered', version: 1 }],
      selected_class_ref: { id: 'boundary_mage', version: 1 },
      created_at_utc: '2026-03-07T00:00:00.000Z'
    })

    expect(state.progress.current_turn).toBe(1)
    expect(state.progress.run_status).toBe('in_progress')
    expect(state.effect_state.pending_delayed_effects).toEqual([])
    expect(state.history).toEqual([])

    expect(() => JSON.stringify(state)).not.toThrow()
  })

  it('creates deterministic delayed effect instances with expected shape', () => {
    const first = createDelayedEffectInstance({
      effect_id: 'refactoring_payoff',
      effect_version: 1,
      source_type: 'card',
      source_id: 'extract_shared_kernel',
      source_version: 1,
      source_turn: 2,
      turns_until_resolution: 2,
      trigger_phase: 'aftershocks',
      selected_flavor_index: 0
    })

    const second = createDelayedEffectInstance({
      effect_id: 'refactoring_payoff',
      effect_version: 1,
      source_type: 'card',
      source_id: 'extract_shared_kernel',
      source_version: 1,
      source_turn: 2,
      turns_until_resolution: 2,
      trigger_phase: 'aftershocks',
      selected_flavor_index: 0
    })

    expect(first).toEqual(second)
    expect(first.trigger_turn).toBe(4)
    expect(first.effect_instance_id).toContain('extract_shared_kernel')
    expect(first.is_resolved).toBe(false)

    expect(() => JSON.stringify(first)).not.toThrow()
  })

  it('constructs a canonical turn history entry with required fields', () => {
    const action_resolution = createBaseActionResolution()
    const event_resolution = createBaseEventResolution()
    const stakeholder_resolution = createBaseStakeholderResolution()

    const entry: TurnHistoryEntry = {
      turn_number: 2,
      resolved_aftershocks: [
        {
          effect_instance_id: 'card__extract_shared_kernel__v1__turn1__refactoring_payoff__v1__trig3',
          effect_id: 'refactoring_payoff',
          effect_version: 1,
          source_type: 'card',
          source_id: 'extract_shared_kernel',
          source_version: 1,
          score_changes: [{ score_id: 'maintainability', delta: 8 }],
          stakeholder_changes: [],
          presentation: {
            title: 'Refactoring Pays Off',
            summary: 'Maintainability improved.'
          }
        }
      ],
      action_resolution,
      event_resolution,
      stakeholder_resolution,
      total_score_changes: [{ score_id: 'maintainability', delta: 8 }],
      total_stakeholder_changes: [{ stakeholder_id: 'cto', delta: -1 }],
      end_of_turn_scores: {
        domain_clarity: 38,
        maintainability: 46,
        delivery_confidence: 43,
        developer_morale: 50,
        user_trust: 47,
        budget: 55
      },
      end_of_turn_stakeholders: {
        cto: { satisfaction: 49 },
        vp_product: { satisfaction: 50 },
        lead_developer: { satisfaction: 52 },
        operations_manager: { satisfaction: 48 }
      },
      run_status_after_turn: 'in_progress'
    }

    expect(entry.turn_number).toBe(2)
    expect(entry.action_resolution.selected_action.id).toBe('define_bounded_context')
    expect(entry.event_resolution?.selected_event.id).toBe('critical_bug_discovered')
    expect(() => JSON.stringify(entry)).not.toThrow()
  })

  it('does not require Vue, browser, or persistence APIs for model construction', () => {
    const state = createInitialGameState({
      run_id: 'run-model-apis',
      seed: 'seed-model-apis',
      scenario_ref: { id: 'monolith_of_mild_despair', version: 1 },
      max_turns: 8,
      starting_scores: { domain_clarity: 30 },
      stakeholder_refs: [{ id: 'cto', version: 1 }],
      available_action_refs: [{ id: 'define_bounded_context', version: 1 }],
      available_event_refs: [{ id: 'critical_bug_discovered', version: 1 }],
      created_at_utc: '2026-03-07T00:00:00.000Z'
    })

    expect(state.meta.run_id).toBe('run-model-apis')
    expect(typeof state.meta.seed).toBe('string')
  })
})
