import { describe, expect, it } from 'vitest'
import type { StakeholderReactionRecord } from '@/domains/simulation'
import { mapStakeholderDrivers } from '@/ui/composables/stakeholder_drivers'

function makeReaction(partial: Partial<StakeholderReactionRecord> = {}): StakeholderReactionRecord {
  return {
    stakeholder_id: 'cto',
    applied_rule_refs: [],
    score_changes: [],
    stakeholder_changes: [],
    presentation: {
      title: 'Reaction Title',
      summary: 'Something happened.',
    },
    ...partial,
  }
}

describe('mapStakeholderDrivers', () => {
  it('returns empty array for no reactions', () => {
    expect(mapStakeholderDrivers([])).toEqual([])
  })

  it('maps a positive reaction correctly', () => {
    const reaction = makeReaction({
      stakeholder_id: 'cto',
      stakeholder_changes: [{ stakeholder_id: 'cto', delta: 6 }],
      presentation: { title: 'Delivery praised', summary: 'The CTO is pleased.' },
    })

    const [row] = mapStakeholderDrivers([reaction])

    expect(row.stakeholder_id).toBe('cto')
    expect(row.stakeholder_name).toBe('Cto')
    expect(row.net_satisfaction_delta).toBe(6)
    expect(row.tone).toBe('mixed') // 0 < delta < 8 → mixed
    expect(row.reaction_title).toBe('Delivery praised')
    expect(row.reaction_summary).toBe('The CTO is pleased.')
  })

  it('resolves stakeholder name from namesMap', () => {
    const reaction = makeReaction({ stakeholder_id: 'vp_product' })
    const namesMap = { vp_product: 'VP of Product' }

    const [row] = mapStakeholderDrivers([reaction], namesMap)

    expect(row.stakeholder_name).toBe('VP of Product')
  })

  it('computes net_satisfaction_delta as sum of own stakeholder_changes only', () => {
    const reaction = makeReaction({
      stakeholder_id: 'ops',
      stakeholder_changes: [
        { stakeholder_id: 'ops', delta: -5 },
        { stakeholder_id: 'ops', delta: -3 },
        { stakeholder_id: 'cto', delta: 2 }, // different stakeholder — excluded
      ],
    })

    const [row] = mapStakeholderDrivers([reaction])

    expect(row.net_satisfaction_delta).toBe(-8)
  })

  it('infers critical tone for large negative delta', () => {
    const reaction = makeReaction({
      stakeholder_id: 'lead_dev',
      stakeholder_changes: [{ stakeholder_id: 'lead_dev', delta: -10 }],
    })

    const [row] = mapStakeholderDrivers([reaction])

    expect(row.tone).toBe('critical')
  })

  it('carries through score_changes unchanged', () => {
    const scoreChanges = [
      { score_id: 'delivery_velocity', delta: 3 },
      { score_id: 'technical_debt', delta: -1 },
    ]
    const reaction = makeReaction({ score_changes: scoreChanges })

    const [row] = mapStakeholderDrivers([reaction])

    expect(row.score_changes).toEqual(scoreChanges)
  })

  it('maps multiple reactions to separate rows', () => {
    const reactions = [
      makeReaction({ stakeholder_id: 'cto' }),
      makeReaction({ stakeholder_id: 'ops' }),
      makeReaction({ stakeholder_id: 'vp_product' }),
    ]

    const rows = mapStakeholderDrivers(reactions)

    expect(rows).toHaveLength(3)
    expect(rows.map(r => r.stakeholder_id)).toEqual(['cto', 'ops', 'vp_product'])
  })
})
