/** Finding the author's own content by name or by their words (M4.24). */

import { describe, expect, it } from 'vitest'

import { addNewAftershock, addReaction, createDraft, createOwnCard, createOwnMember, putContent, searchOwnContent } from '@/domains/authoring'

describe('searching your own content', () => {
  const start = createDraft({ kind: 'retelling', name: 'Ours', prefix: 'ours' })

  it('lists name matches first, then matches in your words, ignoring case and accents', () => {
    const card = createOwnCard(start, 'Café Rota')
    let draft = card.draft
    const other = createOwnCard(draft, 'Pair On It')
    draft = putContent(other.draft, 'cards', { ...other.draft.content.cards[other.id], description: 'Over coffee at the CAFE.' })
    expect(searchOwnContent(draft, 'cafe').map((match) => [match.name, match.found_in])).toEqual([['Café Rota', 'name'], ['Pair On It', 'description']])
    expect(searchOwnContent(draft, '  ')).toEqual([])
  })

  it("says whose page a reaction or an aftershock is on", () => {
    const member = createOwnMember(start)
    let draft = putContent(member.draft, 'stakeholders', { ...member.draft.content.stakeholders[member.id], name: 'Head of Payments' })
    const reaction = addReaction(draft, member.id, { id: 'user_trust', name: 'User Trust' })
    draft = putContent(reaction.draft, 'stakeholder_reaction_rules', { ...reaction.draft.content.stakeholder_reaction_rules[reaction.id], name: 'Nervous About Refunds' })
    const card = createOwnCard(draft, 'Freeze the Ledger')
    const aftershock = addNewAftershock(card.draft, 'cards', card.id)
    draft = putContent(aftershock.draft, 'delayed_effects', { ...aftershock.draft.content.delayed_effects[aftershock.id], name: 'Backlog Piles Up' })
    const found = searchOwnContent(draft, 'u')
    expect(found.find((match) => match.name === 'Nervous About Refunds')?.on).toMatchObject({ section: 'stakeholders', name: 'Head of Payments' })
    expect(found.find((match) => match.name === 'Backlog Piles Up')?.on).toMatchObject({ section: 'cards', name: 'Freeze the Ledger' })
  })
})
