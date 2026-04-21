import {
  ActionState,
  EffectState,
  EventState,
  GameState,
  PlayerProfile,
  ProgressState,
  RunAnalytics,
  RunMeta,
  ScoreSnapshot,
  StakeholderSnapshot,
  TurnHistoryEntry
} from '@/domains/simulation/model'
import { RunStatus, VersionedContentRef } from '@/shared/contracts'

/**
 * Validation helpers for persistence payload decoding.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isRunStatus(value: unknown): value is RunStatus {
  return (
    value === 'in_progress' ||
    value === 'completed_success' ||
    value === 'completed_failure' ||
    value === 'completed_max_turns'
  )
}

function isVersionedContentRef(value: unknown): value is VersionedContentRef {
  if (!isObject(value)) {
    return false
  }

  return isString(value.id) && value.id.length > 0 && isNumber(value.version) && value.version > 0
}

function isVersionedContentRefArray(value: unknown): value is VersionedContentRef[] {
  return Array.isArray(value) && value.every(isVersionedContentRef)
}

function isCardUsageStateSnapshot(value: unknown): boolean {
  if (!isObject(value)) {
    return false
  }

  return Object.entries(value).every(([cardKey, cardUsage]) => {
    if (!cardKey || !isObject(cardUsage)) {
      return false
    }

    return (
      isNumber(cardUsage.times_used) &&
      cardUsage.times_used >= 0 &&
      isNumber(cardUsage.available_on_turn) &&
      cardUsage.available_on_turn >= 1
    )
  })
}

function isScoreSnapshot(value: unknown): value is ScoreSnapshot {
  if (!isObject(value)) {
    return false
  }

  return Object.entries(value).every(([scoreId, scoreValue]) => {
    return scoreId.length > 0 && isNumber(scoreValue)
  })
}

function isStakeholderSnapshot(value: unknown): value is StakeholderSnapshot {
  if (!isObject(value)) {
    return false
  }

  return Object.entries(value).every(([stakeholderId, stakeholderState]) => {
    if (!stakeholderId || !isObject(stakeholderState)) {
      return false
    }

    return isNumber(stakeholderState.satisfaction)
  })
}

function isRunMeta(value: unknown): value is RunMeta {
  if (!isObject(value)) {
    return false
  }

  if (
    !isString(value.run_id) ||
    !isString(value.seed) ||
    !isString(value.created_at_utc) ||
    !isString(value.last_updated_at)
  ) {
    return false
  }

  if (value.content_pack_version !== undefined && !isString(value.content_pack_version)) {
    return false
  }

  return true
}

function isPlayerProfile(value: unknown): value is PlayerProfile {
  if (!isObject(value)) {
    return false
  }

  if (value.selected_class_ref !== undefined && !isVersionedContentRef(value.selected_class_ref)) {
    return false
  }

  if (value.display_name !== undefined && !isString(value.display_name)) {
    return false
  }

  return true
}

function isProgressState(value: unknown): value is ProgressState {
  if (!isObject(value)) {
    return false
  }

  return (
    isNumber(value.current_turn) &&
    isNumber(value.max_turns) &&
    isRunStatus(value.run_status) &&
    value.current_turn >= 1 &&
    value.max_turns >= 1
  )
}

function isActionState(value: unknown): value is ActionState {
  if (!isObject(value)) {
    return false
  }

  return (
    isVersionedContentRefArray(value.available_action_refs) &&
    (value.card_usage_state === undefined || isCardUsageStateSnapshot(value.card_usage_state)) &&
    (value.selected_action_ref === null || isVersionedContentRef(value.selected_action_ref)) &&
    isNumber(value.actions_played) &&
    isVersionedContentRefArray(value.played_action_refs)
  )
}

function isDelayedEffectInstance(value: unknown): boolean {
  if (!isObject(value)) {
    return false
  }

  return (
    isString(value.effect_instance_id) &&
    isString(value.effect_id) &&
    isNumber(value.effect_version) &&
    (value.source_type === 'card' || value.source_type === 'event') &&
    isString(value.source_id) &&
    isNumber(value.source_version) &&
    isNumber(value.source_turn) &&
    isNumber(value.trigger_turn) &&
    (value.trigger_phase === 'aftershocks' ||
      value.trigger_phase === 'player_action' ||
      value.trigger_phase === 'system_event' ||
      value.trigger_phase === 'stakeholder_resolution' ||
      value.trigger_phase === 'turn_wrap_up') &&
    isNumber(value.selected_flavor_index) &&
    isBoolean(value.is_resolved)
  )
}

function isEffectState(value: unknown): value is EffectState {
  if (!isObject(value)) {
    return false
  }

  return (
    Array.isArray(value.pending_delayed_effects) &&
    value.pending_delayed_effects.every(isDelayedEffectInstance) &&
    Array.isArray(value.resolved_effect_instance_ids) &&
    value.resolved_effect_instance_ids.every(isString)
  )
}

function isEventState(value: unknown): value is EventState {
  if (!isObject(value)) {
    return false
  }

  return (
    isVersionedContentRefArray(value.available_event_refs) &&
    (value.last_event_ref === null || isVersionedContentRef(value.last_event_ref)) &&
    isVersionedContentRefArray(value.triggered_event_refs)
  )
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!isObject(value)) {
    return false
  }

  return Object.entries(value).every(([recordKey, recordValue]) => {
    return recordKey.length > 0 && isNumber(recordValue)
  })
}

function isRunAnalytics(value: unknown): value is RunAnalytics {
  if (!isObject(value)) {
    return false
  }

  return (
    isNumber(value.turns_completed) &&
    isNumber(value.total_aftershocks_resolved) &&
    isNumber(value.total_events_triggered) &&
    isNumber(value.total_actions_played) &&
    isNumberRecord(value.cumulative_score_deltas) &&
    isNumberRecord(value.cumulative_stakeholder_deltas) &&
    isNumberRecord(value.card_usage) &&
    isNumberRecord(value.style_tags_used)
  )
}

function hasTurnHistoryCoreFields(entry: unknown): entry is TurnHistoryEntry {
  if (!isObject(entry)) {
    return false
  }

  if (!isNumber(entry.turn_number)) {
    return false
  }

  if (!Array.isArray(entry.resolved_aftershocks)) {
    return false
  }

  if (!isObject(entry.action_resolution) || !isObject(entry.stakeholder_resolution)) {
    return false
  }

  if (!Array.isArray(entry.total_score_changes) || !Array.isArray(entry.total_stakeholder_changes)) {
    return false
  }

  if (!isScoreSnapshot(entry.end_of_turn_scores) || !isStakeholderSnapshot(entry.end_of_turn_stakeholders)) {
    return false
  }

  if (!isRunStatus(entry.run_status_after_turn)) {
    return false
  }

  if (entry.event_resolution !== null && entry.event_resolution !== undefined && !isObject(entry.event_resolution)) {
    return false
  }

  return true
}

function isTurnHistory(value: unknown): value is TurnHistoryEntry[] {
  return Array.isArray(value) && value.every(hasTurnHistoryCoreFields)
}

/**
 * Type guard for game_state payload.
 */
export function isGameState(value: unknown): value is GameState {
  if (!isObject(value)) {
    return false
  }

  return (
    isRunMeta(value.meta) &&
    isPlayerProfile(value.player_profile) &&
    isVersionedContentRef(value.scenario_ref) &&
    isProgressState(value.progress) &&
    isScoreSnapshot(value.scores) &&
    isStakeholderSnapshot(value.stakeholders) &&
    isActionState(value.action_state) &&
    isEffectState(value.effect_state) &&
    isEventState(value.event_state) &&
    isTurnHistory(value.history) &&
    isRunAnalytics(value.run_analytics)
  )
}

/**
 * Type guard for generic object record.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value)
}

/**
 * Type guard for non-empty string values.
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0
}

/**
 * Type guard for positive integers.
 */
export function isPositiveInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value > 0
}

/**
 * Type guard for versioned content reference.
 */
export function isVersionedRef(value: unknown): value is VersionedContentRef {
  return isVersionedContentRef(value)
}

/**
 * Type guard for arrays of versioned content references.
 */
export function isVersionedRefArray(value: unknown): value is VersionedContentRef[] {
  return isVersionedContentRefArray(value)
}

/**
 * Type guard for turn history arrays.
 */
export function isTurnHistoryArray(value: unknown): value is TurnHistoryEntry[] {
  return isTurnHistory(value)
}
