import { ScenarioBundle } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord, VersionedContentRef } from '@/shared/contracts'
import { SeededRandom } from '@/shared/random/seeded_random'
import {
  ActionResolutionRecord,
  CardUsageStateSnapshot,
  GameState,
  HandState,
  PlayerTurnIntent,
  TurnHistoryEntry,
  TurnResolutionContext
} from '../model'
import { DelayedEffectInstance } from '../model/delayed_effect_instance'
import {
  applyScoreChanges,
  applyStakeholderChanges,
  buildTurnHistoryEntry,
  classifyRunOutcome,
  replenishHand,
  resolveEvent,
  resolveStakeholderRules
} from '../rules'
import { ResolveArchitecturalAftershocksResult } from '../rules/resolve_architectural_aftershocks'

export interface PlayTurnResult {
  game_state: GameState
  turn_resolution_context: TurnResolutionContext
  turn_history_entry: TurnHistoryEntry
}

export interface CompleteTurnActionPhase {
  next_scores: GameState['scores']
  next_stakeholders: GameState['stakeholders']
  action_resolution: ActionResolutionRecord
  additional_score_changes: ScoreChangeRecord[]
  selected_action_ref: VersionedContentRef | null
  queued_delayed_effects: DelayedEffectInstance[]
  style_tags: string[]
  player_intent: PlayerTurnIntent
  card_usage_state: CardUsageStateSnapshot
  hand_state: HandState
  count_as_card_action: boolean
}

/**
 * Merges score deltas into cumulative analytics totals.
 */
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

/**
 * Merges stakeholder deltas into cumulative analytics totals.
 */
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

/**
 * Merges usage counters (card usage, style tags) into analytics totals.
 */
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

/**
 * Computes deterministic last-updated timestamp from created_at and turn count.
 */
function computeDeterministicLastUpdatedAt(createdAtUtc: string, turnsCompleted: number): string {
  const baseTimestamp = Date.parse(createdAtUtc)
  if (Number.isNaN(baseTimestamp)) {
    return createdAtUtc
  }

  return new Date(baseTimestamp + turnsCompleted * 1000).toISOString()
}

/**
 * Finishes a turn after the player commitment and aftershocks: event, stakeholders, wrap-up.
 */
export function completeTurn(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  random: SeededRandom,
  aftershocksResult: ResolveArchitecturalAftershocksResult,
  actionPhase: CompleteTurnActionPhase
): PlayTurnResult {
  let nextScores = actionPhase.next_scores
  let nextStakeholders = actionPhase.next_stakeholders

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
    ...actionPhase.action_resolution.score_changes,
    ...actionPhase.additional_score_changes,
    ...eventResult.score_changes,
    ...stakeholderResult.score_changes
  ]

  const allStakeholderChanges = [
    ...aftershocksResult.stakeholder_changes,
    ...actionPhase.action_resolution.stakeholder_changes,
    ...eventResult.stakeholder_changes,
    ...stakeholderResult.stakeholder_changes
  ]

  const turnsCompleted = gameState.run_analytics.turns_completed + 1
  const pendingDelayedEffects = [
    ...aftershocksResult.remaining_pending_effects,
    ...actionPhase.queued_delayed_effects,
    ...eventResult.queued_delayed_effects
  ]

  const cardUsageKeys = actionPhase.count_as_card_action && actionPhase.selected_action_ref
    ? [actionPhase.selected_action_ref.id]
    : []

  const tentativeGameState: GameState = {
    ...gameState,
    scores: nextScores,
    stakeholders: nextStakeholders,
    hand_state: actionPhase.hand_state,
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
      total_actions_played:
        gameState.run_analytics.total_actions_played + (actionPhase.count_as_card_action ? 1 : 0),
      cumulative_score_deltas: mergeScoreDeltas(
        gameState.run_analytics.cumulative_score_deltas,
        allScoreChanges
      ),
      cumulative_stakeholder_deltas: mergeStakeholderDeltas(
        gameState.run_analytics.cumulative_stakeholder_deltas,
        allStakeholderChanges
      ),
      card_usage: mergeUsageCounters(gameState.run_analytics.card_usage, cardUsageKeys),
      style_tags_used: mergeUsageCounters(
        gameState.run_analytics.style_tags_used,
        actionPhase.style_tags
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
    player_intent: actionPhase.player_intent,
    action_resolution: actionPhase.action_resolution,
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
    player_intent: actionPhase.player_intent,
    selected_action: actionPhase.selected_action_ref,
    action_resolution: actionPhase.action_resolution,
    event_resolution: eventResult.event_resolution,
    stakeholder_resolution: stakeholderResult.stakeholder_resolution,
    total_score_changes: totalScoreChanges,
    total_stakeholder_changes: totalStakeholderChanges
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
      card_usage_state: actionPhase.card_usage_state,
      selected_action_ref: actionPhase.selected_action_ref,
      actions_played:
        gameState.action_state.actions_played + (actionPhase.count_as_card_action ? 1 : 0),
      played_action_refs: actionPhase.selected_action_ref && actionPhase.count_as_card_action
        ? [...gameState.action_state.played_action_refs, actionPhase.selected_action_ref]
        : gameState.action_state.played_action_refs
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

  const replenishedHandState =
    runStatusAfterTurn === 'in_progress'
      ? replenishHand(nextGameState, scenarioBundle).hand_state
      : nextGameState.hand_state

  return {
    game_state: {
      ...nextGameState,
      hand_state: replenishedHandState
    },
    turn_resolution_context: turnResolutionContext,
    turn_history_entry: turnHistoryEntry
  }
}
