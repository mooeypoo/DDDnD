import { TriggerPhase } from '@/shared/contracts'

export type DelayedEffectSourceType = 'card' | 'event'

/**
 * Queued delayed effect scheduled for a future turn.
 */
export interface DelayedEffectInstance {
  effect_instance_id: string
  effect_id: string
  effect_version: number
  source_type: DelayedEffectSourceType
  source_id: string
  source_version: number
  source_turn: number
  trigger_turn: number
  trigger_phase: TriggerPhase
  selected_flavor_index: number
  is_resolved: boolean
}

export interface CreateDelayedEffectInstanceInput {
  effect_id: string
  effect_version: number
  source_type: DelayedEffectSourceType
  source_id: string
  source_version: number
  source_turn: number
  turns_until_resolution: number
  trigger_phase?: TriggerPhase
  selected_flavor_index?: number
}

/**
 * Deterministic delayed effect instance constructor.
 */
export function createDelayedEffectInstance(
  input: CreateDelayedEffectInstanceInput
): DelayedEffectInstance {
  const trigger_turn = input.source_turn + input.turns_until_resolution
  const trigger_phase = input.trigger_phase ?? 'aftershocks'
  const selected_flavor_index = input.selected_flavor_index ?? 0

  return {
    effect_instance_id: [
      input.source_type,
      input.source_id,
      `v${input.source_version}`,
      `turn${input.source_turn}`,
      input.effect_id,
      `v${input.effect_version}`,
      `trig${trigger_turn}`
    ].join('__'),
    effect_id: input.effect_id,
    effect_version: input.effect_version,
    source_type: input.source_type,
    source_id: input.source_id,
    source_version: input.source_version,
    source_turn: input.source_turn,
    trigger_turn,
    trigger_phase,
    selected_flavor_index,
    is_resolved: false
  }
}
