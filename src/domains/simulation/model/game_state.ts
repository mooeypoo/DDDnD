import { RunStatus, VersionedContentRef } from '@/shared/contracts'
import { DelayedEffectInstance } from './delayed_effect_instance'
import { TurnHistoryEntry } from './turn_history_entry'

/**
 * Immutable run identity and timestamps.
 */
export interface RunMeta {
  run_id: string
  seed: string
  created_at_utc: string
  last_updated_at: string
  content_pack_version?: string
}

/**
 * Player-selected profile metadata captured at run creation.
 */
export interface PlayerProfile {
  selected_class_ref?: VersionedContentRef
  display_name?: string
  class_score_affinity?: string
  challenge_modifier_ref?: VersionedContentRef
}

/**
 * Turn progression and terminal status for the run.
 */
export interface ProgressState {
  current_turn: number
  max_turns: number
  run_status: RunStatus
}

/**
 * Score values keyed by score id.
 */
export type ScoreSnapshot = Record<string, number>

/**
 * Runtime stakeholder state tracked by simulation.
 */
export interface StakeholderRuntimeState {
  satisfaction: number
}

/**
 * Stakeholder runtime state keyed by stakeholder id.
 */
export type StakeholderSnapshot = Record<string, StakeholderRuntimeState>

export interface CardUsageRuntimeState {
  times_used: number
  available_on_turn: number
}

/**
 * Card usage/cooldown state keyed by versioned card ref.
 */
export type CardUsageStateSnapshot = Record<string, CardUsageRuntimeState>

function toVersionedRefKey(ref: VersionedContentRef): string {
  return `${ref.id}-v${ref.version}`
}

/**
 * Action selection and usage bookkeeping for the current run.
 */
export interface ActionState {
  available_action_refs: VersionedContentRef[]
  card_usage_state: CardUsageStateSnapshot
  selected_action_ref: VersionedContentRef | null
  actions_played: number
  played_action_refs: VersionedContentRef[]
}

/**
 * Delayed-effect queue state for turn-phase resolution.
 */
export interface EffectState {
  pending_delayed_effects: DelayedEffectInstance[]
  resolved_effect_instance_ids: string[]
}

/**
 * Event selection history and availability state.
 */
export interface EventState {
  available_event_refs: VersionedContentRef[]
  last_event_ref: VersionedContentRef | null
  triggered_event_refs: VersionedContentRef[]
}

/**
 * Accumulated deterministic telemetry for run summaries.
 */
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
 *
 * This structure is simulation-owned and UI-agnostic.
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

/**
 * Inputs required to construct a deterministic initial run state.
 */
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
  stakeholder_satisfaction_override?: number
}

/**
 * Creates the canonical initial game state for a new run.
 *
 * Defaults stakeholder satisfaction to 50 unless overridden.
 */
export function createInitialGameState(input: CreateInitialGameStateInput): GameState {
  const stakeholders: StakeholderSnapshot = {}
  const baseSatisfaction = input.stakeholder_satisfaction_override ?? 50
  for (const stakeholder_ref of input.stakeholder_refs) {
    stakeholders[stakeholder_ref.id] = {
      satisfaction: baseSatisfaction
    }
  }

  const cardUsageState: CardUsageStateSnapshot = {}
  for (const actionRef of input.available_action_refs) {
    cardUsageState[toVersionedRefKey(actionRef)] = {
      times_used: 0,
      available_on_turn: 1
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
      card_usage_state: cardUsageState,
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
