import { Card, ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { VersionedContentRef } from '@/shared/contracts'
import { createSeededRandom, SeededRandom } from '@/shared/random/seeded_random'
import { GameState, HandState } from '../model'
import { getCardAvailability } from './card_availability'
import { ConditionEvaluationState } from './condition_evaluator'

/**
 * Default legal hand size. Smaller playable pools deal the whole set.
 */
export const DEFAULT_HAND_SIZE = 6

/**
 * Cards discarded from hand when consulting the archives.
 */
export const CONSULT_DISCARD_COUNT = 1

/**
 * Opening-deal cards biased toward currently low scores.
 */
const PRESSURE_DEAL_COUNT = 2

export interface HandMutationResult {
  hand_state: HandState
  drawn_refs: VersionedContentRef[]
}

/**
 * True when two versioned refs point at the same content identity.
 */
export function isSameContentRef(left: VersionedContentRef, right: VersionedContentRef): boolean {
  return versionRefKey(left) === versionRefKey(right)
}

/**
 * True when the ref is present in the list.
 */
export function containsContentRef(refs: VersionedContentRef[], candidate: VersionedContentRef): boolean {
  const key = versionRefKey(candidate)
  return refs.some((ref) => versionRefKey(ref) === key)
}

function conditionStateFrom(gameState: GameState): ConditionEvaluationState {
  return {
    scores: gameState.scores,
    stakeholders: gameState.stakeholders
  }
}

/**
 * Returns currently playable action refs in pool order.
 */
export function listPlayableActionRefs(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): VersionedContentRef[] {
  const conditionState = conditionStateFrom(gameState)

  return gameState.action_state.available_action_refs.filter((actionRef) => {
    const card = scenarioBundle.cards.get(versionRefKey(actionRef))
    if (!card) {
      return false
    }

    return getCardAvailability(gameState, actionRef, card, conditionState).is_playable
  })
}

function shuffleRefs(refs: VersionedContentRef[], random: SeededRandom): VersionedContentRef[] {
  const shuffled = [...refs]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.nextInt(0, index)
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

function lowestScoreIds(scores: Record<string, number>, count: number): string[] {
  return Object.entries(scores)
    .sort((left, right) => {
      if (left[1] !== right[1]) {
        return left[1] - right[1]
      }

      return left[0].localeCompare(right[0])
    })
    .slice(0, count)
    .map(([scoreId]) => scoreId)
}

function pressureValue(card: Card, pressureScoreIds: string[]): number {
  return card.score_changes.reduce((total, change) => {
    if (change.delta <= 0 || !pressureScoreIds.includes(change.score_id)) {
      return total
    }

    return total + change.delta
  }, 0)
}

function pickPressureRefs(
  playableRefs: VersionedContentRef[],
  scenarioBundle: ScenarioBundle,
  scores: Record<string, number>
): VersionedContentRef[] {
  const pressureScoreIds = lowestScoreIds(scores, PRESSURE_DEAL_COUNT)
  if (pressureScoreIds.length === 0) {
    return []
  }

  const ranked = playableRefs
    .map((actionRef) => {
      const card = scenarioBundle.cards.get(versionRefKey(actionRef))
      return {
        actionRef,
        value: card ? pressureValue(card, pressureScoreIds) : 0
      }
    })
    .filter((entry) => entry.value > 0)
    .sort((left, right) => {
      if (left.value !== right.value) {
        return right.value - left.value
      }

      return versionRefKey(left.actionRef).localeCompare(versionRefKey(right.actionRef))
    })

  return ranked.slice(0, PRESSURE_DEAL_COUNT).map((entry) => entry.actionRef)
}

/**
 * Rebuilds a legal hand from the current playable set, drawing from the deck.
 */
export function replenishHand(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  handSize: number = DEFAULT_HAND_SIZE
): HandMutationResult {
  const playableRefs = listPlayableActionRefs(gameState, scenarioBundle)
  const playableKeys = new Set(playableRefs.map((ref) => versionRefKey(ref)))
  const previousHandKeys = new Set(gameState.hand_state.hand_refs.map((ref) => versionRefKey(ref)))

  const handRefs = gameState.hand_state.hand_refs.filter((ref) => playableKeys.has(versionRefKey(ref)))
  const handKeys = new Set(handRefs.map((ref) => versionRefKey(ref)))

  const deckRefs = gameState.hand_state.deck_refs.filter((ref) => {
    const key = versionRefKey(ref)
    return playableKeys.has(key) && !handKeys.has(key)
  })
  const deckKeys = new Set(deckRefs.map((ref) => versionRefKey(ref)))

  for (const actionRef of playableRefs) {
    const key = versionRefKey(actionRef)
    if (!handKeys.has(key) && !deckKeys.has(key)) {
      deckRefs.push(actionRef)
      deckKeys.add(key)
    }
  }

  const drawnRefs: VersionedContentRef[] = []
  while (handRefs.length < handSize && deckRefs.length > 0) {
    const drawn = deckRefs.shift()
    if (!drawn) {
      break
    }

    handRefs.push(drawn)
    if (!previousHandKeys.has(versionRefKey(drawn))) {
      drawnRefs.push(drawn)
    }
  }

  return {
    hand_state: {
      hand_refs: handRefs,
      deck_refs: deckRefs
    },
    drawn_refs: drawnRefs
  }
}

/**
 * Deals the opening legal hand from currently playable cards.
 */
export function dealOpeningHand(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  seed: string,
  handSize: number = DEFAULT_HAND_SIZE
): HandState {
  const playableRefs = listPlayableActionRefs(gameState, scenarioBundle)
  if (playableRefs.length <= handSize) {
    return {
      hand_refs: [...playableRefs],
      deck_refs: []
    }
  }

  const random = createSeededRandom(`${seed}__hand_deal`)
  const pressureRefs = pickPressureRefs(playableRefs, scenarioBundle, gameState.scores)
  const pressureKeys = new Set(pressureRefs.map((ref) => versionRefKey(ref)))
  const remainingRefs = shuffleRefs(
    playableRefs.filter((ref) => !pressureKeys.has(versionRefKey(ref))),
    random
  )
  const remainingSlots = handSize - pressureRefs.length
  const randomHandRefs = remainingRefs.slice(0, remainingSlots)

  return {
    hand_refs: [...pressureRefs, ...randomHandRefs],
    deck_refs: remainingRefs.slice(remainingSlots)
  }
}

/**
 * Removes a played card from the hand and draws back toward hand size.
 */
export function applyPlayedCardToHand(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  playedRef: VersionedContentRef,
  handSize: number = DEFAULT_HAND_SIZE
): HandMutationResult {
  const playedKey = versionRefKey(playedRef)
  const nextState: GameState = {
    ...gameState,
    hand_state: {
      hand_refs: gameState.hand_state.hand_refs.filter((ref) => versionRefKey(ref) !== playedKey),
      deck_refs: gameState.hand_state.deck_refs.filter((ref) => versionRefKey(ref) !== playedKey)
    }
  }

  return replenishHand(nextState, scenarioBundle, handSize)
}

/**
 * Discards one hand card onto the deck and draws a replacement.
 */
export function applyConsultToHand(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  discardedRef: VersionedContentRef,
  handSize: number = DEFAULT_HAND_SIZE
): HandMutationResult {
  const discardedKey = versionRefKey(discardedRef)
  const remainingHand = gameState.hand_state.hand_refs.filter((ref) => versionRefKey(ref) !== discardedKey)
  const nextDeck = [
    ...gameState.hand_state.deck_refs.filter((ref) => versionRefKey(ref) !== discardedKey),
    discardedRef
  ]

  const nextState: GameState = {
    ...gameState,
    hand_state: {
      hand_refs: remainingHand,
      deck_refs: nextDeck
    }
  }

  return replenishHand(nextState, scenarioBundle, handSize)
}
