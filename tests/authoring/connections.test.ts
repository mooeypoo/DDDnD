/**
 * Connections (the UI/UX audit, slice 3): what changes each council member's
 * satisfaction, from one walk that the council notes share, and what an
 * author still has to fill in.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  addMemberChange,
  changesByMember,
  connectGameMember,
  connectItemToMember,
  connectNewMember,
  COUNCIL_SEATS,
  scenarioRefs,
  createOwnCard,
  createOwnMember,
  draftFromBaseScenario,
  putContent,
  removeFromCouncil,
  toFillIn,
  unseatedNotes,
  type DraftPack,
} from '@/domains/authoring'
import type { Card, ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const BASE = path.resolve('content')

function base() {
  const registry = new ContentPackRegistry()
  registry.registerPack(JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest, createFileContentProvider(BASE))
  return registry.createScopedProvider(firstPartyPackKey('base'))
}

async function monolith(): Promise<DraftPack> {
  return (await draftFromBaseScenario(base(), { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [] })).draft
}

describe('what changes a council member', () => {
  it('lists the game\'s cards, events and their own reactions for a seated member', async () => {
    const changes = await changesByMember(await monolith(), base())
    const cto = changes.get('cto')!
    // In the Monolith no aftershock names the CTO; cards, events and their reactions do
    expect(new Set(cto.map((source) => source.section))).toEqual(new Set(['cards', 'events', 'stakeholder_reaction_rules']))
    expect(cto.every((source) => !source.own)).toBe(true)
    // The CTO's own reactions say whose they are
    expect(cto.filter((source) => source.section === 'stakeholder_reaction_rules').every((source) => source.via?.ref.id === 'cto')).toBe(true)
  })

  it('agrees with the council notes about someone who isn\'t seated, because it is the same walk', async () => {
    const without = removeFromCouncil(await monolith(), { id: 'cto', version: 1 })
    const [note] = await unseatedNotes(without, base())
    expect(note.stakeholder_id).toBe('cto')
    expect((await changesByMember(without, base())).get('cto')).toEqual(note.sources)
  })

  it('shows a new member only what the author\'s own content does to them (D21)', async () => {
    const made = createOwnMember(await monolith(), 'Head of Payments')
    const card = createOwnCard(made.draft, 'Freeze the Ledger')
    const draft = putContent(card.draft, 'cards', { ...(card.draft.content.cards[card.id] as Card), stakeholder_changes: [{ stakeholder_id: made.id, delta: -3 }] })
    expect((await changesByMember(draft, base())).get(made.id)).toEqual([
      { section: 'cards', ref: { id: card.id, version: 1 }, name: 'Freeze the Ledger', own: true, delta: -3 },
    ])
  })
})

describe('what is still to fill in', () => {
  it('has nothing for an untouched copy of a game scenario', async () => {
    expect(toFillIn(await monolith())).toEqual([])
  })

  it('lists the author\'s own items still named by the Studio, or without a description', async () => {
    const member = createOwnMember(await monolith())
    const card = createOwnCard(member.draft, 'Freeze the Ledger')
    expect(toFillIn(card.draft)).toEqual([
      { section: 'stakeholders', ref: { id: member.id, version: 1 }, name: 'New council member', missing: ['name', 'description'] },
      { section: 'cards', ref: { id: card.id, version: 1 }, name: 'Freeze the Ledger', missing: ['description'] },
    ])

    const described = putContent(card.draft, 'cards', { ...(card.draft.content.cards[card.id] as Card), description: 'Stop all ledger changes.' })
    expect(toFillIn(described).map((item) => item.section)).toEqual(['stakeholders'])
  })
})

describe('connecting from where you are (slice 3b)', () => {
  it('makes a new member from inside a card: named, seated, and changed by it, in one step', async () => {
    const card = createOwnCard(await monolith(), 'Freeze the Ledger')
    const connected = connectNewMember(card.draft, 'cards', card.id, '  Head of Payments ')!
    const member = connected.draft.content.stakeholders[connected.member.id]
    expect(member.name).toBe('Head of Payments')
    expect(scenarioRefs(connected.draft, 'stakeholder_refs')).toContainEqual(connected.member)
    expect(connected.draft.content.cards[card.id].stakeholder_changes).toEqual([{ stakeholder_id: connected.member.id, delta: 1 }])
    // A placeholder until it's described
    expect(toFillIn(connected.draft)).toContainEqual(expect.objectContaining({ section: 'stakeholders', missing: ['description'] }))
  })

  it('makes nobody when every seat is taken, or without a name', async () => {
    let draft = (createOwnCard(await monolith(), 'Freeze the Ledger')).draft
    const cardId = Object.keys(draft.content.cards)[0]
    expect(connectNewMember(draft, 'cards', cardId, '   ')).toBeNull()
    while (scenarioRefs(draft, 'stakeholder_refs').length < COUNCIL_SEATS) draft = createOwnMember(draft).draft
    expect(connectNewMember(draft, 'cards', cardId, 'One Too Many')).toBeNull()
  })

  it('seats one of the game\'s members and gives the card a change to them', async () => {
    const card = createOwnCard(await monolith(), 'Freeze the Ledger')
    const cfo = { id: 'cfo', version: 1 }
    const draft = connectGameMember(card.draft, 'cards', card.id, cfo)!
    expect(scenarioRefs(draft, 'stakeholder_refs')).toContainEqual(cfo)
    expect(draft.content.cards[card.id].stakeholder_changes).toEqual([{ stakeholder_id: 'cfo', delta: 1 }])
  })

  it('sets the change when the item already has one, rather than adding a second', async () => {
    const card = createOwnCard(await monolith(), 'Freeze the Ledger')
    const once = addMemberChange(card.draft, 'cards', card.id, 'cto', 2)
    expect(addMemberChange(once, 'cards', card.id, 'cto', -3).content.cards[card.id].stakeholder_changes).toEqual([{ stakeholder_id: 'cto', delta: -3 }])
  })

  it('from a member\'s page, makes your own version of the game\'s card first (D7), and it replaces the original', async () => {
    const draft = await monolith()
    const original = await base().loadCard({ id: 'define_bounded_context', version: 1 })
    const made = createOwnMember(draft, 'Head of Payments')
    const connected = connectItemToMember(made.draft, 'cards', original, made.id, -2)
    expect(connected.item.id).not.toBe('define_bounded_context')
    expect(connected.draft.content.cards[connected.item.id].stakeholder_changes).toContainEqual({ stakeholder_id: made.id, delta: -2 })
    expect(scenarioRefs(connected.draft, 'card_refs')).toContainEqual(connected.item)
    expect(scenarioRefs(connected.draft, 'card_refs').map((ref) => ref.id)).not.toContain('define_bounded_context')
    expect((await changesByMember(connected.draft, base())).get(made.id)).toEqual([expect.objectContaining({ ref: connected.item, own: true, delta: -2 })])
  })
})
