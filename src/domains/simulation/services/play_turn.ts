/**
 * Play Turn
 * 
 * Resolves a complete turn following the turn resolution pipeline:
 * 
 * 1. Architectural Aftershocks - delayed effects resolve
 * 2. Player Action - selected card resolves
 * 3. System Event - random event may trigger
 * 4. Stakeholder Resolution - stakeholders react to current state
 * 5. Turn Wrap-Up - update totals, record history, check outcomes
 * 
 * This is the CORE of the simulation engine.
 * 
 * Returns:
 * - Updated game state (immutable update)
 * - Turn resolution record (what happened this turn)
 * 
 * IMPORTANT: This function must be deterministic.
 * Given the same state, bundle, action, and seed - it must produce identical results.
 */

import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord, VersionedContentRef } from '@/shared/contracts'
import { SeededRandom } from '@/shared/random/seeded_random'
import {
  ActionResolutionRecord,
  EventResolutionRecord,
  GameState,
  StakeholderResolutionRecord,
  TurnHistoryEntry,
  TurnResolutionContext
} from '../model'

export interface PlayTurnResult {
  game_state: GameState
  turn_resolution_context: TurnResolutionContext
  turn_history_entry: TurnHistoryEntry
}

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

function toDeltaRecords(
  scoreChanges: ScoreChangeRecord[]
): { score_id: string; delta: number }[] {
  return scoreChanges.map((change) => ({
    score_id: change.score_id,
    delta: change.delta
  }))
}

function toStakeholderDeltaRecords(
  stakeholderChanges: StakeholderChangeRecord[]
): { stakeholder_id: string; delta: number }[] {
  return stakeholderChanges.map((change) => ({
    stakeholder_id: change.stakeholder_id,
    delta: change.delta
  }))
}

function createStubActionResolution(
  selectedAction: VersionedContentRef,
  scenarioBundle: ScenarioBundle
): ActionResolutionRecord {
  const selectedCard = scenarioBundle.cards.get(versionRefKey(selectedAction))

  return {
    selected_action: selectedAction,
    score_changes: [],
    stakeholder_changes: [],
    queued_delayed_effects: [],
    presentation: {
      title: selectedCard?.name ?? `Action: ${selectedAction.id}`,
      summary: selectedCard?.description ?? 'Action recorded. Rule resolution is stubbed for now.'
    }
  }
}

function createStubStakeholderResolution(): StakeholderResolutionRecord {
  return {
    reactions: [],
    presentation: {
      title: 'Stakeholder Resolution',
      summary: 'Stakeholder rules are stubbed for this engine shell.'
    }
  }
}

export function playTurn(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  actionId: string,
  _random: SeededRandom
): PlayTurnResult {
  const selectedActionRef = gameState.action_state.available_action_refs.find(
    (actionRef) => actionRef.id === actionId
  )

  if (!selectedActionRef) {
    throw new Error(`Action is not available for this run: ${actionId}`)
  }

  const actionResolution = createStubActionResolution(selectedActionRef, scenarioBundle)
  const eventResolution: EventResolutionRecord | null = null
  const stakeholderResolution = createStubStakeholderResolution()

  const totalScoreChanges: ScoreChangeRecord[] = []
  const totalStakeholderChanges: StakeholderChangeRecord[] = []

  const turnResolutionContext: TurnResolutionContext = {
    turn_number: gameState.progress.current_turn,
    resolved_aftershocks: [],
    selected_action: selectedActionRef,
    action_resolution: actionResolution,
    event_resolution: eventResolution,
    stakeholder_resolution: stakeholderResolution,
    total_score_changes: totalScoreChanges,
    total_stakeholder_changes: totalStakeholderChanges
  }

  const turnsCompleted = gameState.run_analytics.turns_completed + 1
  const reachedMaxTurns = turnsCompleted >= gameState.progress.max_turns
  const runStatusAfterTurn = reachedMaxTurns ? 'completed_max_turns' : 'in_progress'

  const turnHistoryEntry: TurnHistoryEntry = {
    turn_number: gameState.progress.current_turn,
    resolved_aftershocks: turnResolutionContext.resolved_aftershocks,
    action_resolution: turnResolutionContext.action_resolution,
    event_resolution: turnResolutionContext.event_resolution,
    stakeholder_resolution: turnResolutionContext.stakeholder_resolution,
    total_score_changes: toDeltaRecords(turnResolutionContext.total_score_changes),
    total_stakeholder_changes: toStakeholderDeltaRecords(turnResolutionContext.total_stakeholder_changes),
    end_of_turn_scores: { ...gameState.scores },
    end_of_turn_stakeholders: cloneStakeholderSnapshot(gameState.stakeholders),
    run_status_after_turn: runStatusAfterTurn
  }

  const nextGameState: GameState = {
    ...gameState,
    progress: {
      ...gameState.progress,
      current_turn: reachedMaxTurns
        ? gameState.progress.max_turns
        : gameState.progress.current_turn + 1,
      run_status: runStatusAfterTurn
    },
    action_state: {
      ...gameState.action_state,
      selected_action_ref: selectedActionRef,
      actions_played: gameState.action_state.actions_played + 1,
      played_action_refs: [...gameState.action_state.played_action_refs, selectedActionRef]
    },
    history: [...gameState.history, turnHistoryEntry],
    run_analytics: {
      ...gameState.run_analytics,
      turns_completed: turnsCompleted,
      total_actions_played: gameState.run_analytics.total_actions_played + 1
    }
  }

  return {
    game_state: nextGameState,
    turn_resolution_context: turnResolutionContext,
    turn_history_entry: turnHistoryEntry
  }
}
