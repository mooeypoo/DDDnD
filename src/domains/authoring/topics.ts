/**
 * Teaching a different topic (docs/PACK_STUDIO.md §3, D1; M4.17): a pack with
 * its own scores, endings and classes instead of the base game's. It still
 * builds on the base game (an `extension`, like the SRE pack) and reuses the
 * game's five outcome tiers (the owner's call, 2026-11-26).
 *
 * A new topic starts as a small skeleton that the game's checks can already
 * mostly accept: one scenario, the game's tiers, a fallback ending, and one
 * class with no score bonus, so every table has someone to sit down as. The
 * author then names what the topic trades off (its scores), and the rest.
 */

import type { Card, OutcomeArchetype, PlayerClass, Scenario, Score, StakeholderChange, VersionRef } from '../content/model'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import { type ChangeHolder } from './connections'
import { addContent, createDraft, putContent, withEffects, type DraftPack } from './draft_pack'

/** The most scores one scenario can track (the game's limit). */
export const SCORES_PER_SCENARIO = CONTENT_LIMITS.counts.score_refs

/** A score's starting value until the author sets one: the middle of the game's 0–100. */
export const DEFAULT_START = 50

export const TOPIC_PLACEHOLDERS = { score: 'New score' } as const

/** The skeleton's ending and class: generic, so they read right in any topic, and meant to be rewritten. */
export const TOPIC_STARTERS = {
  ending: {
    name: 'Held It Together',
    description: 'You kept things going without a move that defined the run.',
  },
  playerClass: {
    name: 'Generalist',
    description: 'Ready for anything, with no favourite.',
  },
} as const

/**
 * A new-topic draft: its scenario (named after the topic), the game's outcome
 * tiers (`tierRefs`, from the base pack), a fallback ending (no conditions,
 * so every run has one, D: the game's ending rule), and a class with no
 * score bonus, which fits every scenario.
 */
export function draftForNewTopic(
  input: { name: string; description?: string; authors?: DraftPack['authors'] },
  tierRefs: readonly VersionRef[],
): { draft: DraftPack; scenarioId: string } {
  const name = input.name.trim() || 'Untitled topic'
  let draft = createDraft({ kind: 'new_topic', name, description: input.description?.trim() || `A DDDnD pack about ${name}.`, authors: input.authors })

  const ending = addContent(draft, 'outcome_archetypes', {
    ...TOPIC_STARTERS.ending,
    criteria: { priority: 0, when: [] },
  } as Omit<OutcomeArchetype, 'id' | 'version'>)
  draft = ending.draft
  const playerClass = addContent(draft, 'classes', { ...TOPIC_STARTERS.playerClass } as Omit<PlayerClass, 'id' | 'version'>)
  draft = playerClass.draft

  const scenario = addContent(draft, 'scenarios', {
    name,
    description: '',
    max_turns: 10,
    starting_scores: {},
    score_refs: [],
    stakeholder_refs: [],
    card_refs: [],
    event_refs: [],
    outcome_tier_refs: tierRefs.map((ref) => ({ id: ref.id, version: ref.version })),
    outcome_archetype_refs: [{ id: ending.id, version: 1 }],
  } as Omit<Scenario, 'id' | 'version'>)
  return { draft: scenario.draft, scenarioId: scenario.id }
}

/** A score's short name for the play screen's tight spots: the name when short, else its first word. */
export function shortNameFor(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length <= 14) return trimmed
  return trimmed.split(/\s+/)[0].slice(0, CONTENT_LIMITS.text.short_name)
}

/** How many scores the draft's scenarios track, at most (each can track up to 12). */
function trackedScores(draft: DraftPack): number {
  return Math.max(0, ...Object.values(draft.content.scenarios).map((scenario) => scenario.score_refs.length))
}

/**
 * A new score of the draft's own, tracked by every scenario and starting at
 * `start`. Null when a scenario already tracks as many as the game allows.
 * Higher is better: the game's rules read every score that way (M3 decision).
 */
export function createOwnScore(draft: DraftPack, name: string = TOPIC_PLACEHOLDERS.score, start = DEFAULT_START): { draft: DraftPack; id: string } | null {
  if (trackedScores(draft) >= SCORES_PER_SCENARIO) return null
  const trimmed = name.trim() || TOPIC_PLACEHOLDERS.score
  const added = addContent(draft, 'scores', { name: trimmed, short_name: shortNameFor(trimmed), description: '', default_value: start } as Omit<Score, 'id' | 'version'>)
  let next = added.draft
  for (const scenario of Object.values(next.content.scenarios)) {
    next = putContent(next, 'scenarios', {
      ...scenario,
      score_refs: [...scenario.score_refs, { id: added.id, version: 1 }],
      starting_scores: { ...scenario.starting_scores, [added.id]: start },
    })
  }
  return { draft: next, id: added.id }
}

/**
 * "+ “Rest” as a new score", from inside a card, event, aftershock or
 * reaction (D30): the score is made and tracked, and the item changes it.
 * Null with no name, or when no scenario can track another score.
 */
export function connectNewScore(draft: DraftPack, section: ChangeHolder, itemId: string, name: string): { draft: DraftPack; score: string } | null {
  if (!name.trim()) return null
  const made = createOwnScore(draft, name)
  if (!made) return null
  const item = made.draft.content[section][itemId] as (Card & { stakeholder_changes?: StakeholderChange[] }) | undefined
  if (!item) return { draft: made.draft, score: made.id }
  const withChange = withEffects(item, { score_changes: [...item.score_changes, { score_id: made.id, delta: 1 }], stakeholder_changes: item.stakeholder_changes ?? [] })
  return { draft: putContent(made.draft, section, withChange as never), score: made.id }
}

/** Where each of the draft's own items changes a score, by section and id: what deleting the score takes with it. */
export function ownChangesToScore(draft: DraftPack, scoreId: string): Array<{ section: ChangeHolder; id: string; name: string }> {
  const sections: ChangeHolder[] = ['cards', 'events', 'delayed_effects', 'stakeholder_reaction_rules']
  return sections.flatMap((section) => (Object.values(draft.content[section]) as Array<{ id: string; name: string; score_changes: Array<{ score_id: string }> }>)
    .filter((item) => item.score_changes.some((change) => change.score_id === scoreId))
    .map((item) => ({ section, id: item.id, name: item.name })))
}

/**
 * Deletes one of the draft's own scores: no scenario tracks it, and the
 * draft's own cards, events, aftershocks and reactions stop changing it. A
 * condition that still checks it (an event's, a reaction's, an ending's) is
 * left for the game's checks to point at, since only the author knows what
 * should take its place.
 */
export function removeOwnScore(draft: DraftPack, scoreId: string): DraftPack {
  if (!draft.content.scores[scoreId]) return draft
  let next = draft
  for (const scenario of Object.values(next.content.scenarios)) {
    const { [scoreId]: _dropped, ...starting } = scenario.starting_scores
    next = putContent(next, 'scenarios', { ...scenario, score_refs: scenario.score_refs.filter((ref) => ref.id !== scoreId), starting_scores: starting })
  }
  for (const { section, id } of ownChangesToScore(next, scoreId)) {
    const item = next.content[section][id] as Card & { stakeholder_changes?: StakeholderChange[] }
    next = putContent(next, section, withEffects(item, { score_changes: item.score_changes.filter((change) => change.score_id !== scoreId), stakeholder_changes: item.stakeholder_changes ?? [] }) as never)
  }
  const { [scoreId]: _score, ...scores } = next.content.scores
  return { ...next, content: { ...next.content, scores } }
}

/**
 * Whether the author can add a score of their own: a topic can, until a
 * scenario tracks as many as the game allows. A retelling uses the game's
 * scores (§3: it can grow into a topic later, but not from a picker).
 */
export function canAddScore(draft: DraftPack): boolean {
  return draft.kind === 'new_topic' && trackedScores(draft) < SCORES_PER_SCENARIO
}

/**
 * A score renamed: its short name follows while it's still the one the
 * Studio made from the old name, and stays once the author has written
 * their own.
 */
export function withScoreName(score: Score, name: string): Score {
  const followed = score.short_name === shortNameFor(score.name) || score.short_name === TOPIC_PLACEHOLDERS.score
  return { ...score, name, short_name: followed ? shortNameFor(name) : score.short_name }
}

/**
 * Whether a pack can use the game's own cards, events and council members.
 * A retelling does. A topic doesn't: the game's content changes and checks
 * the game's scores, which a topic doesn't track, so it would only fail the
 * checks (the SRE pack defines all of its own).
 */
export function usesGameContent(draft: DraftPack): boolean {
  return draft.kind === 'retelling'
}
