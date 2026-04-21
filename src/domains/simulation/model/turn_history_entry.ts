import { RunStatus } from '@/shared/contracts'
import {
  ActionResolutionRecord,
  EventResolutionRecord,
  ResolvedAftershockRecord,
  StakeholderResolutionRecord
} from './turn_resolution_context'
import { ScoreSnapshot, StakeholderSnapshot } from './game_state'

/**
 * Canonical archived turn record stored in game history.
 *
 * This is persisted run history, distinct from transient turn-resolution context.
 */
export interface TurnHistoryEntry {
  turn_number: number
  resolved_aftershocks: ResolvedAftershockRecord[]
  action_resolution: ActionResolutionRecord
  event_resolution: EventResolutionRecord | null
  stakeholder_resolution: StakeholderResolutionRecord
  total_score_changes: { score_id: string; delta: number }[]
  total_stakeholder_changes: { stakeholder_id: string; delta: number }[]
  end_of_turn_scores: ScoreSnapshot
  end_of_turn_stakeholders: StakeholderSnapshot
  run_status_after_turn: RunStatus
}
