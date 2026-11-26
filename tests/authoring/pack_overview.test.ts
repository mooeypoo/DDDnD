/**
 * A pack at a glance (the UI/UX audit, slice 4): its release state, where to
 * go next, its counts, and drafts that would export under the same pack id.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  connectNewMember,
  createOwnCard,
  draftFromBaseScenario,
  nextSteps,
  packCounts,
  putContent,
  releaseDraft,
  releaseState,
  sharedPackIds,
  updateDraftDetails,
  type DraftPack,
} from '@/domains/authoring'
import type { Card, ContentPackManifest, Stakeholder } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const BASE = path.resolve('content')

async function copyOf(scenario: { id: string; version: number }, prefix = 'ours'): Promise<DraftPack> {
  const registry = new ContentPackRegistry()
  registry.registerPack(JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest, createFileContentProvider(BASE))
  return (await draftFromBaseScenario(registry.createScopedProvider(firstPartyPackKey('base')), scenario, { name: 'Ours', prefix, authors: [] })).draft
}
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }

describe('where a pack stands as a release', () => {
  it('is never exported, then unchanged at its version, then changed since it', async () => {
    const draft = await copyOf(MONOLITH)
    expect(releaseState(draft)).toEqual({ state: 'never' })
    const released = releaseDraft(draft, '1.0.0')
    expect(releaseState(released)).toEqual({ state: 'unchanged', version: '1.0.0', imported: false })
    expect(releaseState(createOwnCard(released, 'Pair On It').draft)).toEqual({ state: 'changed', version: '1.0.0', imported: false })
  })

  it('says when the version is the imported pack\'s, until the Studio exports its own', async () => {
    const released = releaseDraft(await copyOf(MONOLITH), '1.1.0')
    const imported = { ...released, released: { ...released.released!, imported: true as const } }
    expect(releaseState(imported)).toEqual({ state: 'unchanged', version: '1.1.0', imported: true })
    expect(releaseState(releaseDraft(createOwnCard(imported, 'Pair On It').draft, '1.2.0'))).toEqual({ state: 'unchanged', version: '1.2.0', imported: false })
  })
})

describe('where to go next', () => {
  it('starts with only the copy done, and ticks each step off from what the draft holds', async () => {
    const draft = await copyOf(MONOLITH)
    expect(nextSteps(draft)).toEqual([
      { step: 'write_a_card', done: false },
      { step: 'bring_your_people', done: false },
      { step: 'fill_in', done: true },
      { step: 'add_author', done: false },
      { step: 'export', done: false },
    ])

    const card = createOwnCard(draft, 'Freeze the Ledger')
    const connected = connectNewMember(card.draft, 'cards', card.id, 'Head of Payments')!
    const steps = nextSteps(connected.draft)
    expect(steps.filter((step) => step.done).map((step) => step.step)).toEqual(['write_a_card', 'bring_your_people'])

    // Described, named and exported: every step done
    let finished = putContent(connected.draft, 'cards', { ...(connected.draft.content.cards[card.id] as Card), description: 'Stop all ledger changes.' })
    finished = putContent(finished, 'stakeholders', { ...(finished.content.stakeholders[connected.member.id] as Stakeholder), description: 'Keeps the money moving.' })
    finished = releaseDraft(updateDraftDetails(finished, { authors: [{ name: 'Ada' }] }), '1.0.0')
    expect(nextSteps(finished).every((step) => step.done)).toBe(true)
  })
})

describe('how much of a pack is the author\'s own', () => {
  it('counts the table, the deck, and what is the author\'s own', async () => {
    const card = createOwnCard(await copyOf(MONOLITH), 'Freeze the Ledger')
    expect(packCounts(card.draft)).toEqual({ scores: 6, own_scores: 0, seated: 4, own_members: 0, cards: 27, own_cards: 1, events: 11, own_events: 0 })
  })
})

describe('drafts that would export as the same pack', () => {
  it('names, for each draft, the others with its pack id, and nothing for a draft on its own', async () => {
    const a = await copyOf(MONOLITH, 'acme')
    const b = { ...(await copyOf(MONOLITH, 'acme')), name: 'Ours, again' }
    const c = await copyOf(MONOLITH, 'other')
    const shared = sharedPackIds([{ draft_id: '1', draft: a }, { draft_id: '2', draft: b }, { draft_id: '3', draft: c }])
    expect(shared.get('1')).toEqual(['Ours, again'])
    expect(shared.get('2')).toEqual(['Ours'])
    expect(shared.has('3')).toBe(false)
  })
})
