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

import { ScenarioBundle } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord } from '@/shared/contracts'
import { SeededRandom } from '@/shared/random/seeded_random'
import {
  GameState,
  TurnHistoryEntry,
  TurnResolutionContext
} from '../model'
import {
  applyScoreChanges,
  applyStakeholderChanges,
  buildTurnHistoryEntry,
  classifyRunOutcome,
  getCardNextAvailableTurn,
  resolveAction,
  resolveArchitecturalAftershocks,
  resolveEvent,
  resolveStakeholderRules
} from '../rules'
import { versionRefKey } from '@/domains/content/model'

export interface PlayTurnResult {
  game_state: GameState
  turn_resolution_context: TurnResolutionContext
  turn_history_entry: TurnHistoryEntry
}

function mergeScoreDeltas(
  existing: Record<string, number>,
  changes: ScoreChangeRecord[]
): Record<string, number> {
  const next = { ...existing }

  for (const change of changes) {
    next[change.score_id] = (next[change.score_id] ?? 0) + change.delta
  }

  return next
}

function mergeStakeholderDeltas(
  existing: Record<string, number>,
  changes: StakeholderChangeRecord[]
): Record<string, number> {
  const next = { ...existing }

  for (const change of changes) {
    next[change.stakeholder_id] = (next[change.stakeholder_id] ?? 0) + change.delta
  }

  return next
}

function mergeUsageCounters(
  existing: Record<string, number>,
  keys: string[]
): Record<string, number> {
  const next = { ...existing }

  for (const key of keys) {
    next[key] = (next[key] ?? 0) + 1
  }

  return next
}

function computeDeterministicLastUpdatedAt(createdAtUtc: string, turnsCompleted: number): string {
  const baseTimestamp = Date.parse(createdAtUtc)
  if (Number.isNaN(baseTimestamp)) {
    return createdAtUtc
  }

  return new Date(baseTimestamp + turnsCompleted * 1000).toISOString()
}

export function playTurn(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  actionId: string,
  random: SeededRandom
): PlayTurnResult {
  if (gameState.progress.run_status !== 'in_progress') {
    throw new Error('Cannot play a turn on a completed run.')
  }

  const aftershocksResult = resolveArchitecturalAftershocks(gameState, scenarioBundle)
  let nextScores = applyScoreChanges(gameState.scores, aftershocksResult.score_changes, scenarioBundle)
  let nextStakeholders = applyStakeholderChanges(
    gameState.stakeholders,
    aftershocksResult.stakeholder_changes
  )

  const actionResult = resolveAction(actionId, gameState, scenarioBundle, {
    scores: nextScores,
    stakeholders: nextStakeholders
  })

  // Class affinity bonus: +1 to the class's affinity score during action phase
  const classAffinityBonus: ScoreChangeRecord[] = []
  if (gameState.player_profile.class_score_affinity) {
    classAffinityBonus.push({
      score_id: gameState.player_profile.class_score_affinity,
      delta: 1
    })
  }

  nextScores = applyScoreChanges(nextScores, [...actionResult.score_changes, ...classAffinityBonus], scenarioBundle)
  nextStakeholders = applyStakeholderChanges(nextStakeholders, actionResult.stakeholder_changes)

  const eventResult = resolveEvent(gameState, scenarioBundle, random, {
    scores: nextScores,
    stakeholders: nextStakeholders
  })

  nextScores = applyScoreChanges(nextScores, eventResult.score_changes, scenarioBundle)
  nextStakeholders = applyStakeholderChanges(nextStakeholders, eventResult.stakeholder_changes)

  const stakeholderResult = resolveStakeholderRules(scenarioBundle, {
    scores: nextScores,
    stakeholders: nextStakeholders
  })

  nextScores = applyScoreChanges(nextScores, stakeholderResult.score_changes, scenarioBundle)
  nextStakeholders = applyStakeholderChanges(nextStakeholders, stakeholderResult.stakeholder_changes)

  const allScoreChanges = [
    ...aftershocksResult.score_changes,
    ...actionResult.score_changes,
    ...classAffinityBonus,
    ...eventResult.score_changes,
    ...stakeholderResult.score_changes
  ]

  const allStakeholderChanges = [
    ...aftershocksResult.stakeholder_changes,
    ...actionResult.stakeholder_changes,
    ...eventResult.stakeholder_changes,
    ...stakeholderResult.stakeholder_changes
  ]

  const turnsCompleted = gameState.run_analytics.turns_completed + 1
  const pendingDelayedEffects = [
    ...aftershocksResult.remaining_pending_effects,
    ...actionResult.queued_delayed_effects,
    ...eventResult.queued_delayed_effects
  ]

  const tentativeGameState: GameState = {
    ...gameState,
    scores: nextScores,
    stakeholders: nextStakeholders,
    effect_state: {
      ...gameState.effect_state,
      pending_delayed_effects: pendingDelayedEffects,
      resolved_effect_instance_ids: [
        ...gameState.effect_state.resolved_effect_instance_ids,
        ...aftershocksResult.resolved_effect_instance_ids
      ]
    },
    run_analytics: {
      ...gameState.run_analytics,
      turns_completed: turnsCompleted,
      total_aftershocks_resolved:
        gameState.run_analytics.total_aftershocks_resolved + aftershocksResult.resolved_aftershocks.length,
      total_events_triggered:
        gameState.run_analytics.total_events_triggered + (eventResult.event_resolution ? 1 : 0),
      total_actions_played: gameState.run_analytics.total_actions_played + 1,
      cumulative_score_deltas: mergeScoreDeltas(
        gameState.run_analytics.cumulative_score_deltas,
        allScoreChanges
      ),
      cumulative_stakeholder_deltas: mergeStakeholderDeltas(
        gameState.run_analytics.cumulative_stakeholder_deltas,
        allStakeholderChanges
      ),
      card_usage: mergeUsageCounters(gameState.run_analytics.card_usage, [actionResult.selected_action_ref.id]),
      style_tags_used: mergeUsageCounters(
        gameState.run_analytics.style_tags_used,
        actionResult.style_tags
      )
    }
  }

  const outcome = classifyRunOutcome(tentativeGameState, scenarioBundle)

  const runStatusAfterTurn =
    outcome?.run_status ??
    (turnsCompleted >= gameState.progress.max_turns ? 'completed_max_turns' : 'in_progress')

  const turnHistoryEntry = buildTurnHistoryEntry({
    turn_number: gameState.progress.current_turn,
    resolved_aftershocks: aftershocksResult.resolved_aftershocks,
    action_resolution: actionResult.action_resolution,
    event_resolution: eventResult.event_resolution,
    stakeholder_resolution: stakeholderResult.stakeholder_resolution,
    all_score_changes: allScoreChanges,
    all_stakeholder_changes: allStakeholderChanges,
    end_of_turn_scores: nextScores,
    end_of_turn_stakeholders: nextStakeholders,
    run_status_after_turn: runStatusAfterTurn
  })

  const totalScoreChanges: ScoreChangeRecord[] = turnHistoryEntry.total_score_changes.map((change) => ({
    score_id: change.score_id,
    delta: change.delta
  }))

  const totalStakeholderChanges: StakeholderChangeRecord[] = turnHistoryEntry.total_stakeholder_changes.map(
    (change) => ({
      stakeholder_id: change.stakeholder_id,
      delta: change.delta
    })
  )

  const turnResolutionContext: TurnResolutionContext = {
    turn_number: gameState.progress.current_turn,
    resolved_aftershocks: aftershocksResult.resolved_aftershocks,
    selected_action: actionResult.selected_action_ref,
    action_resolution: actionResult.action_resolution,
    event_resolution: eventResult.event_resolution,
    stakeholder_resolution: stakeholderResult.stakeholder_resolution,
    total_score_changes: totalScoreChanges,
    total_stakeholder_changes: totalStakeholderChanges
  }

  const selectedCardKey = versionRefKey(actionResult.selected_action_ref)
  const selectedCard = scenarioBundle.cards.get(selectedCardKey)
  const cardUsageState = gameState.action_state.card_usage_state ?? {}
  const selectedCardUsageState = cardUsageState[selectedCardKey] ?? {
    times_used: 0,
    available_on_turn: 1
  }
  const selectedCardCooldownTurns = selectedCard?.cooldown_turns ?? 0
  const nextCardUsageState = {
    ...cardUsageState,
    [selectedCardKey]: {
      times_used: selectedCardUsageState.times_used + 1,
      available_on_turn: getCardNextAvailableTurn(
        gameState.progress.current_turn,
        selectedCardCooldownTurns
      )
    }
  }

  const nextGameState: GameState = {
    ...tentativeGameState,
    meta: {
      ...gameState.meta,
      last_updated_at: computeDeterministicLastUpdatedAt(gameState.meta.created_at_utc, turnsCompleted)
    },
    progress: {
      ...gameState.progress,
      current_turn:
        runStatusAfterTurn === 'in_progress'
          ? gameState.progress.current_turn + 1
          : Math.min(gameState.progress.current_turn, gameState.progress.max_turns),
      run_status: runStatusAfterTurn
    },
    action_state: {
      ...gameState.action_state,
      card_usage_state: nextCardUsageState,
      selected_action_ref: actionResult.selected_action_ref,
      actions_played: gameState.action_state.actions_played + 1,
      played_action_refs: [...gameState.action_state.played_action_refs, actionResult.selected_action_ref]
    },
    event_state: {
      ...gameState.event_state,
      last_event_ref: eventResult.selected_event_ref,
      triggered_event_refs: eventResult.selected_event_ref
        ? [...gameState.event_state.triggered_event_refs, eventResult.selected_event_ref]
        : gameState.event_state.triggered_event_refs
    },
    history: [...gameState.history, turnHistoryEntry]
  }

  return {
    game_state: nextGameState,
    turn_resolution_context: turnResolutionContext,
    turn_history_entry: turnHistoryEntry
  }
}
