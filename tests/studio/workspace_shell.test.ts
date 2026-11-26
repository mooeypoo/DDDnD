/**
 * The workspace's shell (the UI/UX audit, D23): the contents sidebar (groups,
 * your own items first, the game's under their own heading, a filter) and
 * the checks button in the toolbar.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { COUNCIL_SEATS, createOwnCard, draftFromBaseScenario, isOwn, scenarioRefs, type DeckSection, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest, VersionRef } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import ChecksButton from '@studio/workspace/checks_button.vue'
import ContentsNav from '@studio/workspace/contents_nav.vue'
import type { Selection } from '@studio/workspace/selection'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const BASE = path.resolve('content')

async function monolithWithOwnCard(): Promise<DraftPack> {
  const registry = new ContentPackRegistry()
  registry.registerPack(JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest, createFileContentProvider(BASE))
  const { draft } = await draftFromBaseScenario(registry.createScopedProvider(firstPartyPackKey('base')), { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [] })
  return createOwnCard(draft, 'Pair On It').draft
}

function navProps(draft: DraftPack, selection: Selection) {
  const decks = (['cards', 'events'] as DeckSection[]).map((section) => ({
    section,
    title: section === 'cards' ? 'Cards' : 'Events',
    singular: section === 'cards' ? 'card' : 'event',
    refs: scenarioRefs(draft, section === 'cards' ? 'card_refs' : 'event_refs'),
  }))
  // Names as the workspace gives them: the draft's own, else the id stands in for the game's name here
  const nameOf = (section: 'stakeholders' | DeckSection, ref: VersionRef) => {
    const own = (draft.content[section] as Record<string, { name?: string }>)[ref.id]
    return own?.name ?? ref.id.replace(/_/g, ' ')
  }
  return { draft, selection, councilRefs: scenarioRefs(draft, 'stakeholder_refs'), decks, seats: COUNCIL_SEATS, nameOf, toFillIn: new Set<string>(), changeCounts: {}, scores: [], showScores: false, maxScores: 12 }
}

const itemNames = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.item .item-name').map((name) => name.text())

describe('the contents sidebar', () => {
  it('lists your own cards first, and keeps the game\'s under "From the game", closed', async () => {
    const draft = await monolithWithOwnCard()
    const wrapper = mount(ContentsNav, { props: navProps(draft, { kind: 'details' }) })
    const names = itemNames(wrapper)
    expect(names).toContain('Pair On It')
    expect(names).not.toContain('define bounded context')
    const gameToggle = wrapper.findAll('.subgroup-toggle').find((toggle) => toggle.text().startsWith('From the game'))!
    expect(gameToggle.attributes('aria-expanded')).toBe('false')
    expect(gameToggle.text()).toMatch(/From the game\s*26/)

    await gameToggle.trigger('click')
    const opened = itemNames(wrapper)
    expect(opened.indexOf('Pair On It')).toBeLessThan(opened.indexOf('define bounded context'))
  })

  it('opens the group of whatever is selected, so a check\'s "Go to it" shows it', async () => {
    const draft = await monolithWithOwnCard()
    const gameCard = scenarioRefs(draft, 'card_refs').find((ref) => !isOwn(draft, 'cards', ref))!
    const wrapper = mount(ContentsNav, { props: navProps(draft, { kind: 'details' }) })
    await wrapper.findAll('.group-toggle').find((toggle) => toggle.text().startsWith('Cards'))!.trigger('click')
    expect(itemNames(wrapper)).not.toContain('Pair On It')

    await wrapper.setProps({ selection: { kind: 'item', section: 'cards', ref: gameCard } })
    await flushPromises()
    expect(wrapper.find('[aria-current="page"] .item-name').text()).toBe(gameCard.id.replace(/_/g, ' '))
  })

  it('filters everything in the pack by name, saying what each match is', async () => {
    const draft = await monolithWithOwnCard()
    const wrapper = mount(ContentsNav, { props: navProps(draft, { kind: 'details' }) })
    await wrapper.find('input[type="search"]').setValue('pair on')
    expect(wrapper.findAll('.item').map((item) => item.text())).toEqual(['Pair On Itcard'])
    await wrapper.find('input[type="search"]').setValue('nothing like this')
    expect(wrapper.find('.empty').text()).toBe('Nothing called “nothing like this” in this pack.')
  })

  it('emits what to open, and turns "+ New member" off when every seat is taken', async () => {
    const draft = await monolithWithOwnCard()
    const wrapper = mount(ContentsNav, { props: { ...navProps(draft, { kind: 'details' }), seats: 4 } })
    expect(wrapper.findAll('.action').find((action) => action.text() === '+ New member')!.attributes('disabled')).toBeDefined()
    await wrapper.findAll('.action').find((action) => action.text() === '+ New card')!.trigger('click')
    expect(wrapper.emitted('createNew')).toEqual([['cards']])
  })
})

describe('the checks button', () => {
  const issue = { file: 'manifest.json', message: 'authors: add at least one' }

  it('says how the pack stands, and announces it politely without opening', () => {
    const checking = mount(ChecksButton, { props: { state: 'checking', issues: [], notes: [], full: false } })
    expect(checking.find('.checks-toggle').text()).toContain('Checking…')
    expect(checking.find('[role="status"]').text()).toBe('')

    const ready = mount(ChecksButton, { props: { state: 'done', issues: [], notes: [], full: false } })
    expect(ready.find('.checks-toggle').classes()).toContain('status-ok')
    expect(ready.find('[role="status"]').text()).toBe('Ready to export')

    const problems = mount(ChecksButton, { props: { state: 'done', issues: [issue, issue], notes: [{} as never], full: false } })
    expect(problems.find('.checks-toggle').text()).toMatch(/2 to fix\s*· 1 note/)
    expect(problems.find('[role="status"]').text()).toBe('2 things to fix before export. 1 note.')
  })

  it('opens the checks, and Escape closes them and returns focus to the button', async () => {
    const wrapper = mount(ChecksButton, { props: { state: 'done', issues: [issue], notes: [], full: false }, attachTo: document.body })
    await wrapper.find('.checks-toggle').trigger('click')
    await flushPromises()
    expect(wrapper.find('.checks-toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#checks-panel').text()).toContain('1 thing to fix before export')
    // Only the button announces: the panel's status isn't a second live region
    expect(wrapper.findAll('[aria-live]')).toHaveLength(1)

    await wrapper.find('#checks-panel').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('#checks-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.checks-toggle').element)
    wrapper.unmount()
  })

  it('"Go to it" closes the panel and passes the target on', async () => {
    const wrapper = mount(ChecksButton, { props: { state: 'done', issues: [issue], notes: [], full: false } })
    await wrapper.find('.checks-toggle').trigger('click')
    await wrapper.find('.issue-go').trigger('click')
    expect(wrapper.find('#checks-panel').exists()).toBe(false)
    expect(wrapper.emitted('goTo')).toEqual([[{ kind: 'details' }]])
  })
})
