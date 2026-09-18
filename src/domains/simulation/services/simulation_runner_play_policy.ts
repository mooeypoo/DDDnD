/**
 * Simulation runner play policies.
 *
 * Player-true bots hold the same legal hand as a human and may consult the
 * archives under the same turn cost. The full-pool oracle deals every currently
 * playable card into the hand so catalog-only recovery can be reported without
 * becoming the pass gate.
 */

import { Card, ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { SeededRandom } from '@/shared/random/seeded_random'
import { listPressureScoreIds, pressureValue } from '../rules'
import type { TurnBriefing, TurnBriefingActionSummary } from './get_turn_briefing'

export type SimulationPlayPolicy = 'player_true' | 'full_pool_oracle'

export type RunnerTurnChoice =
  | { type: 'play_card'; action_id: string }
  | { type: 'consult_archives'; discard_ids: string[] }
  | { type: 'stop' }

const PRESSURE_SCORE_COUNT = 2

/**
 * Opening-deal size for a play policy. `undefined` means the player-facing default.
 */
export function legalHandSizeForPolicy(policy: SimulationPlayPolicy): number | undefined {
  if (policy === 'full_pool_oracle') {
    return Number.MAX_SAFE_INTEGER
  }

  return undefined
}

function lookupCard(
  scenarioBundle: ScenarioBundle,
  summary: TurnBriefingActionSummary
): Card | undefined {
  return scenarioBundle.cards.get(
    versionRefKey({ id: summary.card_id, version: summary.card_version })
  )
}

function summaryPressureValue(
  summary: TurnBriefingActionSummary,
  scenarioBundle: ScenarioBundle,
  pressureScoreIds: string[]
): number {
  const card = lookupCard(scenarioBundle, summary)
  return card ? pressureValue(card, pressureScoreIds) : 0
}

function addressesPressure(
  summaries: TurnBriefingActionSummary[],
  scenarioBundle: ScenarioBundle,
  scores: Record<string, number>
): boolean {
  const pressureScoreIds = listPressureScoreIds(scores, PRESSURE_SCORE_COUNT)
  return summaries.some(
    (summary) =>
      summary.is_playable && summaryPressureValue(summary, scenarioBundle, pressureScoreIds) > 0
  )
}

function leastHelpfulHandCardId(
  hand: TurnBriefingActionSummary[],
  scenarioBundle: ScenarioBundle,
  scores: Record<string, number>
): string {
  const pressureScoreIds = listPressureScoreIds(scores, PRESSURE_SCORE_COUNT)
  const ranked = [...hand].sort((left, right) => {
    const leftValue = summaryPressureValue(left, scenarioBundle, pressureScoreIds)
    const rightValue = summaryPressureValue(right, scenarioBundle, pressureScoreIds)
    if (leftValue !== rightValue) {
      return leftValue - rightValue
    }

    return left.card_id.localeCompare(right.card_id)
  })

  return ranked[0].card_id
}

/**
 * Chooses the next player-true turn: play from the hand, or consult when the
 * hand cannot address current pressure and the deck still might.
 */
export function choosePlayerTrueTurn(
  briefing: TurnBriefing,
  scenarioBundle: ScenarioBundle,
  selectionRandom: SeededRandom
): RunnerTurnChoice {
  const playableHand = briefing.hand_action_summaries.filter((summary) => summary.is_playable)
  const handAddressesPressure = addressesPressure(
    briefing.hand_action_summaries,
    scenarioBundle,
    briefing.current_scores
  )
  const deckAddressesPressure = addressesPressure(
    briefing.deck_action_summaries,
    scenarioBundle,
    briefing.current_scores
  )

  const shouldConsult =
    briefing.can_consult_archives &&
    briefing.hand_action_summaries.length > 0 &&
    (playableHand.length === 0 || (!handAddressesPressure && deckAddressesPressure))

  if (shouldConsult) {
    return {
      type: 'consult_archives',
      discard_ids: [
        leastHelpfulHandCardId(
          briefing.hand_action_summaries,
          scenarioBundle,
          briefing.current_scores
        )
      ]
    }
  }

  if (playableHand.length === 0) {
    return { type: 'stop' }
  }

  return {
    type: 'play_card',
    action_id: selectionRandom.choice(playableHand).card_id
  }
}

/**
 * Chooses the next full-pool oracle turn. The entire playable catalog is legal;
 * the oracle never consults.
 */
export function chooseOracleTurn(
  briefing: TurnBriefing,
  selectionRandom: SeededRandom
): RunnerTurnChoice {
  const playableHand = briefing.hand_action_summaries.filter((summary) => summary.is_playable)
  if (playableHand.length === 0) {
    return { type: 'stop' }
  }

  return {
    type: 'play_card',
    action_id: selectionRandom.choice(playableHand).card_id
  }
}
