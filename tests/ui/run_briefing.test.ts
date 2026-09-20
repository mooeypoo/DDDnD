import { describe, expect, it } from 'vitest'
import { describeCharge, weakestScoreIds } from '@/ui/play/run_briefing'

describe('run_briefing charge derivation', () => {
  it('orders scores weakest first', () => {
    const scores = { domain_clarity: 62, team_morale: 18, budget: 40 }
    expect(weakestScoreIds(scores, 3)).toEqual(['team_morale', 'budget', 'domain_clarity'])
  })

  it('breaks ties on score id so the same start always reads the same', () => {
    const scores = { user_trust: 30, budget: 30, team_morale: 90 }
    expect(weakestScoreIds(scores, 2)).toEqual(['budget', 'user_trust'])
  })

  it('states the objective and names the two weakest scores', () => {
    const charge = describeCharge({ domain_clarity: 70, team_morale: 25, budget: 30 }, 10)

    expect(charge).toContain('Leave the system stronger than you found it')
    expect(charge).toContain('keep the council with you')
    expect(charge).toContain('10 turns remain')
    expect(charge).toContain('team morale and budget are the weakest right now')
  })

  it('reads naturally for a single score and a single turn', () => {
    expect(describeCharge({ budget: 12 }, 1)).toContain('1 turn remains')
    expect(describeCharge({ budget: 12 }, 1)).toContain('budget is the weakest right now')
  })

  it('still states the objective when a pack ships no scores', () => {
    const charge = describeCharge({}, 8)

    expect(charge).toContain('Leave the system stronger than you found it')
    expect(charge).toContain('8 turns remain')
    expect(charge).not.toContain('weakest')
  })

  it('names unknown pack scores by their id, in plain words', () => {
    expect(describeCharge({ audit_readiness: 10, budget: 90 }, 9))
      .toContain('audit readiness and budget are the weakest right now')
  })
})
