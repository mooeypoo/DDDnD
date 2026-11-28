/**
 * Undo and redo (M4.24): a history of whole drafts, typing grouped into one
 * step; and finding things the sidebar doesn't list.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { COUNCIL_SEATS, createDraft, createOwnCard, draftFromBaseScenario, nextRoundStep, putContent, removeFromDeck, scenarioRefs, startRound, updateDraftDetails, type DeckSection, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest, VersionRef } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { emptyHistory, GROUP_MS, MAX_STEPS, recordEdit, redoEdit, undoEdit } from '@studio/state/draft_history'
import ContentsNav from '@studio/workspace/contents_nav.vue'
import { stillThere } from '@studio/workspace/selection'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const named = (name: string) => createDraft({ kind: 'retelling', name })

describe('the history of a draft', () => {
  it('takes typing back in one step, and a pause starts the next', () => {
    let history = emptyHistory()
    // "R", "Re", "Rest": three edits in a burst, one step
    history = recordEdit(history, named(''), 0)
    history = recordEdit(history, named('R'), 200)
    history = recordEdit(history, named('Re'), 400)
    // A second later, another edit: a new step
    history = recordEdit(history, named('Rest'), 400 + GROUP_MS)
    const first = undoEdit(history, named('Rest, renamed'))!
    expect(first.draft.name).toBe('Rest')
    const second = undoEdit(first.history, first.draft)!
    expect(second.draft.name).toBe('')
    expect(undoEdit(second.history, second.draft)).toBeNull()
  })

  it("takes a new item's id back with its naming, however late it settles", () => {
    let history = recordEdit(emptyHistory(), named('no card'), 0)
    history = recordEdit(history, named('card, placeholder id'), 100)
    // The name field loses focus long after: the id follows the name, in the same step
    history = recordEdit(history, named('card, named'), 10 * GROUP_MS, { sameStep: true })
    expect(history.past.map((draft) => draft.name)).toEqual(['no card'])
    // …and what's typed right after is a step of its own
    history = recordEdit(history, named('card, settled id'), 10 * GROUP_MS + 100)
    expect(history.past.map((draft) => draft.name)).toEqual(['no card', 'card, settled id'])
  })

  it('redoes what was undone, until a new edit', () => {
    let history = recordEdit(emptyHistory(), named('A'), 0)
    const undone = undoEdit(history, named('B'))!
    const redone = redoEdit(undone.history, undone.draft)!
    expect(redone.draft.name).toBe('B')
    history = recordEdit(undone.history, undone.draft, 5000)
    expect(redoEdit(history, named('C'))).toBeNull()
  })

  it("keeps the guided round's place: moving through the round isn't an edit", () => {
    const before = startRound(named('A'))
    const now = nextRoundStep(nextRoundStep(updateDraftDetails(before, { name: 'B' })))
    const undone = undoEdit(recordEdit(emptyHistory(), before, 0), now)!
    expect(undone.draft.name).toBe('A')
    expect(undone.draft.round?.step).toBe('council')
  })

  it(`keeps the last ${MAX_STEPS} steps`, () => {
    let history = emptyHistory()
    for (let step = 0; step <= MAX_STEPS + 5; step++) history = recordEdit(history, named(String(step)), step * GROUP_MS * 2)
    expect(history.past).toHaveLength(MAX_STEPS)
    expect(history.past[0].name).toBe('6')
  })
})

describe('undo in the Studio', () => {
  it('records edits but not the round moving, and forgets everything at an export', async () => {
    vi.resetModules()
    const BASE = path.resolve('content')
    vi.doMock('@studio/content/first_party', () => ({
      listBaseRefs: async () => [],
      loadFirstParty: async () => {
        const registry = new ContentPackRegistry()
        const manifest = JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest
        registry.registerPack(manifest, createFileContentProvider(BASE))
        return { packs: [{ manifest, provider: createFileContentProvider(BASE) }], base: registry.createScopedProvider(firstPartyPackKey('base')) }
      },
      loadGameBalance: async () => null,
    }))
    const { exportCurrentDraft, redoDraft, startFromBaseScenario, startNewTopic, studio, undoDraft, updateDraft } = await import('@studio/state/studio_state')
    await startNewTopic('Incident Response', 'On call.')
    expect(studio.undo).toEqual({ can_undo: false, can_redo: false, said: '' })

    // Moving through the round isn't an edit to take back
    updateDraft(startRound(studio.current!.draft))
    expect(studio.undo.can_undo).toBe(false)
    updateDraft(updateDraftDetails(studio.current!.draft, { name: 'On Call' }))
    expect(studio.undo.can_undo).toBe(true)
    updateDraft(nextRoundStep(studio.current!.draft))
    undoDraft()
    // The rename is undone; the round stays where the author moved it
    expect(studio.current!.draft.name).toBe('Incident Response')
    expect(studio.current!.draft.round?.step).toBe('scores')  // a topic's round: its scores come next (M4.25)
    expect(studio.undo).toEqual({ can_undo: false, can_redo: true, said: 'Undone' })
    redoDraft()
    expect(studio.current!.draft.name).toBe('On Call')
    expect(studio.undo.said).toBe('Redone')

    // An export the checks refuse isn't out in the world: the history stays
    expect((await exportCurrentDraft('1.0.0')).length).toBeGreaterThan(0)
    expect(studio.undo.can_undo).toBe(true)

    // One that goes out is: undoing past it would forget what players have
    await startFromBaseScenario({ ref: { id: 'monolith_of_mild_despair', version: 2 }, name: 'The Monolith', summary: '' })
    updateDraft(updateDraftDetails(studio.current!.draft, { authors: [{ name: 'A' }] }))
    expect(studio.undo.can_undo).toBe(true)
    // The download itself is the browser's: jsdom can't follow the link
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    expect(await exportCurrentDraft('1.0.0')).toEqual([])
    expect(studio.undo.can_undo).toBe(false)
    vi.doUnmock('@studio/content/first_party')
  })
})

async function monolith(): Promise<DraftPack> {
  const BASE = path.resolve('content')
  const registry = new ContentPackRegistry()
  registry.registerPack(JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest, createFileContentProvider(BASE))
  return (await draftFromBaseScenario(registry.createScopedProvider(firstPartyPackKey('base')), { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [] })).draft
}

describe('what was open, after an undo', () => {
  it('is still there, or the workspace opens the summary', async () => {
    const made = createOwnCard(await monolith(), 'Pair On It')
    const selection = { kind: 'item' as const, section: 'cards' as const, ref: { id: made.id, version: 1 } }
    expect(stillThere(made.draft, selection)).toBe(true)
    expect(stillThere(removeFromDeck(made.draft, 'cards', selection.ref), selection)).toBe(false)
    expect(stillThere(made.draft, { kind: 'score', id: 'nope' })).toBe(false)
  })
})

describe('finding in the pack', () => {
  function navProps(draft: DraftPack) {
    const decks = (['cards', 'events'] as DeckSection[]).map((section) => ({ section, title: section, singular: section === 'cards' ? 'card' : 'event', refs: scenarioRefs(draft, section === 'cards' ? 'card_refs' : 'event_refs') }))
    const nameOf = (section: 'stakeholders' | DeckSection, ref: VersionRef) => (draft.content[section] as Record<string, { name?: string }>)[ref.id]?.name ?? ref.id
    return { draft, selection: { kind: 'details' as const }, councilRefs: scenarioRefs(draft, 'stakeholder_refs'), decks, seats: COUNCIL_SEATS, nameOf, toFillIn: new Set<string>(), changeCounts: {}, scores: [], showScores: false, maxScores: 12, shortcut: 'Ctrl', shortcutKeys: 'Control+K' }
  }

  it('finds your words too, and opens at the field they were found in', async () => {
    const made = createOwnCard(await monolith(), 'Pair On It')
    const draft = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], description: 'Two people, one ledger.' })
    const wrapper = mount(ContentsNav, { props: navProps(draft) })
    expect(wrapper.find('.filter input').attributes('placeholder')).toBe('Find in this pack (Ctrl K)')
    await wrapper.find('.filter input').setValue('ledger')
    await flushPromises()
    const rows = wrapper.findAll('.items .item').map((row) => [row.find('.item-name').text(), row.find('.item-kind').text()])
    expect(rows).toEqual([['Pair On It', 'card · in its description']])
    // Enter opens the first match
    await wrapper.find('.filter input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('goTo')).toEqual([[{ kind: 'item', section: 'cards', ref: { id: made.id, version: 1 }, field: { field: 'description' } }]])
  })
})
