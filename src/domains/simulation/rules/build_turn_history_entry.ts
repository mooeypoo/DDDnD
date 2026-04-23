import {
  ActionResolutionRecord,
  EventResolutionRecord,
  GameState,
  ResolvedAftershockRecord,
  StakeholderResolutionRecord,
  TurnHistoryEntry
} from '../model'
import { RunStatus, ScoreChangeRecord, StakeholderChangeRecord } from '@/shared/contracts'

/**
 * Deep-clones stakeholder satisfaction snapshot for persisted turn history.
 */
function cloneStakeholderSnapshot(
  stakeholders: GameState['stakeholders']
): GameState['stakeholders'] {
  const cloned: GameState['stakeholders'] = {}

  for (const stakeholderId of Object.keys(stakeholders)) {
    cloned[stakeholderId] = {
      satisfaction: stakeholders[stakeholderId].satisfaction
    }
  }

  return cloned
}

/**
 * Aggregates score changes by score id for compact history storage.
 */
function aggregateScoreChanges(scoreChanges: ScoreChangeRecord[]): ScoreChangeRecord[] {
  const totals = new Map<string, number>()

  for (const change of scoreChanges) {
    const current = totals.get(change.score_id) ?? 0
    totals.set(change.score_id, current + change.delta)
  }

  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([score_id, delta]) => ({ score_id, delta }))
}

/**
 * Aggregates stakeholder changes by stakeholder id for compact history storage.
 */
function aggregateStakeholderChanges(
  stakeholderChanges: StakeholderChangeRecord[]
): StakeholderChangeRecord[] {
  const totals = new Map<string, number>()

  for (const change of stakeholderChanges) {
    const current = totals.get(change.stakeholder_id) ?? 0
    totals.set(change.stakeholder_id, current + change.delta)
  }

  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([stakeholder_id, delta]) => ({ stakeholder_id, delta }))
}

/**
 * Inputs required to construct a persisted turn-history entry.
 */
export interface BuildTurnHistoryEntryInput {
  turn_number: number
  resolved_aftershocks: ResolvedAftershockRecord[]
  action_resolution: ActionResolutionRecord
  event_resolution: EventResolutionRecord | null
  stakeholder_resolution: StakeholderResolutionRecord
  all_score_changes: ScoreChangeRecord[]
  all_stakeholder_changes: StakeholderChangeRecord[]
  end_of_turn_scores: GameState['scores']
  end_of_turn_stakeholders: GameState['stakeholders']
  run_status_after_turn: RunStatus
}

/**
 * Builds a canonical persisted turn-history record from turn-resolution outputs.
 */
export function buildTurnHistoryEntry(input: BuildTurnHistoryEntryInput): TurnHistoryEntry {
  return {
    turn_number: input.turn_number,
    resolved_aftershocks: input.resolved_aftershocks,
    action_resolution: input.action_resolution,
    event_resolution: input.event_resolution,
    stakeholder_resolution: input.stakeholder_resolution,
    total_score_changes: aggregateScoreChanges(input.all_score_changes),
    total_stakeholder_changes: aggregateStakeholderChanges(input.all_stakeholder_changes),
    end_of_turn_scores: { ...input.end_of_turn_scores },
    end_of_turn_stakeholders: cloneStakeholderSnapshot(input.end_of_turn_stakeholders),
    run_status_after_turn: input.run_status_after_turn
  }
}
