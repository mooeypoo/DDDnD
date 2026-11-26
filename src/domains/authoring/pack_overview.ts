/**
 * A pack at a glance (the UI/UX audit, slice 4): where it stands as a
 * release, what to do next, and which drafts would collide when exported.
 * The summary view and the start screen show these; the rules live here.
 */

import { toFillIn } from './connections'
import { isOwnMember } from './council'
import { isOwn } from './deck'
import { draftPackId } from './draft_export'
import type { DraftPack } from './draft_pack'
import { scenarioRefs } from './draft_reading'
import { planRelease } from './releases'

/** Where a draft stands as a release (D24). */
export type ReleaseState =
  | { state: 'never' }
  | { state: 'unchanged' | 'changed'; version: string; /** The version is the imported pack's, not one exported here. */ imported: boolean }

/**
 * Never exported, unchanged since its last export, or changed since. An
 * imported pack counts its import as its last export (D26), so it starts
 * "unchanged" at its own version.
 */
export function releaseState(draft: DraftPack): ReleaseState {
  if (!draft.released) return { state: 'never' }
  const plan = planRelease(draft)
  return { state: plan.kind === 'unchanged' ? 'unchanged' : 'changed', version: draft.released.version, imported: draft.released.imported === true }
}

/** The steps from a copied scenario to a pack players can import, in order. */
export type NextStep = 'write_a_card' | 'bring_your_people' | 'fill_in' | 'add_author' | 'export'

/**
 * Where to go next, from what the draft already holds. Every step can be done
 * in any order; the list only says which are done. A copied scenario already
 * plays, so none of them blocks playing it.
 */
export function nextSteps(draft: DraftPack): Array<{ step: NextStep; done: boolean }> {
  const own = (section: 'cards' | 'events', field: 'card_refs' | 'event_refs') => scenarioRefs(draft, field).filter((ref) => isOwn(draft, section, ref)).length
  const release = releaseState(draft)
  return [
    { step: 'write_a_card', done: own('cards', 'card_refs') + own('events', 'event_refs') > 0 },
    { step: 'bring_your_people', done: scenarioRefs(draft, 'stakeholder_refs').some((ref) => isOwnMember(draft, ref)) },
    { step: 'fill_in', done: toFillIn(draft).length === 0 },
    { step: 'add_author', done: draft.authors.some((author) => author.name.trim() !== '') },
    { step: 'export', done: release.state === 'unchanged' },
  ]
}

/** How much of a pack is the author's own, and how big it is. */
export function packCounts(draft: DraftPack): {
  seated: number
  own_members: number
  cards: number
  own_cards: number
  events: number
  own_events: number
} {
  const cards = scenarioRefs(draft, 'card_refs')
  const events = scenarioRefs(draft, 'event_refs')
  const seated = scenarioRefs(draft, 'stakeholder_refs')
  return {
    seated: seated.length,
    own_members: seated.filter((ref) => isOwnMember(draft, ref)).length,
    cards: cards.length,
    own_cards: cards.filter((ref) => isOwn(draft, 'cards', ref)).length,
    events: events.length,
    own_events: events.filter((ref) => isOwn(draft, 'events', ref)).length,
  }
}

/**
 * Drafts that would export under the same pack id, by draft: for each, the
 * names of the others. Two packs with one id are one pack to the game's
 * bazaar and the packs repository, so exporting both would make one replace
 * the other. It happens when one pack is imported twice, or two drafts start
 * from the same scenario.
 */
export function sharedPackIds(drafts: ReadonlyArray<{ draft_id: string; draft: DraftPack }>): Map<string, string[]> {
  const byId = new Map<string, Array<{ draft_id: string; name: string }>>()
  for (const entry of drafts) {
    const id = draftPackId(entry.draft)
    byId.set(id, [...(byId.get(id) ?? []), { draft_id: entry.draft_id, name: entry.draft.name }])
  }
  const shared = new Map<string, string[]>()
  for (const group of byId.values()) {
    if (group.length < 2) continue
    for (const entry of group) shared.set(entry.draft_id, group.filter((other) => other.draft_id !== entry.draft_id).map((other) => other.name))
  }
  return shared
}
