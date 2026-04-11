import { describe, expect, it } from 'vitest'
import type { StakeholderReactionRecord } from '@/domains/simulation'
import {
  buildStakeholderSpeechBubbles,
  inferReactionBubbleTone,
} from '@/ui/composables/stakeholder_reaction_bubbles'
import { STAKEHOLDER_REACTION_BUBBLE_LANGUAGE } from '@/ui/config/stakeholder_reaction_bubble_language'

function makeReaction(partial: Partial<StakeholderReactionRecord> = {}): StakeholderReactionRecord {
  return {
    stakeholder_id: 'cto',
    applied_rule_refs: [],
    score_changes: [],
    stakeholder_changes: [],
    presentation: {
      title: 'Reaction',
      summary: 'Default summary',
    },
    ...partial,
  }
}

describe('stakeholder_reaction_bubbles', () => {
  it('infers critical tone for strongly negative signal', () => {
    const reaction = makeReaction({
      stakeholder_changes: [{ stakeholder_id: 'cto', delta: -10 }],
    })

    expect(inferReactionBubbleTone(reaction)).toBe('critical')
  })

  it('infers mixed tone for split positive and negative deltas', () => {
    const reaction = makeReaction({
      score_changes: [
        { score_id: 'delivery_velocity', delta: 3 },
        { score_id: 'compliance_posture', delta: -2 },
      ],
    })

    expect(inferReactionBubbleTone(reaction)).toBe('mixed')
  })

  it('builds deterministic template selection for same turn and stakeholder', () => {
    const reaction = makeReaction({
      stakeholder_id: 'finance_team',
      stakeholder_changes: [{ stakeholder_id: 'finance_team', delta: -3 }],
      presentation: {
        title: 'Finance reaction',
        summary: 'This introduces costs.',
      },
    })

    const first = buildStakeholderSpeechBubbles([reaction], 4)
    const second = buildStakeholderSpeechBubbles([reaction], 4)

    expect(first.finance_team).toEqual(second.finance_team)
    expect(STAKEHOLDER_REACTION_BUBBLE_LANGUAGE.concern).toContain(first.finance_team.text)
  })
})
