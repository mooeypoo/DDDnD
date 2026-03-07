import { StakeholderChangeRecord } from '@/shared/contracts'
import { GameState } from '../model'

export function applyStakeholderChanges(
  stakeholders: GameState['stakeholders'],
  stakeholderChanges: StakeholderChangeRecord[]
): GameState['stakeholders'] {
  const nextStakeholders: GameState['stakeholders'] = {}

  for (const stakeholderId of Object.keys(stakeholders)) {
    nextStakeholders[stakeholderId] = {
      satisfaction: stakeholders[stakeholderId].satisfaction
    }
  }

  for (const change of stakeholderChanges) {
    const current = nextStakeholders[change.stakeholder_id]?.satisfaction ?? 50
    const nextSatisfaction = Math.min(100, Math.max(0, current + change.delta))

    nextStakeholders[change.stakeholder_id] = {
      satisfaction: nextSatisfaction
    }
  }

  return nextStakeholders
}
