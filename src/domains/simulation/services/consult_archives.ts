/**
 * Consult the Archives
 *
 * Spends a turn replacing one hand card from the remaining deck.
 * No architecture card resolves. Aftershocks, events, and stakeholders still do.
 */

import { ScenarioBundle } from '@/domains/content/model'
import { SeededRandom } from '@/shared/random/seeded_random'
import { GameState } from '../model'
import {
  applyConsultToHand,
  applyScoreChanges,
  applyStakeholderChanges,
  CONSULT_DISCARD_COUNT,
  resolveArchitecturalAftershocks
} from '../rules'
import { completeTurn } from './complete_turn'
import type { PlayTurnResult } from './complete_turn'

/**
 * Spends the current turn searching the deck instead of playing a card.
 */
export function consultArchives(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  discardIds: string[],
  random: SeededRandom
): PlayTurnResult {
  if (gameState.progress.run_status !== 'in_progress') {
    throw new Error('Cannot play a turn on a completed run.')
  }

  if (discardIds.length !== CONSULT_DISCARD_COUNT) {
    throw new Error(`Consult the Archives requires exactly ${CONSULT_DISCARD_COUNT} discarded card.`)
  }

  const discardId = discardIds[0]
  const discardedRef = gameState.hand_state.hand_refs.find((ref) => ref.id === discardId)
  if (!discardedRef) {
    throw new Error(`Action is not in the current hand: ${discardId}`)
  }

  if (gameState.hand_state.deck_refs.length === 0) {
    throw new Error('Cannot consult the archives: the deck is empty.')
  }

  const aftershocksResult = resolveArchitecturalAftershocks(gameState, scenarioBundle)
  const nextScores = applyScoreChanges(gameState.scores, aftershocksResult.score_changes, scenarioBundle)
  const nextStakeholders = applyStakeholderChanges(
    gameState.stakeholders,
    aftershocksResult.stakeholder_changes
  )

  const postAftershockState: GameState = {
    ...gameState,
    scores: nextScores,
    stakeholders: nextStakeholders
  }

  const handMutation = applyConsultToHand(postAftershockState, scenarioBundle, discardedRef)

  return completeTurn(gameState, scenarioBundle, random, aftershocksResult, {
    next_scores: nextScores,
    next_stakeholders: nextStakeholders,
    action_resolution: {
      selected_action: discardedRef,
      score_changes: [],
      stakeholder_changes: [],
      queued_delayed_effects: [],
      presentation: {
        title: 'Consult the Archives',
        summary: 'You searched the remaining options instead of committing an architectural move.',
        flavor_text: 'The system did not pause while you looked.'
      }
    },
    additional_score_changes: [],
    selected_action_ref: discardedRef,
    queued_delayed_effects: [],
    style_tags: [],
    player_intent: {
      type: 'consult_archives',
      discarded_refs: [discardedRef],
      drawn_refs: handMutation.drawn_refs
    },
    card_usage_state: gameState.action_state.card_usage_state,
    hand_state: handMutation.hand_state,
    count_as_card_action: false
  })
}
