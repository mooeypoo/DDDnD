import { Card, ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord, VersionedContentRef } from '@/shared/contracts'
import { ActionResolutionRecord, createDelayedEffectInstance, DelayedEffectInstance, GameState } from '../model'
import { ConditionEvaluationState, evaluateNumericCondition } from './condition_evaluator'
import { getCardAvailability } from './card_availability'
import { toScoreChanges, toStakeholderChanges } from './change_record_converters'

/**
 * Result payload for player action resolution.
 */
export interface ResolveActionResult {
  action_resolution: ActionResolutionRecord
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  queued_delayed_effects: DelayedEffectInstance[]
  selected_action_ref: VersionedContentRef
  style_tags: string[]
}

/**
 * Resolves selected action id to a run-available card reference and bundle card.
 */
function findCardFromActionId(
  actionId: string,
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): { actionRef: VersionedContentRef; card: Card } {
  const actionRef = gameState.action_state.available_action_refs.find((candidate) => candidate.id === actionId)

  if (!actionRef) {
    throw new Error(`Action is not available for this run: ${actionId}`)
  }

  const card = scenarioBundle.cards.get(versionRefKey(actionRef))
  if (!card) {
    throw new Error(`Action card content was not found in bundle: ${actionRef.id}-v${actionRef.version}`)
  }

  return { actionRef, card }
}

/**
 * Validates card requirements against current condition state.
 */
function assertActionRequirements(
  card: Card,
  conditionState: ConditionEvaluationState
): void {
  if (!card.requirements || card.requirements.length === 0) {
    return
  }

  for (const requirement of card.requirements) {
    const met = evaluateNumericCondition(requirement, conditionState)
    if (!met) {
      throw new Error(`Action requirements are not met for card: ${card.id}-v${card.version}`)
    }
  }
}

/**
 * Validates card availability constraints (requirements, usage, cooldown).
 */
function assertActionAvailability(
  actionRef: VersionedContentRef,
  card: Card,
  gameState: GameState,
  conditionState: ConditionEvaluationState
): void {
  const availability = getCardAvailability(gameState, actionRef, card, conditionState)

  if (availability.is_playable) {
    return
  }

  if (availability.unavailable_reason === 'usage_limit_reached') {
    throw new Error(`Action usage limit reached for card: ${card.id}-v${card.version}`)
  }

  if (availability.unavailable_reason === 'cooldown_active') {
    throw new Error(`Action is on cooldown for card: ${card.id}-v${card.version}`)
  }

  throw new Error(`Action requirements are not met for card: ${card.id}-v${card.version}`)
}

/**
 * Resolves a player action into deterministic runtime records and queued effects.
 */
export function resolveAction(
  actionId: string,
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  conditionState: ConditionEvaluationState
): ResolveActionResult {
  const { actionRef, card } = findCardFromActionId(actionId, gameState, scenarioBundle)
  assertActionRequirements(card, conditionState)
  assertActionAvailability(actionRef, card, gameState, conditionState)

  const scoreChanges = toScoreChanges(card.score_changes)
  const stakeholderChanges = toStakeholderChanges(card.stakeholder_changes)

  const queuedDelayedEffects = card.delayed_effect_refs
    .map((effectRef) => {
      const delayedEffect = scenarioBundle.delayed_effects.get(versionRefKey(effectRef))
      if (!delayedEffect) {
        return null
      }

      return createDelayedEffectInstance({
        effect_id: delayedEffect.id,
        effect_version: delayedEffect.version,
        source_type: 'card',
        source_id: card.id,
        source_version: card.version,
        source_turn: gameState.progress.current_turn,
        turns_until_resolution: delayedEffect.turns_until_resolution,
        trigger_phase: 'aftershocks',
        selected_flavor_index: 0
      })
    })
    .filter((value): value is DelayedEffectInstance => value !== null)

  return {
    action_resolution: {
      selected_action: actionRef,
      score_changes: scoreChanges,
      stakeholder_changes: stakeholderChanges,
      queued_delayed_effects: queuedDelayedEffects.map((effect) => ({
        effect_instance_id: effect.effect_instance_id,
        effect_id: effect.effect_id,
        effect_version: effect.effect_version,
        trigger_turn: effect.trigger_turn,
        trigger_phase: effect.trigger_phase
      })),
      presentation: {
        title: card.name,
        summary: card.description,
        flavor_text: card.flavor_text
      }
    },
    score_changes: scoreChanges,
    stakeholder_changes: stakeholderChanges,
    queued_delayed_effects: queuedDelayedEffects,
    selected_action_ref: actionRef,
    style_tags: card.style_tags ?? []
  }
}
