/**
 * The pack summary and the start screen (the UI/UX audit, slice 4): where to
 * go next, what's still to fill in, and the author's packs first, each with
 * where it stands as a release.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { connectNewMember, createOwnCard, draftFromBaseScenario, releaseDraft, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const state = vi.hoisted(() => ({ studio: { ready: true, persistent: true, drafts: [] as Array<{ draft_id: string; draft: unknown; updated_at: string }> } }))
vi.mock('@studio/state/studio_state', () => ({ studio: state.studio, importPack: vi.fn(), removeDraft: vi.fn() }))

const { default: SummaryView } = await import('@studio/workspace/summary_view.vue')
const { default: StartView } = await import('@studio/views/start_view.vue')

const BASE = path.resolve('content')
async function monolith(prefix = 'ours'): Promise<DraftPack> {
  const registry = new ContentPackRegistry()
  registry.registerPack(JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest, createFileContentProvider(BASE))
  return (await draftFromBaseScenario(registry.createScopedProvider(firstPartyPackKey('base')), { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix, authors: [] })).draft
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
    expect(wrapper.find('.summary-lede').text()).toBe('A retelling of DDDnD · not exported yet')
  })
})

describe('the start screen', () => {
  it('leads with the author\'s packs: what is theirs, where each stands, and a warning when two share a pack id', async () => {
    const released = releaseDraft(await monolith('acme'), '1.0.0')
    const changed = createOwnCard(released, 'Freeze the Ledger').draft
    const other = { ...(await monolith('acme')), name: 'Ours, again' }
    state.studio.drafts = [
      { draft_id: '1', draft: changed, updated_at: '2026-11-26T10:00:00Z' },
      { draft_id: '2', draft: other, updated_at: '2026-11-26T09:00:00Z' },
    ]
    const wrapper = mount(StartView)
    await flushPromises()
    const tiles = wrapper.findAll('.pack-tile')
    expect(tiles[0].find('.tile-line').text()).toBe('1 card of your own.')
    expect(tiles[0].find('.tile-foot').text()).toContain('Changed since 1.0.0')
    expect(tiles[1].find('.tile-line').text()).toBe("Nothing of your own yet: the game's scenario as it is.")
    expect(tiles[1].find('.tile-foot').text()).toContain('Not exported yet')
    expect(tiles[0].find('.tile-shared').text()).toContain('the same pack id as “Ours, again”')
    expect(wrapper.find('.button-primary').text()).toBe('+ New pack')
    await wrapper.find('.button-primary').trigger('click')
    expect(wrapper.emitted('newPack')).toHaveLength(1)
  })
})
