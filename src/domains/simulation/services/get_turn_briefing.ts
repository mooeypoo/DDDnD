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

export interface TurnBriefingActionSummary {
  card_id: string
  card_version: number
  short_summary: string
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
  const availableActionSummaries = gameState.action_state.available_action_refs.map((actionRef) => {
    const card = scenarioBundle.cards.get(versionRefKey(actionRef))

    return {
      card_id: actionRef.id,
      card_version: actionRef.version,
      short_summary: toShortSummary(card?.description ?? 'No summary available for this action card.')
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
    available_action_card_ids: gameState.action_state.available_action_refs.map((actionRef) => actionRef.id),
    available_action_summaries: availableActionSummaries,
    pending_delayed_effects_resolving_this_turn: pendingDelayedEffectsResolvingThisTurn
  }
}
