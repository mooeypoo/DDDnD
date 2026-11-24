/**
 * The deck: a draft's cards and events (docs/PACK_STUDIO.md §4.1, §5).
 *
 * A retelling has one scenario, but a draft may hold several, so deck
 * changes apply to every scenario in the draft. A card or event is either
 * the draft's own (editable) or the game's (referenced; "make my own
 * version" copies it, D7).
 */

import type { Card, Event, NumericCondition, VersionRef } from '../content/model'
import { conditionText } from './conditions'
import { addContent, putContent, removeContent, type DraftPack, type Effects } from './draft_pack'
import { isOwnRef } from './draft_reading'
import { hasPlaceholderIdFor, settlePlaceholderId } from './placeholder_ids'

export type DeckSection = 'cards' | 'events'
const REF_FIELD = { cards: 'card_refs', events: 'event_refs' } as const

function sameRef(a: VersionRef, b: VersionRef): boolean {
  return a.id === b.id && a.version === b.version
}

/** Puts a card or event in every scenario's deck (once). */
export function addToDeck(draft: DraftPack, section: DeckSection, ref: VersionRef): DraftPack {
  const field = REF_FIELD[section]
  let next = draft
  for (const scenario of Object.values(draft.content.scenarios)) {
    if (scenario[field].some((existing) => sameRef(existing, ref))) continue
    next = putContent(next, 'scenarios', { ...scenario, [field]: [...scenario[field], { id: ref.id, version: ref.version }] })
  }
  return next
}

/**
 * Takes a card or event out of every scenario's deck. When it's the draft's
 * own and nothing refers to it any more, it's deleted too; the game's own
 * content is only unreferenced.
 */
export function removeFromDeck(draft: DraftPack, section: DeckSection, ref: VersionRef): DraftPack {
  const field = REF_FIELD[section]
  let next = draft
  for (const scenario of Object.values(draft.content.scenarios)) {
    if (!scenario[field].some((existing) => sameRef(existing, ref))) continue
    next = putContent(next, 'scenarios', { ...scenario, [field]: scenario[field].filter((existing) => !sameRef(existing, ref)) })
  }
  return isOwn(next, section, ref) ? removeContent(next, section, ref.id) : next
}

/** True when the card or event is the draft's own (editable), not the game's. */
export function isOwn(draft: DraftPack, section: DeckSection, ref: VersionRef): boolean {
  return isOwnRef(draft, section, ref)
}

/** A new card of the draft's own, already in the deck. The author fills it in. */
export function createOwnCard(draft: DraftPack, name: string): { draft: DraftPack; id: string } {
  const fields: Omit<Card, 'id' | 'version'> = { name, description: '', score_changes: [], delayed_effect_refs: [] }
  const added = addContent(draft, 'cards', fields)
  return { draft: addToDeck(added.draft, 'cards', { id: added.id, version: 1 }), id: added.id }
}

/** A new event of the draft's own, already in the deck, with a middling weight. */
export function createOwnEvent(draft: DraftPack, name: string): { draft: DraftPack; id: string } {
  const fields: Omit<Event, 'id' | 'version'> = { name, description: '', score_changes: [], delayed_effect_refs: [], occurrence_weight: 3 }
  const added = addContent(draft, 'events', fields)
  return { draft: addToDeck(added.draft, 'events', { id: added.id, version: 1 }), id: added.id }
}

/** Names new cards and events start with, before the author names them. */
export const PLACEHOLDER_NAMES = { cards: 'New card', events: 'New event' } as const

/** True while an item still has the id it got from its placeholder name. */
export function hasPlaceholderId(draft: DraftPack, section: DeckSection, id: string): boolean {
  return hasPlaceholderIdFor(draft, PLACEHOLDER_NAMES[section], id)
}

/**
 * Gives a new card or event the id its real name would give it, once the
 * author has named it (ids show in the pack's files, so `…_new_card` would
 * stick). Only while it still has its placeholder id: an id never changes
 * after that. The deck follows it. Returns the (possibly unchanged) id.
 */
export function settleNewItemId(draft: DraftPack, section: DeckSection, id: string): { draft: DraftPack; id: string } {
  const field = REF_FIELD[section]
  return settlePlaceholderId(draft, section, id, PLACEHOLDER_NAMES[section], (moved, oldId, newId) => {
    let next = moved
    for (const scenario of Object.values(next.content.scenarios)) {
      if (!scenario[field].some((ref) => ref.id === oldId)) continue
      next = putContent(next, 'scenarios', {
        ...scenario,
        [field]: scenario[field].map((ref) => (ref.id === oldId ? { id: newId, version: ref.version } : ref)),
      })
    }
    return next
  })
}


/** The sum of a card's or event's immediate score changes (aftershocks not included). */
export function netScoreChange(effects: Effects): number {
  return effects.score_changes.reduce((total, change) => total + change.delta, 0)
}

/**
 * True when a card only helps: something goes up and nothing goes down.
 * The guided round's one rule (§5): every move trades something away.
 */
export function onlyHelps(effects: Effects): boolean {
  const deltas = [...effects.score_changes, ...(effects.stakeholder_changes ?? [])].map((change) => change.delta)
  return deltas.some((delta) => delta > 0) && deltas.every((delta) => delta >= 0)
}

function joinWords(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/**
 * The effects in plain words (§4.1): "raises Rest by 8 and Sight by 2; lowers
 * Uptime by 1; makes the On-Call Engineer happier (+4)". Names come from the
 * caller; an unknown id is shown as is.
 */
export function describeEffects(
  effects: Effects,
  names: { scores: Record<string, string>; stakeholders: Record<string, string> },
): string {
  const scoreName = (id: string) => names.scores[id] ?? id
  const ups = effects.score_changes.filter((change) => change.delta > 0).map((change) => `${scoreName(change.score_id)} by ${change.delta}`)
  const downs = effects.score_changes.filter((change) => change.delta < 0).map((change) => `${scoreName(change.score_id)} by ${-change.delta}`)
  const people = (effects.stakeholder_changes ?? []).filter((change) => change.delta !== 0).map((change) => {
    const who = names.stakeholders[change.stakeholder_id] ?? change.stakeholder_id
    return change.delta > 0 ? `makes ${who} happier (+${change.delta})` : `makes ${who} unhappier (${change.delta})`
  })
  const clauses = [
    ...(ups.length ? [`raises ${joinWords(ups)}`] : []),
    ...(downs.length ? [`lowers ${joinWords(downs)}`] : []),
    ...people,
  ]
  // Clauses are separated by semicolons, so lists inside them can use "and"
  return clauses.length ? clauses.join('; ') : 'changes nothing yet'
}

/**
 * Sets when one of the draft's own events can happen: only while a condition
 * holds, or (null) any turn. The words beside it are written from the
 * condition, so they always agree with it; the game requires the condition
 * whenever there are words.
 */
export function setEventCondition(draft: DraftPack, eventId: string, condition: NumericCondition | null, targetName: string): DraftPack {
  const event = draft.content.events[eventId]
  if (!event) return draft
  const next: Event = { ...event }
  if (condition) {
    next.trigger_condition = { ...condition }
    next.trigger_condition_description = conditionText(condition, targetName)
  } else {
    delete next.trigger_condition
    delete next.trigger_condition_description
  }
  return putContent(draft, 'events', next)
}
