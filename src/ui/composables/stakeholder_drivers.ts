import type { ScoreChangeRecord } from '@/shared/contracts'
import type { StakeholderReactionRecord } from '@/domains/simulation'
import {
  inferReactionBubbleTone,
  type StakeholderSpeechBubblePresentation,
} from '@/ui/composables/stakeholder_reaction_bubbles'
import { formatStakeholderName } from '@/ui/composables/stakeholder_presentation'

export interface StakeholderDriverRow {
  stakeholder_id: string
  stakeholder_name: string
  tone: StakeholderSpeechBubblePresentation['tone']
  net_satisfaction_delta: number
  reaction_title: string
  reaction_summary: string
  score_changes: ScoreChangeRecord[]
}

export function mapStakeholderDrivers(
  reactions: StakeholderReactionRecord[],
  stakeholderNames?: Record<string, string>,
): StakeholderDriverRow[] {
  return reactions.map(reaction => {
    const net_satisfaction_delta = reaction.stakeholder_changes
      .filter(c => c.stakeholder_id === reaction.stakeholder_id)
      .reduce((sum, c) => sum + c.delta, 0)

    return {
      stakeholder_id: reaction.stakeholder_id,
      stakeholder_name: formatStakeholderName(reaction.stakeholder_id, stakeholderNames),
      tone: inferReactionBubbleTone(reaction),
      net_satisfaction_delta,
      reaction_title: reaction.presentation.title,
      reaction_summary: reaction.presentation.summary,
      score_changes: reaction.score_changes,
    }
  })
}
