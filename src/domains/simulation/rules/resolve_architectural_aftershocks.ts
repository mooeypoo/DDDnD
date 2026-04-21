import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord } from '@/shared/contracts'
import { DelayedEffectInstance, GameState, ResolvedAftershockRecord } from '../model'

/**
 * Result payload for architectural aftershocks phase resolution.
 */
export interface ResolveArchitecturalAftershocksResult {
  resolved_aftershocks: ResolvedAftershockRecord[]
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  remaining_pending_effects: DelayedEffectInstance[]
  resolved_effect_instance_ids: string[]
}

/**
 * Converts content score deltas to runtime change records.
 */
function toScoreChanges(scoreChanges: { score_id: string; delta: number }[]): ScoreChangeRecord[] {
  return scoreChanges.map((change) => ({
    score_id: change.score_id,
    delta: change.delta
  }))
}

/**
 * Converts optional stakeholder deltas to runtime change records.
 */
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

/**
 * Sorts effect instances deterministically for stable turn resolution.
 */
function sortForDeterminism(effects: DelayedEffectInstance[]): DelayedEffectInstance[] {
  return [...effects].sort((a, b) => {
    if (a.trigger_turn !== b.trigger_turn) {
      return a.trigger_turn - b.trigger_turn
    }

    if (a.source_turn !== b.source_turn) {
      return a.source_turn - b.source_turn
    }

    return a.effect_instance_id.localeCompare(b.effect_instance_id)
  })
}

/**
 * Resolves due delayed effects for the current turn's aftershocks phase.
 */
export function resolveArchitecturalAftershocks(
  gameState: GameState,
  scenarioBundle: ScenarioBundle
): ResolveArchitecturalAftershocksResult {
  const currentTurn = gameState.progress.current_turn

  const resolvable = sortForDeterminism(
    gameState.effect_state.pending_delayed_effects.filter(
      (effect) =>
        !effect.is_resolved &&
        effect.trigger_phase === 'aftershocks' &&
        effect.trigger_turn === currentTurn
    )
  )

  const resolvedAftershocks: ResolvedAftershockRecord[] = []
  const scoreChanges: ScoreChangeRecord[] = []
  const stakeholderChanges: StakeholderChangeRecord[] = []

  for (const effectInstance of resolvable) {
    const delayedEffect = scenarioBundle.delayed_effects.get(
      versionRefKey({ id: effectInstance.effect_id, version: effectInstance.effect_version })
    )

    if (!delayedEffect) {
      continue
    }

    const effectScoreChanges = toScoreChanges(delayedEffect.score_changes)
    const effectStakeholderChanges = toStakeholderChanges(delayedEffect.stakeholder_changes)

    scoreChanges.push(...effectScoreChanges)
    stakeholderChanges.push(...effectStakeholderChanges)

    resolvedAftershocks.push({
      effect_instance_id: effectInstance.effect_instance_id,
      effect_id: effectInstance.effect_id,
      effect_version: effectInstance.effect_version,
      source_type: effectInstance.source_type,
      source_id: effectInstance.source_id,
      source_version: effectInstance.source_version,
      score_changes: effectScoreChanges,
      stakeholder_changes: effectStakeholderChanges,
      presentation: {
        title: delayedEffect.name,
        summary: delayedEffect.description
      }
    })
  }

  const resolvedEffectIdSet = new Set(resolvable.map((effect) => effect.effect_instance_id))
  const remainingPendingEffects = gameState.effect_state.pending_delayed_effects.filter(
    (effect) => !resolvedEffectIdSet.has(effect.effect_instance_id)
  )

  return {
    resolved_aftershocks: resolvedAftershocks,
    score_changes: scoreChanges,
    stakeholder_changes: stakeholderChanges,
    remaining_pending_effects: remainingPendingEffects,
    resolved_effect_instance_ids: resolvable.map((effect) => effect.effect_instance_id)
  }
}
