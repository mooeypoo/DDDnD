/**
 * Aftershocks: what a card or event does some turns later (docs/PACK_STUDIO.md M4.6).
 *
 * The content model calls them delayed effects. A card or event refers to
 * them by `{ id, version }`, and the game's are shared: "Refactoring Payoff"
 * follows nine of the game's cards. So, as with cards (D7), the game's
 * aftershocks aren't edited in place. On one of the draft's own cards, an
 * author can make their own version of one (only that card switches to it),
 * take one off, attach another of the game's, or write a new one.
 */

import type { DelayedEffect, VersionRef } from '../content/model'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import type { DeckSection } from './deck'
import { addContent, putContent, removeContent, type DraftPack, type Effects } from './draft_pack'
import { isOwnRef } from './draft_reading'
import { settlePlaceholderId } from './placeholder_ids'

/** The most aftershocks one card or event can have (the game's limit). */
export const AFTERSHOCKS_PER_ITEM = CONTENT_LIMITS.counts.delayed_effect_refs

/** The name a new aftershock starts with, before the author names it. */
export const AFTERSHOCK_PLACEHOLDER = 'New aftershock'

const sameRef = (a: VersionRef, b: VersionRef) => a.id === b.id && a.version === b.version

function ownItem(draft: DraftPack, section: DeckSection, itemId: string) {
  const item = draft.content[section][itemId]
  if (!item) throw new Error(`Not the draft's own ${section === 'cards' ? 'card' : 'event'}: ${itemId}`)
  return item
}

function setRefs(draft: DraftPack, section: DeckSection, itemId: string, refs: VersionRef[]): DraftPack {
  return putContent(draft, section, { ...ownItem(draft, section, itemId), delayed_effect_refs: refs } as never)
}

/** The draft's own cards and events that have this aftershock. */
export function aftershockUsers(draft: DraftPack, ref: VersionRef): Array<{ section: DeckSection; id: string; name: string }> {
  return (['cards', 'events'] as const).flatMap((section) =>
    Object.values(draft.content[section] as Record<string, { id: string; name: string; delayed_effect_refs: VersionRef[] }>)
      .filter((item) => item.delayed_effect_refs.some((existing) => sameRef(existing, ref)))
      .map((item) => ({ section, id: item.id, name: item.name })))
}

/** A new aftershock of the draft's own on one of its cards or events: two turns later, changing nothing yet. */
export function addNewAftershock(draft: DraftPack, section: DeckSection, itemId: string): { draft: DraftPack; id: string } {
  const item = ownItem(draft, section, itemId)
  const added = addContent(draft, 'delayed_effects', {
    name: AFTERSHOCK_PLACEHOLDER,
    description: '',
    turns_until_resolution: 2,
    score_changes: [],
  })
  return { draft: setRefs(added.draft, section, itemId, [...item.delayed_effect_refs, { id: added.id, version: 1 }]), id: added.id }
}

/** Puts an existing aftershock (the game's, or another of the draft's own) on a card or event, once. */
export function attachAftershock(draft: DraftPack, section: DeckSection, itemId: string, ref: VersionRef): DraftPack {
  const item = ownItem(draft, section, itemId)
  if (item.delayed_effect_refs.some((existing) => sameRef(existing, ref))) return draft
  return setRefs(draft, section, itemId, [...item.delayed_effect_refs, { id: ref.id, version: ref.version }])
}

/**
 * Takes an aftershock off a card or event. One of the draft's own that
 * nothing else uses any more is deleted with it; the game's stay the game's.
 */
export function detachAftershock(draft: DraftPack, section: DeckSection, itemId: string, ref: VersionRef): DraftPack {
  const item = ownItem(draft, section, itemId)
  const next = setRefs(draft, section, itemId, item.delayed_effect_refs.filter((existing) => !sameRef(existing, ref)))
  return isOwnRef(next, 'delayed_effects', ref) && aftershockUsers(next, ref).length === 0
    ? removeContent(next, 'delayed_effects', ref.id)
    : next
}

/**
 * "Make my own version" of one of the game's aftershocks, for one card or
 * event: a copy under a new id, which only that card switches to. The
 * game's other cards keep the original.
 */
export function copyAftershockToEdit(
  draft: DraftPack,
  section: DeckSection,
  itemId: string,
  original: DelayedEffect,
): { draft: DraftPack; id: string } {
  const item = ownItem(draft, section, itemId)
  const { id: _id, version: _version, ...fields } = JSON.parse(JSON.stringify(original)) as DelayedEffect
  const added = addContent(draft, 'delayed_effects', fields)
  const copy = { id: added.id, version: 1 }
  const refs = item.delayed_effect_refs.map((ref) => (sameRef(ref, original) ? copy : ref))
  return { draft: setRefs(added.draft, section, itemId, refs), id: added.id }
}

/** Gives a new aftershock the id of its name, once named. The cards and events that have it follow. */
export function settleNewAftershockId(draft: DraftPack, id: string): { draft: DraftPack; id: string } {
  return settlePlaceholderId(draft, 'delayed_effects', id, AFTERSHOCK_PLACEHOLDER, (moved, oldId, newId) => {
    let next = moved
    for (const user of aftershockUsers(moved, { id: oldId, version: 1 })) {
      const item = next.content[user.section][user.id]
      next = putContent(next, user.section, {
        ...item,
        delayed_effect_refs: item.delayed_effect_refs.map((ref) => (ref.id === oldId && ref.version === 1 ? { id: newId, version: 1 } : ref)),
      } as never)
    }
    return next
  })
}

/** The sum of score changes over something and its aftershocks: what the game's balance numbers count. */
export function netWithAftershocks(effects: Effects, aftershocks: readonly Effects[]): number {
  return [effects, ...aftershocks].reduce((total, part) => total + part.score_changes.reduce((sum, change) => sum + change.delta, 0), 0)
}
