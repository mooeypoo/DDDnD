import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord } from '@/shared/contracts'
import { EventResolutionRecord, createDelayedEffectInstance, DelayedEffectInstance, GameState } from '../model'
import { ConditionEvaluationState } from './condition_evaluator'
import { EligibleEvent, selectEvent } from './select_event'
import { SeededRandom } from '@/shared/random/seeded_random'

export interface ResolveEventResult {
  event_resolution: EventResolutionRecord | null
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  queued_delayed_effects: DelayedEffectInstance[]
  selected_event_ref: { id: string; version: number } | null
}

function toScoreChanges(scoreChanges: { score_id: string; delta: number }[]): ScoreChangeRecord[] {
  return scoreChanges.map((change) => ({
    score_id: change.score_id,
    delta: change.delta
  }))
}

function toStakeholderChanges(
  stakeholderChanges: { stakeholder_id: string; delta: number }[] | undefined
): StakeholderChangeRecord[] {
  if (!stakeholderChanges) {
    return []
  }

  return stakeholderChanges.map((change) => ({
    stakeholder_id: change.stakeholder_id,
    delta: change.delta
  }))
}

function buildQueuedDelayedEffects(
  eligibleEvent: EligibleEvent,
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): DelayedEffectInstance[] {
  return eligibleEvent.event.delayed_effect_refs
    .map((effectRef) => {
      const delayedEffect = scenarioBundle.delayed_effects.get(versionRefKey(effectRef))
      if (!delayedEffect) {
        return null
      }

      return createDelayedEffectInstance({
        effect_id: delayedEffect.id,
        effect_version: delayedEffect.version,
        source_type: 'event',
        source_id: eligibleEvent.event.id,
        source_version: eligibleEvent.event.version,
        source_turn: gameState.progress.current_turn,
        turns_until_resolution: delayedEffect.turns_until_resolution,
        trigger_phase: 'aftershocks',
        selected_flavor_index: 0
      })
    })
    .filter((value): value is DelayedEffectInstance => value !== null)
}

export function resolveEvent(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  random: SeededRandom,
  conditionState: ConditionEvaluationState
): ResolveEventResult {
  const selected = selectEvent(gameState, scenarioBundle, random, conditionState)

  if (!selected) {
    return {
      event_resolution: null,
      score_changes: [],
      stakeholder_changes: [],
      queued_delayed_effects: [],
      selected_event_ref: null
    }
  }

  const scoreChanges = toScoreChanges(selected.event.score_changes)
  const stakeholderChanges = toStakeholderChanges(selected.event.stakeholder_changes)
  const queuedDelayedEffects = buildQueuedDelayedEffects(selected, gameState, scenarioBundle)

  return {
    event_resolution: {
      selected_event: selected.event_ref,
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
        title: selected.event.name,
        summary: selected.event.description,
        flavor_text: selected.event.flavor_text
      }
    },
    score_changes: scoreChanges,
    stakeholder_changes: stakeholderChanges,
    queued_delayed_effects: queuedDelayedEffects,
    selected_event_ref: selected.event_ref
  }
}
