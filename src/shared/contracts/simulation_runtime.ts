/**
 * Shared Simulation Runtime Contracts
 *
 * Lightweight reusable runtime contracts for simulation state records.
 */

export interface VersionedContentRef {
  id: string
  version: number
}

/**
 * Canonical run lifecycle status values.
 */
export type RunStatus =
  | 'in_progress'
  | 'completed_success'
  | 'completed_failure'
  | 'completed_max_turns'

/**
 * Turn-phase labels used by runtime delayed-effect and resolution records.
 */
export type TriggerPhase =
  | 'aftershocks'
  | 'player_action'
  | 'system_event'
  | 'stakeholder_resolution'
  | 'turn_wrap_up'

/**
 * Runtime score delta record.
 */
export interface ScoreChangeRecord {
  score_id: string
  delta: number
}

/**
 * Runtime stakeholder delta record.
 */
export interface StakeholderChangeRecord {
  stakeholder_id: string
  delta: number
}

/**
 * An ending's content id (an outcome archetype). Any validated content id: a
 * pack defines its own endings (journal M3.7). The base game's ten are just
 * content; the UI gives them icons and falls back for others.
 */
export type OutcomeArchetypeId = string
