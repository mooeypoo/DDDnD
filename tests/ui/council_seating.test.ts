/**
 * Council seating: when the council outnumbers the table's seats, the most
 * recently active stakeholders sit, seats are stable, and a speaker is always
 * seated while speaking.
 */

import { describe, expect, it } from 'vitest'

import { seatBudgetForWidth, seatCouncil, type SeatingTurn } from '@/ui/play/council_seating'
import { buildGameplayStageActors } from '@/ui/composables/gameplay_stage_presentation'

const COUNCIL = ['vp', 'product', 'support', 'finance', 'on_call']

function turn(changed: string[], reacted: string[] = []): SeatingTurn {
  return {
    total_stakeholder_changes: changed.map((stakeholder_id) => ({ stakeholder_id, delta: 2 })),
    stakeholder_resolution: { reactions: reacted.map((stakeholder_id) => ({ stakeholder_id })) },
  }
}

describe('seatCouncil', () => {
  it('seats everyone when the table is big enough, in council order (the original table)', () => {
    expect(seatCouncil({ stakeholder_ids: COUNCIL, history: [turn(['on_call'])], seat_count: 6 }))
      .toEqual({ seated: COUNCIL, others: [] })
    expect(seatCouncil({ stakeholder_ids: COUNCIL.slice(0, 4), history: [], seat_count: 4 }).seated).toEqual(COUNCIL.slice(0, 4))
  })

  it('starts with the first in council order, and lists the rest as others', () => {
    expect(seatCouncil({ stakeholder_ids: COUNCIL, history: [], seat_count: 4 }))
      .toEqual({ seated: ['vp', 'product', 'support', 'finance'], others: ['on_call'] })
  })

  it('seats a newly active stakeholder in the seat of the one longest without activity, and nobody else moves', () => {
    const seating = seatCouncil({
      stakeholder_ids: COUNCIL,
      history: [turn(['vp', 'product', 'support']), turn(['on_call'])],
      seat_count: 4,
    })
    // finance never acted: their seat (3) goes to the on-call engineer
    expect(seating).toEqual({ seated: ['vp', 'product', 'support', 'on_call'], others: ['finance'] })
  })

  it('counts a reaction with no net change as activity, and ignores zero changes', () => {
    const history = [turn(['vp', 'product', 'support', 'finance']), { total_stakeholder_changes: [{ stakeholder_id: 'vp', delta: 0 }], stakeholder_resolution: { reactions: [{ stakeholder_id: 'on_call' }] } }]
    expect(seatCouncil({ stakeholder_ids: COUNCIL, history, seat_count: 4 }).seated).toContain('on_call')
  })

  it('never unseats someone active in the same turn to make room', () => {
    const seating = seatCouncil({ stakeholder_ids: COUNCIL, history: [turn(['vp', 'product', 'support', 'finance', 'on_call'])], seat_count: 4 })
    expect(seating.seated).toEqual(['vp', 'product', 'support', 'finance'])
  })

  it('seats a speaker while they speak, preferring to unseat someone not active this turn', () => {
    const history = [turn(['vp', 'product']), turn(['support', 'finance'])]
    const seating = seatCouncil({ stakeholder_ids: COUNCIL, history, seat_count: 4, voicing: 'on_call' })
    expect(seating.seated).toContain('on_call')
    expect(seating.seated).toEqual(expect.arrayContaining(['support', 'finance']))
    expect(seating.others).toHaveLength(1)
  })

  it('is the same after a reload: it depends only on the history', () => {
    const input = { stakeholder_ids: COUNCIL, history: [turn(['on_call']), turn(['finance']), turn(['product'])], seat_count: 3 }
    expect(seatCouncil(input)).toEqual(seatCouncil(structuredClone(input)))
  })
})

describe('seat budget', () => {
  it('gives narrow phones 3 seats, wide phones 4, mid-width 5, wide screens 6', () => {
    expect([360, 390, 480, 481, 720, 721, 1023, 1024, 1600].map(seatBudgetForWidth)).toEqual([3, 3, 3, 4, 4, 5, 5, 6, 6])
  })
})

describe('stage actors', () => {
  const stakeholders = Object.fromEntries(COUNCIL.map((id, index) => [id, { satisfaction: 40 + index * 10 }])) as never
  const cast = { roles: {} } as never

  it('without a seating, keeps the original first four', () => {
    expect(buildGameplayStageActors(stakeholders, {}, cast).map((actor) => actor.id)).toEqual(COUNCIL.slice(0, 4))
  })

  it('follows the seating, with a seat index per actor', () => {
    const actors = buildGameplayStageActors(stakeholders, {}, cast, {}, ['vp', 'on_call', 'support'])
    expect(actors.map((actor) => [actor.id, actor.seat])).toEqual([['vp', 0], ['on_call', 1], ['support', 2]])
  })
})
