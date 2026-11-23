import type { ScenarioBundle } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord } from '@/shared/contracts'

/**
 * Converts content score deltas to runtime change records.
 */
export function toScoreChanges(
  scoreChanges: Array<{ score_id: string; delta: number }>
): ScoreChangeRecord[] {
  return scoreChanges.map((change) => ({
    score_id: change.score_id,
    delta: change.delta,
  }))
}

/**
 * Converts optional stakeholder deltas to runtime change records, keeping only
 * stakeholders at this scenario's table (journal M3.9).
 *
 * Shared content (a base card reused by another scenario or an extension
 * pack) may name a stakeholder this scenario doesn't have. That change does
 * nothing: no phantom stakeholder is created, and it counts toward nothing.
 */
export function toStakeholderChanges(
  stakeholderChanges: Array<{ stakeholder_id: string; delta: number }> | undefined,
  scenarioBundle: Pick<ScenarioBundle, 'scenario'>
): StakeholderChangeRecord[] {
  if (!stakeholderChanges) {
    return []
  }

  const atTable = new Set(scenarioBundle.scenario.stakeholder_refs.map((ref) => ref.id))
  return stakeholderChanges
    .filter((change) => atTable.has(change.stakeholder_id))
    .map((change) => ({
      stakeholder_id: change.stakeholder_id,
      delta: change.delta,
    }))
}
