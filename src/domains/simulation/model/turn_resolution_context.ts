import {
  ScoreChangeRecord,
  StakeholderChangeRecord,
  TriggerPhase,
  VersionedContentRef
} from '@/shared/contracts'

/**
 * Generic presentation fields suitable for logs and UI surfaces.
 *
 * These fields are simulation outputs and do not introduce UI-owned rule logic.
 */
export interface PresentationRecord {
  title: string
  summary: string
  flavor_text?: string
  risk_hint?: string
}

export interface QueuedDelayedEffectReference {
  effect_instance_id: string
  effect_id: string
  effect_version: number
  trigger_turn: number
  trigger_phase: TriggerPhase
}

/**
 * Runtime record of a delayed effect resolved in aftershocks phase.
 */
export interface ResolvedAftershockRecord {
  effect_instance_id: string
  effect_id: string
  effect_version: number
  source_type: 'card' | 'event'
  source_id: string
  source_version: number
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  presentation: PresentationRecord
}

/**
 * Runtime record of player action resolution for one turn.
 */
export interface ActionResolutionRecord {
  selected_action: VersionedContentRef
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  queued_delayed_effects: QueuedDelayedEffectReference[]
  presentation: PresentationRecord
}

/**
 * Runtime record of selected system event resolution.
 */
export interface EventResolutionRecord {
  selected_event: VersionedContentRef
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  queued_delayed_effects: QueuedDelayedEffectReference[]
  presentation: PresentationRecord
}

/**
 * Runtime record of one stakeholder's applied rules for a turn.
 */
export interface StakeholderReactionRecord {
  stakeholder_id: string
  applied_rule_refs: VersionedContentRef[]
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  presentation: PresentationRecord
}

/**
 * Aggregated stakeholder resolution details for the turn.
 */
export interface StakeholderResolutionRecord {
  reactions: StakeholderReactionRecord[]
  presentation: PresentationRecord
}

/**
 * Transient per-turn resolution context for internal engine flow.
 *
 * This context is not the persisted turn archive format.
 */
export interface TurnResolutionContext {
  turn_number: number
  resolved_aftershocks: ResolvedAftershockRecord[]
  selected_action: VersionedContentRef
  action_resolution: ActionResolutionRecord
  event_resolution: EventResolutionRecord | null
  stakeholder_resolution: StakeholderResolutionRecord
  total_score_changes: ScoreChangeRecord[]
  total_stakeholder_changes: StakeholderChangeRecord[]
}
