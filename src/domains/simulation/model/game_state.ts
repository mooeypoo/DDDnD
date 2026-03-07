import { RunStatus, VersionedContentRef } from '@/shared/contracts'
import { DelayedEffectInstance } from './delayed_effect_instance'
import { TurnHistoryEntry } from './turn_history_entry'

export interface RunMeta {
  run_id: string
  seed: string
  created_at_utc: string
  last_updated_at: string
  content_pack_version?: string
}

export interface PlayerProfile {
  selected_class_ref?: VersionedContentRef
  display_name?: string
}

export interface ProgressState {
  current_turn: number
  max_turns: number
  run_status: RunStatus
}

export type ScoreSnapshot = Record<string, number>

export interface StakeholderRuntimeState {
  satisfaction: number
}

export type StakeholderSnapshot = Record<string, StakeholderRuntimeState>

export interface ActionState {
  available_action_refs: VersionedContentRef[]
  selected_action_ref: VersionedContentRef | null
  actions_played: number
  played_action_refs: VersionedContentRef[]
}

export interface EffectState {
  pending_delayed_effects: DelayedEffectInstance[]
  resolved_effect_instance_ids: string[]
}

export interface EventState {
  available_event_refs: VersionedContentRef[]
  last_event_ref: VersionedContentRef | null
  triggered_event_refs: VersionedContentRef[]
}

export interface RunAnalytics {
  turns_completed: number
  total_aftershocks_resolved: number
  total_events_triggered: number
  total_actions_played: number
  cumulative_score_deltas: Record<string, number>
  cumulative_stakeholder_deltas: Record<string, number>
  card_usage: Record<string, number>
  style_tags_used: Record<string, number>
}

/**
 * Canonical mutable runtime state for one run.
 */
export interface GameState {
  meta: RunMeta
  player_profile: PlayerProfile
  scenario_ref: VersionedContentRef
  progress: ProgressState
  scores: ScoreSnapshot
  stakeholders: StakeholderSnapshot
  action_state: ActionState
  effect_state: EffectState
  event_state: EventState
  history: TurnHistoryEntry[]
  run_analytics: RunAnalytics
}

export interface CreateInitialGameStateInput {
  run_id: string
  seed: string
  scenario_ref: VersionedContentRef
  max_turns: number
  starting_scores: ScoreSnapshot
  stakeholder_refs: VersionedContentRef[]
  available_action_refs: VersionedContentRef[]
  available_event_refs: VersionedContentRef[]
  selected_class_ref?: VersionedContentRef
  created_at_utc?: string
}

export function createInitialGameState(input: CreateInitialGameStateInput): GameState {
  const stakeholders: StakeholderSnapshot = {}
  for (const stakeholder_ref of input.stakeholder_refs) {
    stakeholders[stakeholder_ref.id] = {
      satisfaction: 50
    }
  }

  return {
    meta: {
      run_id: input.run_id,
      seed: input.seed,
      created_at_utc: input.created_at_utc ?? new Date().toISOString(),
      last_updated_at: input.created_at_utc ?? new Date().toISOString()
    },
    player_profile: {
      selected_class_ref: input.selected_class_ref
    },
    scenario_ref: input.scenario_ref,
    progress: {
      current_turn: 1,
      max_turns: input.max_turns,
      run_status: 'in_progress'
    },
    scores: { ...input.starting_scores },
    stakeholders,
    action_state: {
      available_action_refs: [...input.available_action_refs],
      selected_action_ref: null,
      actions_played: 0,
      played_action_refs: []
    },
    effect_state: {
      pending_delayed_effects: [],
      resolved_effect_instance_ids: []
    },
    event_state: {
      available_event_refs: [...input.available_event_refs],
      last_event_ref: null,
      triggered_event_refs: []
    },
    history: [],
    run_analytics: {
      turns_completed: 0,
      total_aftershocks_resolved: 0,
      total_events_triggered: 0,
      total_actions_played: 0,
      cumulative_score_deltas: {},
      cumulative_stakeholder_deltas: {},
      card_usage: {},
      style_tags_used: {}
    }
  }
}
