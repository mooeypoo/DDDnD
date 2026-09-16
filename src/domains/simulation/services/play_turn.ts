/**
 * Play Turn
 *
 * Resolves a complete turn following the turn resolution pipeline:
 *
 * 1. Architectural Aftershocks - delayed effects resolve
 * 2. Player Action - selected card from the legal hand resolves
 * 3. System Event - random event may trigger
 * 4. Stakeholder Resolution - stakeholders react to current state
 * 5. Turn Wrap-Up - update totals, record history, check outcomes
 *
 * This is the CORE of the simulation engine.
 *
 * IMPORTANT: This function must be deterministic.
 * Given the same state, bundle, action, and seed - it must produce identical results.
 */

import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { ScoreChangeRecord } from '@/shared/contracts'
import { SeededRandom } from '@/shared/random/seeded_random'
import { GameState } from '../model'
import {
  applyScoreChanges,
  applyStakeholderChanges,
  applyPlayedCardToHand,
  containsContentRef,
  getCardAvailability,
  getCardNextAvailableTurn,
  resolveAction,
  resolveArchitecturalAftershocks
} from '../rules'
import { completeTurn, PlayTurnResult } from './complete_turn'

export type { PlayTurnResult }

function assertCardIsLegalToPlay(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  actionId: string
): void {
  const isInHand = gameState.hand_state.hand_refs.some((ref) => ref.id === actionId)
  if (isInHand) {
    return
  }

  throwIfUnplayablePoolCard(gameState, scenarioBundle, actionId)

  const actionRef = gameState.action_state.available_action_refs.find((candidate) => candidate.id === actionId)
  if (!actionRef) {
    throw new Error(`Action is not available for this run: ${actionId}`)
  }

  throw new Error(`Action is not in the current hand: ${actionId}`)
}

/**
 * Resolves one full deterministic turn for a card played from the legal hand.
 */
export function playTurn(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  actionId: string,
  random: SeededRandom
): PlayTurnResult {
  if (gameState.progress.run_status !== 'in_progress') {
    throw new Error('Cannot play a turn on a completed run.')
  }

  assertCardIsLegalToPlay(gameState, scenarioBundle, actionId)

  const aftershocksResult = resolveArchitecturalAftershocks(gameState, scenarioBundle)
  let nextScores = applyScoreChanges(gameState.scores, aftershocksResult.score_changes, scenarioBundle)
  let nextStakeholders = applyStakeholderChanges(
    gameState.stakeholders,
    aftershocksResult.stakeholder_changes
  )

  const postAftershockState: GameState = {
    ...gameState,
    scores: nextScores,
    stakeholders: nextStakeholders
  }

  const actionResult = resolveAction(actionId, postAftershockState, scenarioBundle, {
    scores: nextScores,
    stakeholders: nextStakeholders
  })

  const classAffinityBonus: ScoreChangeRecord[] = []
  if (gameState.player_profile.class_score_affinity) {
    classAffinityBonus.push({
      score_id: gameState.player_profile.class_score_affinity,
      delta: 1
    })
  }

  nextScores = applyScoreChanges(nextScores, [...actionResult.score_changes, ...classAffinityBonus], scenarioBundle)
  nextStakeholders = applyStakeholderChanges(nextStakeholders, actionResult.stakeholder_changes)

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

  const stateForHand: GameState = {
    ...postAftershockState,
    scores: nextScores,
    stakeholders: nextStakeholders,
    action_state: {
      ...gameState.action_state,
      card_usage_state: nextCardUsageState
    }
  }

  const handMutation = applyPlayedCardToHand(
    stateForHand,
    scenarioBundle,
    actionResult.selected_action_ref
  )

  return completeTurn(gameState, scenarioBundle, random, aftershocksResult, {
    next_scores: nextScores,
    next_stakeholders: nextStakeholders,
    action_resolution: actionResult.action_resolution,
    additional_score_changes: classAffinityBonus,
    selected_action_ref: actionResult.selected_action_ref,
    queued_delayed_effects: actionResult.queued_delayed_effects,
    style_tags: actionResult.style_tags,
    player_intent: {
      type: 'play_card',
      action_ref: actionResult.selected_action_ref
    },
    card_usage_state: nextCardUsageState,
    hand_state: handMutation.hand_state,
    count_as_card_action: true
  })
}

/**
 * Shared availability error for a pool card that is no longer legal to play.
 * Used so usage/cooldown tests keep their original error text when the card
 * has already left the hand.
 */
export function throwIfUnplayablePoolCard(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  actionId: string
): void {
  const actionRef = gameState.action_state.available_action_refs.find((candidate) => candidate.id === actionId)
  if (!actionRef) {
    return
  }

  const card = scenarioBundle.cards.get(versionRefKey(actionRef))
  if (!card) {
    return
  }

  const availability = getCardAvailability(gameState, actionRef, card, {
    scores: gameState.scores,
    stakeholders: gameState.stakeholders
  })

  if (availability.is_playable || containsContentRef(gameState.hand_state.hand_refs, actionRef)) {
    return
  }

  if (availability.unavailable_reason === 'usage_limit_reached') {
    throw new Error(`Action usage limit reached for card: ${card.id}-v${card.version}`)
  }

  if (availability.unavailable_reason === 'cooldown_active') {
    throw new Error(`Action is on cooldown for card: ${card.id}-v${card.version}`)
  }
}
