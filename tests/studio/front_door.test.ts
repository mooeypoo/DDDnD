/**
 * The Studio's front door (the first-screen audit, M4.27–M4.28): a welcome
 * page with one ember action and the latest packs, a create screen that asks
 * what the pack is about and then how to start, and a look at a scenario
 * before anything is copied.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { draftFromBaseScenario, previewBaseScenario, startRound, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const BASE = path.resolve('content')
function base() {
  const registry = new ContentPackRegistry()
  const manifest = JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest
  registry.registerPack(manifest, createFileContentProvider(BASE))
  return registry.createScopedProvider(firstPartyPackKey('base'))
}
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }
const choice = { ref: MONOLITH, name: 'The Monolith of Mild Despair', summary: 'Stabilize a tangled legacy monolith.', council: 4, cards: 26, events: 11, turns: 10 }

const state = vi.hoisted(() => ({
  studio: { ready: true, persistent: true, drafts: [] as Array<{ draft_id: string; draft: unknown; updated_at: string }> },
  startFromBaseScenario: vi.fn(async () => 'copied'),
  startRetellingFromScratch: vi.fn(async () => 'blank'),
}))
vi.mock('@studio/state/studio_state', () => ({
  studio: state.studio,
  startFromBaseScenario: state.startFromBaseScenario,
  startRetellingFromScratch: state.startRetellingFromScratch,
  startNewTopic: vi.fn(),
  importPack: vi.fn(),
}))
vi.mock('@studio/content/first_party', () => ({
  listBaseScenarios: async () => [choice],
  previewScenario: (ref: typeof MONOLITH) => previewBaseScenario(base(), ref),
  exampleMove: async () => ({ scenario: 'The Monolith of Mild Despair', card: 'Define Bounded Context', words: 'Domain Clarity +6; Chief Technology Officer +2 satisfaction' }),
}))

const { default: WelcomeView } = await import('@studio/views/welcome_view.vue')
const { default: CreateView } = await import('@studio/views/create_view.vue')
const { default: StudioHeader } = await import('@studio/components/studio_header.vue')

async function monolith(name: string): Promise<DraftPack> {
  return { ...(await draftFromBaseScenario(base(), MONOLITH, { name, authors: [] })).draft, name }
}

describe('the welcome page', () => {
  it('says what DDDnD and a pack are, with one ember action, and a real move from the game', async () => {
    state.studio.drafts = []
    const wrapper = mount(WelcomeView)
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Make DDDnD about your world')
    expect(wrapper.findAll('.button-primary').map((button) => button.text())).toEqual(['Create a pack'])
    expect(wrapper.find('.turn-card').text()).toBe('Define Bounded Context Domain Clarity +6; Chief Technology Officer +2 satisfaction')
    expect(wrapper.findAll('.kind .kind-pill').map((pill) => pill.text())).toEqual(['DDD retelling', 'New subject'])
    // No packs yet: nothing to pick up
    expect(wrapper.find('.continue').exists()).toBe(false)
    await wrapper.find('.button-primary').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('shows the latest packs high on it, a round in progress by its step, and all of them one click away', async () => {
    const inRound = startRound(await monolith('Acme, in the round'))
    state.studio.drafts = [
      { draft_id: 'a', draft: { ...inRound, round: { step: 'cards', passed: [] } }, updated_at: '2026-11-27T10:00:00Z' },
      { draft_id: 'b', draft: await monolith('Second'), updated_at: '2026-11-27T09:00:00Z' },
      { draft_id: 'c', draft: await monolith('Third'), updated_at: '2026-11-27T08:00:00Z' },
      { draft_id: 'd', draft: await monolith('Fourth'), updated_at: '2026-11-27T07:00:00Z' },
    ]
    const wrapper = mount(WelcomeView)
    await flushPromises()
    const tiles = wrapper.findAll('.continue-tile')
    expect(tiles.map((tile) => tile.find('.continue-name').text())).toEqual(['Acme, in the round', 'Second', 'Third', 'All your packs (4)'])
    expect(tiles[0].find('.continue-line').text()).toBe('Guided round: step 4 of 8')
    await tiles[0].find('button').trigger('click')
    expect(wrapper.emitted('openDraft')).toEqual([['a', true]])
  })
})

describe('the create screen', () => {
  const choose = async (wrapper: ReturnType<typeof mount>, text: string) => {
    await wrapper.findAll('label.choice').find((label) => label.text().includes(text))!.find('input').setValue(true)
  }

  it('asks what the pack is about, then how to start: three ways for a retelling, nothing made yet', async () => {
    const wrapper = mount(CreateView)
    await flushPromises()
    expect(wrapper.findAll('legend').map((legend) => legend.text())).toEqual(["What's your pack about?", 'How do you want to start?'])
    expect(wrapper.findAll('fieldset')[1].findAll('.choice-title').map((title) => title.text())).toEqual(['Step by step', "From one of the game's scenarios", 'From scratch'])
    expect(wrapper.find('.recommended').text()).toBe('Recommended for a first pack')
    // Nothing chosen, nothing shown, nothing made
    expect(wrapper.find('.gallery').exists()).toBe(false)
    expect(state.startFromBaseScenario).not.toHaveBeenCalled()
  })

  it('previews a scenario before copying it, and copies only on yes', async () => {
    const wrapper = mount(CreateView, { attachTo: document.body })
    await flushPromises()
    await choose(wrapper, "From one of the game's scenarios")
    expect(wrapper.find('.scenario-facts').text()).toBe('4 at the table · 26 cards · 11 events · 10 turns')
    await wrapper.find('.scenario .button').trigger('click')
    await vi.waitFor(async () => {
      await flushPromises()
      expect(wrapper.find('.people').exists()).toBe(true)
    })
    const dialog = wrapper.find('dialog')
    expect(dialog.find('.preview-title').text()).toBe('The Monolith of Mild Despair')
    expect(dialog.findAll('.score span:first-child').map((name) => name.text())[0]).toBe('Domain Clarity')
    expect(dialog.findAll('.people li').map((person) => person.text())).toEqual(['Chief Technology Officer', 'VP of Product', 'Lead Developer', 'Operations Manager'])
    // "Keep looking" makes nothing
    await dialog.findAll('button').find((button) => button.text() === 'Keep looking')!.trigger('click')
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(state.startFromBaseScenario).not.toHaveBeenCalled()
    // Yes, this one
    await wrapper.find('.scenario .button').trigger('click')
    await vi.waitFor(async () => {
      await flushPromises()
      expect(wrapper.find('.people').exists()).toBe(true)
    })
    await wrapper.find('dialog .button-primary').trigger('click')
    await flushPromises()
    expect(state.startFromBaseScenario).toHaveBeenCalledWith(choice, { guided: false })
    expect(wrapper.emitted('openDraft')).toEqual([['copied', false]])
    wrapper.unmount()
  })

  it('starts the round from a scenario, when step by step is chosen', async () => {
    const wrapper = mount(CreateView, { props: { how: 'guided' } })
    await flushPromises()
    expect(wrapper.find('#gallery-title').text()).toBe("Which of the game's stories is closest to yours?")
  })

  it('starts a DDD retelling from scratch with a name', async () => {
    const wrapper = mount(CreateView)
    await choose(wrapper, 'From scratch')
    await wrapper.find('form input').setValue('Payments at Acme')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(state.startRetellingFromScratch).toHaveBeenCalledWith('Payments at Acme', '')
    expect(wrapper.emitted('openDraft')).toEqual([['blank', false]])
  })
})

describe('the header', () => {
  it('goes home from the brand, and links your packs, the Studio guide and the game', () => {
    const wrapper = mount(StudioHeader, { props: { textSize: 'standard' } })
    expect(wrapper.find('a.brand').attributes('href')).toBe('#/')
    expect(wrapper.findAll('.header-nav a').map((link) => [link.text().replace(' (opens in a new tab)', ''), link.attributes('href')])).toEqual([
      ['Your packs', '#/packs'],
      ['Guide', 'https://mooeypoo.github.io/DDDnD/guide/pack-studio'],
      ['Play DDDnD', 'https://dddnd.app'],
    ])
  })
})
