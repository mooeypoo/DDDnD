/**
 * The Studio's state (M4.3): drafts reach storage and the domain as plain
 * data, even when they come from Vue's reactive state.
 */

import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import { addContent, createDraft, updateDraftDetails } from '@/domains/authoring'
import { createMemoryDraftStore } from '@studio/drafts/draft_store'
import { plainDraft } from '@studio/state/studio_state'

describe('plain drafts', () => {
  it('unwraps nested reactive data, which structuredClone refuses', async () => {
    const state = reactive({ draft: addContent(createDraft({ kind: 'retelling', name: 'X', authors: [{ name: 'A' }] }), 'scores', { name: 'Rest', short_name: 'Rest', description: 'd', default_value: 1 }).draft })
    // What an editor does: build the next draft from the reactive one
    const edited = updateDraftDetails(state.draft, { name: 'Y' })
    expect(() => structuredClone(edited)).toThrow()
    const plain = plainDraft(edited)
    expect(() => structuredClone(plain)).not.toThrow()
    expect(plain).toEqual(JSON.parse(JSON.stringify(edited)))

    const store = createMemoryDraftStore()
    await store.put({ draft_id: 'd1', draft: plain, updated_at: '2026-11-24T00:00:00Z' })
    expect((await store.get('d1'))?.draft.name).toBe('Y')
  })
})

describe('draft store', () => {
  it('lists drafts newest first and removes them', async () => {
    const store = createMemoryDraftStore()
    const draft = createDraft({ kind: 'retelling', name: 'A' })
    await store.put({ draft_id: 'old', draft, updated_at: '2026-11-01T00:00:00Z' })
    await store.put({ draft_id: 'new', draft, updated_at: '2026-11-24T00:00:00Z' })
    expect((await store.list()).map((entry) => entry.draft_id)).toEqual(['new', 'old'])
    await store.remove('old')
    expect((await store.list()).map((entry) => entry.draft_id)).toEqual(['new'])
    expect(store.persistent).toBe(false)
  })
})

describe('opening the draft that is already open', () => {
  it('keeps it, with an edit not yet saved, instead of reading an older copy back (the round and the workspace are two views of one draft)', async () => {
    vi.resetModules()
    vi.doMock('@studio/content/first_party', () => ({
      listBaseRefs: async () => [],
      loadFirstParty: async () => ({ packs: [], base: {} }),
    }))
    const { openDraft, startNewTopic, studio, updateDraft } = await import('@studio/state/studio_state')
    const id = await startNewTopic('Incident Response', 'On call.')
    updateDraft({ ...studio.current!.draft, name: 'Edited, not saved yet' })
    expect(await openDraft(id)).toBe(true)
    expect(studio.current?.draft.name).toBe('Edited, not saved yet')
    vi.doUnmock('@studio/content/first_party')
  })
})
