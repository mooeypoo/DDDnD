/**
 * The pack summary and the start screen (the UI/UX audit, slice 4): where to
 * go next, what's still to fill in, and the author's packs first, each with
 * where it stands as a release.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { balanceHints, connectNewMember, createOwnCard, draftBalance, draftFromBaseScenario, gameBalance, putContent, releaseDraft, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const state = vi.hoisted(() => ({ studio: { ready: true, persistent: true, drafts: [] as Array<{ draft_id: string; draft: unknown; updated_at: string }> } }))
vi.mock('@studio/state/studio_state', () => ({ studio: state.studio, importPack: vi.fn(), removeDraft: vi.fn() }))

const { default: SummaryView } = await import('@studio/workspace/summary_view.vue')
const { default: PacksView } = await import('@studio/views/packs_view.vue')

const BASE = path.resolve('content')
function baseReader() {
  const registry = new ContentPackRegistry()
  const manifest = JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest
  registry.registerPack(manifest, createFileContentProvider(BASE))
  return { manifest, base: registry.createScopedProvider(firstPartyPackKey('base')) }
}
async function monolith(prefix = 'ours'): Promise<DraftPack> {
  return (await draftFromBaseScenario(baseReader().base, { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix, authors: [] })).draft
}
/** What the Studio's check works out (studio_state's checkNow), from the repository's content. */
async function balanceOf(draft: DraftPack) {
  const { manifest, base } = baseReader()
  const game = await gameBalance(await Promise.all(manifest.scenarios.map((ref) => base.loadScenario(ref))), base)
  const decks = await draftBalance(draft, base)
  return { decks, game, hints: balanceHints(draft, decks, game) }
}

describe('the pack summary', () => {
  it('says where to go next, links what is still to fill in, and what stops the export', async () => {
    const card = createOwnCard(await monolith(), 'Freeze the Ledger')
    const draft = connectNewMember(card.draft, 'cards', card.id, 'Head of Payments')!.draft
    const wrapper = mount(SummaryView, { props: { draft, seats: 8, checkState: 'done', issues: [{ file: 'manifest.json', message: 'authors: must be at least 1 item' }], notes: 0 } })
    const steps = wrapper.findAll('.step').map((step) => [step.classes().includes('step-done'), step.find('strong').text()])
    expect(steps).toEqual([
      [true, "Copied the game's scenario."],
      [true, 'Write a card of your own.'],
      [true, 'Bring your people to the table.'],
      [false, 'Fill in what you started.'],
      [false, 'Add your name.'],
      [false, 'Export it.'],
    ])
    expect(wrapper.findAll('.fill-list button').map((button) => button.text())).toEqual(['Head of Payments', 'Freeze the Ledger'])
    await wrapper.findAll('.fill-list button')[0].trigger('click')
    expect(wrapper.emitted('select')![0]).toEqual([{ kind: 'member', ref: expect.objectContaining({ version: 1 }) }])
    expect(wrapper.find('.issue-list').text()).toBe('Pack details: Add your name as the author.')
    expect(wrapper.find('.summary-lede').text()).toBe('DDD retelling · not exported yet')
  })
})

describe("the summary's balance", () => {
  it("shows the deck beside the game's, and opens a card worth a look", async () => {
    const made = createOwnCard(await monolith(), 'Hire a Platform Team')
    const draft = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], score_changes: [{ score_id: 'domain_clarity', delta: 6 }] })
    const wrapper = mount(SummaryView, { props: { draft, seats: 8, checkState: 'done', issues: [], notes: 0, balance: await balanceOf(draft) } })
    const section = wrapper.find('[aria-labelledby="summary-balance"]')
    expect(section.findAll('.plain').map((line) => line.text())).toEqual([
      expect.stringMatching(/^Your cards net \+\d+\.\d on average, aftershocks included; the game's scenarios: \+9\.0 to \+12\.2\.$/),
      expect.stringMatching(/^Your events net .+ a draw, weighted by how often each is drawn; the game's scenarios: \u22123\.3 to \+0\.5\.$/),
    ])
    expect(section.find('[role="status"]').text()).toBe('1 thing worth a look:')
    expect(section.find('.hint-list strong').text()).toBe('Hire a Platform Team only helps.')
    await section.find('.hint-list button').trigger('click')
    expect(wrapper.emitted('select')![0]).toEqual([{ kind: 'item', section: 'cards', ref: { id: made.id, version: 1 } }])
  })

  it("says so when a copy of the game's scenario has nothing worth a look", async () => {
    const draft = await monolith()
    const wrapper = mount(SummaryView, { props: { draft, seats: 8, checkState: 'done', issues: [], notes: 0, balance: await balanceOf(draft) } })
    expect(wrapper.find('[aria-labelledby="summary-balance"] [role="status"]').text()).toBe("Nothing worth a look: your deck is close to the game's numbers.")
  })
})

describe('your packs (#/packs, M4.27)', () => {
  it('lists the author\'s packs: what is theirs, where each stands, and a warning when two share a pack id', async () => {
    const released = releaseDraft(await monolith('acme'), '1.0.0')
    const changed = createOwnCard(released, 'Freeze the Ledger').draft
    const other = { ...(await monolith('acme')), name: 'Ours, again' }
    state.studio.drafts = [
      { draft_id: '1', draft: changed, updated_at: '2026-11-26T10:00:00Z' },
      { draft_id: '2', draft: other, updated_at: '2026-11-26T09:00:00Z' },
    ]
    const wrapper = mount(PacksView)
    await flushPromises()
    const tiles = wrapper.findAll('.pack-tile')
    expect(tiles[0].find('.tile-line').text()).toBe('1 card of your own.')
    expect(tiles[0].find('.tile-foot').text()).toContain('Changed since 1.0.0')
    expect(tiles[1].find('.tile-line').text()).toBe("Nothing of your own yet: the game's scenario as it is.")
    expect(tiles[1].find('.tile-foot').text()).toContain('Not exported yet')
    expect(tiles[0].find('.tile-shared').text()).toContain('the same pack id as “Ours, again”')
    // One name per kind, and one ember action that says what it does
    expect(tiles[0].find('.kind-pill').text()).toBe('DDD retelling')
    expect(wrapper.find('.button-primary').text()).toBe('Create a pack')
    await wrapper.find('.button-primary').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
  })
})
