/**
 * A pack at a glance (the UI/UX audit, slice 4): where it stands as a
 * release, what to do next, and which drafts would collide when exported.
 * The summary view and the start screen show these; the rules live here.
 */

import { toFillIn } from './connections'
import { endingsInOrder, isFallback } from './endings'
import { isOwnMember } from './council'
import { isOwn } from './deck'
import { draftPackId } from './draft_export'
import { updateDraftDetails, type DraftKind, type DraftPack } from './draft_pack'
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

/**
 * The pack's id changed since its last export (M4.23): the prefix is the
 * pack's id, and to players a different id is a different pack. Their copy
 * of the old one stays, and the new one sits beside it instead of updating
 * it. Null when it hasn't changed, or when the export predates the record.
 */
export function packIdChange(draft: DraftPack): { released: string; next: string } | null {
  const released = draft.released?.pack_id
  if (!released) return null
  const next = draftPackId(draft)
  return next === released ? null : { released, next }
}

/** "Change it back": the pack exports under the id it last went out under. New content keeps the ids it has. */
export function keepReleasedPackId(draft: DraftPack): DraftPack {
  const change = packIdChange(draft)
  return change ? updateDraftDetails(draft, { prefix: change.released }) : draft
}

/** The warning, in words. */
export function describePackIdChange(change: { released: string; next: string }, version: string): string {
  return `You exported version ${version} as “${change.released}”. It now exports as “${change.next}”, which players' games see as a different pack: it won't update their copy of “${change.released}”, it will sit beside it. Change it back to keep one pack.`
}

/** The steps from a started pack to one players can import, in order. */
export type NextStep = 'name_scores' | 'write_endings' | 'fill_deck' | 'write_a_card' | 'bring_your_people' | 'fill_in' | 'add_author' | 'export'

/**
 * How a pack began, which decides what's already true of it: a copy of the
 * game's scenario already plays; a retelling from scratch has the game's
 * scores and endings and nothing else; an import plays as it was exported;
 * a new subject starts as a skeleton (M4.28: the summary called all
 * retellings copies).
 */
export type PackStart = 'copied' | 'from_scratch' | 'imported' | 'topic'

export function packStart(draft: DraftPack): PackStart {
  if (draft.kind === 'new_topic') return 'topic'
  if (draft.from_scratch) return 'from_scratch'
  if (draft.released?.imported) return 'imported'
  return 'copied'
}

/** A topic's scores should trade off: three to six of them (§5). Done from three. */
export const TOPIC_SCORES_ENOUGH = 3

/**
 * Where to go next, from what the draft already holds. Every step can be done
 * in any order; the list only says which are done. A copied scenario already
 * plays, so none of them blocks playing it.
 */
export function nextSteps(draft: DraftPack): Array<{ step: NextStep; done: boolean }> {
  const own = (section: 'cards' | 'events', field: 'card_refs' | 'event_refs') => scenarioRefs(draft, field).filter((ref) => isOwn(draft, section, ref)).length
  const release = releaseState(draft)
  // A new topic starts with what it trades off: its own scores
  const topic: Array<{ step: NextStep; done: boolean }> = draft.kind === 'new_topic'
    ? [{ step: 'name_scores', done: Object.keys(draft.content.scores).length >= TOPIC_SCORES_ENOUGH }]
    : []
  // …and what kind of leader a player can become: at least one ending besides the fallback
  const endings: Array<{ step: NextStep; done: boolean }> = draft.kind === 'new_topic'
    ? [{ step: 'write_endings', done: endingsInOrder(draft).some((ending) => !isFallback(ending)) }]
    : []
  // A retelling from scratch has an empty deck: the game's cards and events, or the author's own, fill it
  const deck: Array<{ step: NextStep; done: boolean }> = packStart(draft) === 'from_scratch'
    ? [{ step: 'fill_deck', done: scenarioRefs(draft, 'card_refs').length > 0 && scenarioRefs(draft, 'event_refs').length > 0 }]
    : []
  return [
    ...topic,
    ...deck,
    { step: 'write_a_card', done: own('cards', 'card_refs') + own('events', 'event_refs') > 0 },
    ...endings,
    { step: 'bring_your_people', done: scenarioRefs(draft, 'stakeholder_refs').some((ref) => isOwnMember(draft, ref)) },
    { step: 'fill_in', done: toFillIn(draft).length === 0 },
    { step: 'add_author', done: draft.authors.some((author) => author.name.trim() !== '') },
    { step: 'export', done: release.state === 'unchanged' },
  ]
}

/** How much of a pack is the author's own, and how big it is. */
export function packCounts(draft: DraftPack): {
  scores: number
  own_scores: number
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
  const scores = scenarioRefs(draft, 'score_refs')
  return {
    scores: scores.length,
    own_scores: scores.filter((ref) => draft.content.scores[ref.id]).length,
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

// ── The two kinds, and what's the author's own, in words ──────────────────

/**
 * The two kinds of pack, by one name each everywhere the Studio shows them
 * (the first-screen audit, M4.27): four names for two things made people
 * think there were four.
 */
export const KIND_NAMES: Record<DraftKind, string> = {
  retelling: 'DDD retelling',
  new_topic: 'New subject',
}

/** Each kind in a line: what it keeps from the game, and what's the author's. */
export const KIND_SUMMARIES: Record<DraftKind, string> = {
  retelling: 'The game\'s scores and endings, with your scenario, your people and your moves.',
  new_topic: 'Your own scores, council, cards and endings, about another subject.',
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/**
 * How much of a pack is the author's own, in a sentence. A retelling with
 * nothing of its own is the game's scenario as it is (or, from scratch,
 * nothing at all yet); a new subject is all
 * its own, so it counts its scores and endings too (the start screen said a
 * new subject was "the game's scenario as it is", M4.27).
 */
export function describeOwnContent(draft: DraftPack): string {
  const counts = packCounts(draft)
  const topic = draft.kind === 'new_topic'
  const endings = topic ? endingsInOrder(draft).filter((ending) => !isFallback(ending)).length : 0
  const parts = [
    topic && counts.own_scores > 0 && plural(counts.own_scores, 'score', 'scores'),
    counts.own_cards > 0 && plural(counts.own_cards, 'card', 'cards'),
    counts.own_events > 0 && plural(counts.own_events, 'event', 'events'),
    counts.own_members > 0 && plural(counts.own_members, 'member', 'members'),
    endings > 0 && plural(endings, 'ending', 'endings'),
  ].filter((part): part is string => typeof part === 'string')
  if (parts.length === 0) {
    if (topic) return 'Just started: name what it trades off first.'
    // A retelling from scratch (M4.28) has nothing of the game's in it either
    return counts.seated + counts.cards + counts.events === 0 ? 'Just started: seat a council and fill the deck.' : 'Nothing of your own yet: the game\'s scenario as it is.'
  }
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
  return topic ? `${list}.` : `${list} of your own.`
}
