/**
 * The deck (docs/PACK_STUDIO.md M4.4): a draft's cards and events, and the
 * plain-words description and "only helps" nudge the editors show.
 */

import { describe, expect, it } from 'vitest'

import {
  addContent,
  addToDeck,
  createDraft,
  createOwnCard,
  createOwnEvent,
  describeEffects,
  putContent,
  settleNewItemId,
  isOwn,
  netScoreChange,
  onlyHelps,
  removeFromDeck,
  type DraftPack,
} from '@/domains/authoring'

function withScenario(): DraftPack {
  const draft = createDraft({ kind: 'retelling', name: 'Deck test', prefix: 'dk', authors: [{ name: 'A' }] })
  return addContent(draft, 'scenarios', {
    name: 'S', description: 'd', max_turns: 8, starting_scores: {}, score_refs: [], stakeholder_refs: [],
    card_refs: [{ id: 'define_bounded_context', version: 1 }], event_refs: [],
  }).draft
}

const scenarioOf = (draft: DraftPack) => Object.values(draft.content.scenarios)[0]

describe('the deck', () => {
  it('adds a new card of the draft\'s own to the deck', () => {
    const { draft, id } = createOwnCard(withScenario(), 'Split the Payments Service')
    expect(id).toBe('dk_split_the_payments_service')
    expect(scenarioOf(draft).card_refs).toContainEqual({ id, version: 1 })
    expect(isOwn(draft, 'cards', { id, version: 1 })).toBe(true)
    expect(isOwn(draft, 'cards', { id: 'define_bounded_context', version: 1 })).toBe(false)
  })

  it('adds a new event with a middling weight', () => {
    const { draft, id } = createOwnEvent(withScenario(), 'Audit Season')
    expect(draft.content.events[id].occurrence_weight).toBe(3)
    expect(scenarioOf(draft).event_refs).toContainEqual({ id, version: 1 })
  })

  it('adds a game card once, and takes it out without touching the game', () => {
    const ref = { id: 'ship_quick_fix', version: 1 }
    const added = addToDeck(addToDeck(withScenario(), 'cards', ref), 'cards', ref)
    expect(scenarioOf(added).card_refs.filter((r) => r.id === 'ship_quick_fix')).toHaveLength(1)
    const removed = removeFromDeck(added, 'cards', ref)
    expect(scenarioOf(removed).card_refs).not.toContainEqual(ref)
  })

  it('deletes the draft\'s own card when it leaves the deck', () => {
    const { draft, id } = createOwnCard(withScenario(), 'Temporary')
    const removed = removeFromDeck(draft, 'cards', { id, version: 1 })
    expect(removed.content.cards).not.toHaveProperty(id)
  })
})

describe('naming a new card', () => {
  it('gives it the id of its real name, once, and the deck follows', () => {
    const made = createOwnCard(withScenario(), 'New card')
    expect(made.id).toBe('dk_new_card')
    const named = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], name: 'Split the Refunds Context' })
    const settled = settleNewItemId(named, 'cards', made.id)
    expect(settled.id).toBe('dk_split_the_refunds_context')
    expect(settled.draft.content.cards).not.toHaveProperty('dk_new_card')
    expect(scenarioOf(settled.draft).card_refs).toContainEqual({ id: 'dk_split_the_refunds_context', version: 1 })
    expect(scenarioOf(settled.draft).card_refs).not.toContainEqual({ id: 'dk_new_card', version: 1 })

    // Renamed again later: the id stays
    const renamed = putContent(settled.draft, 'cards', { ...settled.draft.content.cards[settled.id], name: 'Something else' })
    expect(settleNewItemId(renamed, 'cards', settled.id).id).toBe(settled.id)
  })

  it('leaves an unnamed new card, and a second new card, alone', () => {
    const first = createOwnCard(withScenario(), 'New card')
    const second = createOwnCard(first.draft, 'New card')
    expect(second.id).toBe('dk_new_card_2')
    expect(settleNewItemId(second.draft, 'cards', second.id).id).toBe('dk_new_card_2')
  })
})

describe('describing effects', () => {
  const names = { scores: { rest: 'Rest', sight: 'Sight', uptime: 'Uptime' }, stakeholders: { oncall: 'the On-Call Engineer' } }

  it('says what a card does in plain words', () => {
    const effects = {
      score_changes: [{ score_id: 'rest', delta: 8 }, { score_id: 'sight', delta: 2 }, { score_id: 'uptime', delta: -1 }],
      stakeholder_changes: [{ stakeholder_id: 'oncall', delta: 4 }],
    }
    expect(describeEffects(effects, names)).toBe('raises Rest by 8 and Sight by 2; lowers Uptime by 1; makes the On-Call Engineer happier (+4)')
    expect(netScoreChange(effects)).toBe(9)
  })

  it('says when nothing happens yet', () => {
    expect(describeEffects({ score_changes: [] }, names)).toBe('changes nothing yet')
  })

  it('spots a card that only helps (every move should trade something away)', () => {
    expect(onlyHelps({ score_changes: [{ score_id: 'rest', delta: 6 }, { score_id: 'sight', delta: 3 }] })).toBe(true)
    expect(onlyHelps({ score_changes: [{ score_id: 'rest', delta: 6 }, { score_id: 'sight', delta: -3 }] })).toBe(false)
    expect(onlyHelps({ score_changes: [{ score_id: 'rest', delta: 6 }], stakeholder_changes: [{ stakeholder_id: 'oncall', delta: -2 }] })).toBe(false)
    expect(onlyHelps({ score_changes: [] })).toBe(false)
  })
})
