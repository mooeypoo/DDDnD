/**
 * Get Turn Briefing
 * 
 * Prepares information needed for the UI to display the current turn.
 * 
 * Returns:
 * - Current turn number
 * - Available action cards
 * - Current score values
 * - Stakeholder states
 * - Recent events or effects
 * 
 * This is a READ-ONLY operation - it does not modify game state.
 */

import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { GameState } from '../model'
import { getCardAvailability } from '../rules'

export interface TurnBriefingActionSummary {
  card_id: string
  card_version: number
  short_summary: string
  is_playable: boolean
  unavailable_reason: 'usage_limit_reached' | 'cooldown_active' | 'requirements_not_met' | null
  usage_limit: number | null
  uses_remaining: number | null
  times_used: number
  cooldown_turns: number
  available_on_turn: number
  turns_until_available: number
}

export interface PendingDelayedEffectBriefing {
  effect_instance_id: string
  effect_id: string
  effect_version: number
  source_type: 'card' | 'event'
  source_id: string
}

export interface TurnBriefing {
  turn_number: number
  current_scores: Record<string, number>
  stakeholder_satisfaction: Record<string, number>
  available_action_card_ids: string[]
  available_action_summaries: TurnBriefingActionSummary[]
  pending_delayed_effects_resolving_this_turn: PendingDelayedEffectBriefing[]
}

function toShortSummary(text: string): string {
  if (text.length <= 140) {
    return text
  }

  return `${text.slice(0, 137)}...`
}

function buildStakeholderSatisfactionSnapshot(gameState: GameState): Record<string, number> {
  const snapshot: Record<string, number> = {}

  for (const stakeholderId of Object.keys(gameState.stakeholders)) {
    snapshot[stakeholderId] = gameState.stakeholders[stakeholderId].satisfaction
  }

  return snapshot
}

export function getTurnBriefing(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): TurnBriefing {
  const conditionState = {
    scores: gameState.scores,
    stakeholders: gameState.stakeholders
  }

  const availableActionSummaries = gameState.action_state.available_action_refs.map((actionRef) => {
    const card = scenarioBundle.cards.get(versionRefKey(actionRef))
    if (!card) {
      return {
        card_id: actionRef.id,
        card_version: actionRef.version,
        short_summary: 'No summary available for this action card.',
        is_playable: false,
        unavailable_reason: 'requirements_not_met' as const,
        usage_limit: null,
        uses_remaining: null,
        times_used: 0,
        cooldown_turns: 0,
        available_on_turn: gameState.progress.current_turn,
        turns_until_available: 0
      }
    }

    const availability = getCardAvailability(gameState, actionRef, card, conditionState)

    return {
      card_id: actionRef.id,
      card_version: actionRef.version,
      short_summary: toShortSummary(card.description),
      is_playable: availability.is_playable,
      unavailable_reason: availability.unavailable_reason,
      usage_limit: availability.usage_limit,
      uses_remaining: availability.uses_remaining,
      times_used: availability.times_used,
      cooldown_turns: availability.cooldown_turns,
      available_on_turn: availability.available_on_turn,
      turns_until_available: availability.turns_until_available
    }
  })

  const pendingDelayedEffectsResolvingThisTurn = gameState.effect_state.pending_delayed_effects
    .filter((effect) => !effect.is_resolved && effect.trigger_turn === gameState.progress.current_turn)
    .map((effect) => ({
      effect_instance_id: effect.effect_instance_id,
      effect_id: effect.effect_id,
      effect_version: effect.effect_version,
      source_type: effect.source_type,
      source_id: effect.source_id
    }))

  return {
    turn_number: gameState.progress.current_turn,
    current_scores: { ...gameState.scores },
    stakeholder_satisfaction: buildStakeholderSatisfactionSnapshot(gameState),
    available_action_card_ids: availableActionSummaries
      .filter((summary) => summary.is_playable)
      .map((summary) => summary.card_id),
    available_action_summaries: availableActionSummaries,
    pending_delayed_effects_resolving_this_turn: pendingDelayedEffectsResolvingThisTurn
  }
}
