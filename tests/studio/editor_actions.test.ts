/**
 * The editors' actions and wording (the UI/UX audit, slice 2): every editor's
 * actions sit in its head; the game's content is shown locked, with one line
 * and a "Why?"; removing has a verb per scope ("Take out of this pack" for
 * the game's, "Delete" for your own) and asks first.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { createOwnCard, draftFromBaseScenario, isOwn, scenarioRefs, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const BASE = path.resolve('content')

function baseRegistry() {
  const manifest = JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest
  const provider = createFileContentProvider(BASE)
  const registry = new ContentPackRegistry()
  registry.registerPack(manifest, provider)
  return { manifest, provider, base: registry.createScopedProvider(firstPartyPackKey('base')) }
}

// The Studio's adapter reads the game's content over HTTP; here it reads the repository's
vi.mock('@studio/content/first_party', () => ({
  loadFirstParty: async () => {
    const { manifest, provider, base } = baseRegistry()
    return { packs: [{ manifest, provider }], base }
  },
  listBaseRefs: async () => [],
}))

const { default: DeckItemView } = await import('@studio/workspace/deck_item_view.vue')
const { default: MemberView } = await import('@studio/workspace/member_view.vue')
const { default: CouncilView } = await import('@studio/workspace/council_view.vue')

async function monolith(): Promise<{ draft: DraftPack; ownCardId: string }> {
  const { draft } = await draftFromBaseScenario(baseRegistry().base, { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [] })
  const made = createOwnCard(draft, 'Pair On It')
  return { draft: made.draft, ownCardId: made.id }
}

/** The game's content loads from disk here: wait until the editor has its head. */
async function loaded(wrapper: ReturnType<typeof mount>) {
  await vi.waitFor(async () => {
    await flushPromises()
    expect(wrapper.find('.editor-head').exists()).toBe(true)
  })
}

const headButtons = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.editor-head .head-actions button').map((button) => button.text())

async function mountItem(draft: DraftPack, itemRef: { id: string; version: number }) {
  const wrapper = mount(DeckItemView, { props: { section: 'cards', itemRef, draft, scoreOptions: [], stakeholderOptions: [], gameMembers: [], seatsLeft: 4 } })
  await loaded(wrapper)
  return wrapper
}

describe('a card from the game', () => {
  it('is shown locked: its actions in the head, one line on what to do, and the reasons behind "Why?"', async () => {
    const { draft } = await monolith()
    const gameCard = scenarioRefs(draft, 'card_refs').find((ref) => !isOwn(draft, 'cards', ref))!
    const wrapper = await mountItem(draft, gameCard)
    expect(headButtons(wrapper)).toEqual(['Make my own version', 'Take out of this pack'])
    expect(wrapper.find('.locked-note > p').text()).toBe('It plays exactly as in DDDnD. To change it, make your own version.')
    expect(wrapper.find('.locked-note details summary').text()).toBe('Why?')
    // Its limits, read-only, like everything else about it
    expect(wrapper.text()).toContain('How often it can be played')
    // No ember button in an editor: the toolbar's Export is the one (§9)
    expect(wrapper.find('.button-primary').exists()).toBe(false)
  })
})

describe('your own card', () => {
  it('is deleted from the head, after saying what goes', async () => {
    const { draft, ownCardId } = await monolith()
    const wrapper = await mountItem(draft, { id: ownCardId, version: 1 })
    expect(headButtons(wrapper)).toEqual(['Delete'])

    await wrapper.find('.head-actions .button-danger').trigger('click')
    expect(wrapper.find('.confirm-text').text()).toBe('Delete “Pair On It”? It\'s gone from your pack.')
    await wrapper.findAll('.confirm button').find((button) => button.text() === 'Keep it')!.trigger('click')
    expect(wrapper.find('.confirm').exists()).toBe(false)

    await wrapper.find('.head-actions .button-danger').trigger('click')
    await wrapper.findAll('.confirm button').find((button) => button.text() === 'Delete')!.trigger('click')
    const emitted = wrapper.emitted('change')!
    const [changed] = emitted[emitted.length - 1] as [DraftPack]
    expect(changed.content.cards[ownCardId]).toBeUndefined()
  })
})

describe('a council member from the game', () => {
  it('is copied or taken out of this pack from the head, and says what taking them out does', async () => {
    const { draft } = await monolith()
    const cto = scenarioRefs(draft, 'stakeholder_refs').find((ref) => ref.id === 'cto')!
    const options = scenarioRefs(draft, 'stakeholder_refs').map((ref) => ({ id: ref.id, name: ref.id }))
    const wrapper = mount(MemberView, { props: { memberRef: cto, draft, scoreOptions: [], stakeholderOptions: options, changes: [], gameMembers: [], seatsLeft: 4, deckChoices: [] } })
    await loaded(wrapper)
    expect(headButtons(wrapper)).toEqual(['Copy to a new member', 'Take out of this pack'])
    expect(wrapper.find('.locked-note > p').text()).toBe('They react exactly as in DDDnD. To change them, copy them to a new member.')

    await wrapper.findAll('.head-actions button').find((button) => button.text() === 'Take out of this pack')!.trigger('click')
    expect(wrapper.find('.confirm-text').text()).toMatch(/^Take “Chief Technology Officer” out of this pack\? They won't take part\./)
    expect(wrapper.findAll('.confirm button').map((button) => button.text())).toEqual(['Keep them', 'Take them out'])
  })
})

describe('the last council member', () => {
  it('can\'t be taken out: the button is off, and the hint says why', async () => {
    const { draft } = await monolith()
    const cto = scenarioRefs(draft, 'stakeholder_refs').find((ref) => ref.id === 'cto')!
    const wrapper = mount(MemberView, { props: { memberRef: cto, draft, scoreOptions: [], stakeholderOptions: [{ id: 'cto', name: 'Chief Technology Officer' }], changes: [], gameMembers: [], seatsLeft: 7, deckChoices: [] } })
    await loaded(wrapper)
    const takeOut = wrapper.findAll('.head-actions button').find((button) => button.text() === 'Take out of this pack')!
    expect(takeOut.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.editor-head .field-hint').text()).toBe('A council needs at least one member: seat someone else before taking Chief Technology Officer out.')
  })
})

describe('the council page', () => {
  it('marks only your own members, and makes new ones with a quiet "+ New member"', async () => {
    const { draft } = await monolith()
    const wrapper = mount(CouncilView, { props: { draft, councilRefs: scenarioRefs(draft, 'stakeholder_refs'), names: {} } })
    await flushPromises()
    expect(wrapper.findAll('.member-mark')).toHaveLength(0)
    const create = wrapper.find('.seat-own')
    expect(create.text()).toBe('+ New member')
    expect(create.classes()).toContain('button-quiet')
  })
})
