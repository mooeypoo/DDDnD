import { Card, versionRefKey } from '@/domains/content/model'
import { VersionedContentRef } from '@/shared/contracts'
import { GameState } from '../model'
import { ConditionEvaluationState, evaluateNumericCondition } from './condition_evaluator'

export type CardUnavailableReason =
  | 'usage_limit_reached'
  | 'cooldown_active'
  | 'requirements_not_met'

export interface CardAvailability {
  card_id: string
  card_version: number
  card_key: string
  is_playable: boolean
  unavailable_reason: CardUnavailableReason | null
  times_used: number
  usage_limit: number | null
  uses_remaining: number | null
  cooldown_turns: number
  available_on_turn: number
  turns_until_available: number
}

function normalizeUsageLimit(card: Card): number | null {
  if (card.usage_limit === undefined || card.usage_limit === null) {
    return null
  }

  return card.usage_limit
}

function normalizeCooldownTurns(card: Card): number {
  return card.cooldown_turns ?? 0
}

function areRequirementsMet(card: Card, conditionState: ConditionEvaluationState): boolean {
  if (!card.requirements || card.requirements.length === 0) {
    return true
  }

  return card.requirements.every((requirement) => evaluateNumericCondition(requirement, conditionState))
}

export function getCardAvailability(
  gameState: GameState,
  actionRef: VersionedContentRef,
  card: Card,
  conditionState: ConditionEvaluationState
): CardAvailability {
  const cardKey = versionRefKey(actionRef)
  const usageSnapshot = gameState.action_state.card_usage_state ?? {}
  const usageState = usageSnapshot[cardKey] ?? {
    times_used: 0,
    available_on_turn: 1
  }

  const usageLimit = normalizeUsageLimit(card)
  const cooldownTurns = normalizeCooldownTurns(card)
  const turnsUntilAvailable = Math.max(0, usageState.available_on_turn - gameState.progress.current_turn)
  const usageLimitReached = usageLimit !== null && usageState.times_used >= usageLimit
  const onCooldown = turnsUntilAvailable > 0
  const requirementsMet = areRequirementsMet(card, conditionState)

  let unavailableReason: CardUnavailableReason | null = null
  if (usageLimitReached) {
    unavailableReason = 'usage_limit_reached'
  } else if (onCooldown) {
    unavailableReason = 'cooldown_active'
  } else if (!requirementsMet) {
    unavailableReason = 'requirements_not_met'
  }

  const usesRemaining = usageLimit === null ? null : Math.max(usageLimit - usageState.times_used, 0)

  return {
    card_id: actionRef.id,
    card_version: actionRef.version,
    card_key: cardKey,
    is_playable: unavailableReason === null,
    unavailable_reason: unavailableReason,
    times_used: usageState.times_used,
    usage_limit: usageLimit,
    uses_remaining: usesRemaining,
    cooldown_turns: cooldownTurns,
    available_on_turn: usageState.available_on_turn,
    turns_until_available: turnsUntilAvailable
  }
}

export function getCardNextAvailableTurn(currentTurn: number, cooldownTurns: number): number {
  return currentTurn + cooldownTurns + 1
}
