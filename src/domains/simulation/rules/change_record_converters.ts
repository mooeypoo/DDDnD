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
 * Converts optional stakeholder deltas to runtime change records.
 */
export function toStakeholderChanges(
  stakeholderChanges: Array<{ stakeholder_id: string; delta: number }> | undefined
): StakeholderChangeRecord[] {
  if (!stakeholderChanges) {
    return []
  }

  return stakeholderChanges.map((change) => ({
    stakeholder_id: change.stakeholder_id,
    delta: change.delta,
  }))
}
