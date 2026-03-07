/**
 * Shared Simulation Runtime Contracts
 *
 * Lightweight reusable runtime contracts for simulation state records.
 */

export interface VersionedContentRef {
  id: string
  version: number
}

export type RunStatus =
  | 'in_progress'
  | 'completed_success'
  | 'completed_failure'
  | 'completed_max_turns'

export type TriggerPhase =
  | 'aftershocks'
  | 'player_action'
  | 'system_event'
  | 'stakeholder_resolution'
  | 'turn_wrap_up'

export interface ScoreChangeRecord {
  score_id: string
  delta: number
}

export interface StakeholderChangeRecord {
  stakeholder_id: string
  delta: number
}
