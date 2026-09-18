import { describe, expect, it } from 'vitest'

import { consultApprovalTitle, consultReplaceSummary, diffHandCards, peekConsultDrawId } from '@/ui/play/hand_swap'

describe('diffHandCards', () => {
  it('treats a consult discard as committed, not an unplayable drop', () => {
    const diff = diffHandCards(
      ['keep', 'discard', 'stay'],
      ['keep', 'drawn', 'stay'],
      { discardedId: 'discard' },
    )

    expect(diff.departedIds).toEqual(['discard'])
    expect(diff.arrivedIds).toEqual(['drawn'])
    expect(diff.unplayableDepartedIds).toEqual([])
  })

  it('marks leftover departed cards as unplayable drops', () => {
    const diff = diffHandCards(
      ['played', 'illegal', 'keep'],
      ['keep', 'refill', 'fresh'],
      { playedId: 'played' },
    )

    expect(diff.unplayableDepartedIds).toEqual(['illegal'])
    expect(diff.arrivedIds).toEqual(['refill', 'fresh'])
  })
})

describe('consultReplaceSummary', () => {
  it('names the set-aside card and the page that took its place', () => {
    expect(consultReplaceSummary('Quick Patch', 'Split the Monolith')).toBe(
      'You set aside Quick Patch. Split the Monolith took its place.',
    )
  })
})

describe('consultApprovalTitle', () => {
  it('names both pages in the approval line', () => {
    expect(consultApprovalTitle('Quick Patch', 'Split the Monolith')).toBe(
      'Quick Patch replaced by Split the Monolith',
    )
  })
})

describe('peekConsultDrawId', () => {
  it('prefers the first still-legal deck card', () => {
    expect(peekConsultDrawId(['held', 'legal', 'later'], ['legal', 'later'])).toBe('legal')
  })

  it('falls back to the deck front when nothing is marked playable', () => {
    expect(peekConsultDrawId(['front', 'later'], [])).toBe('front')
  })
})
