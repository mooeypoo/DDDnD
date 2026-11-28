/**
 * The guided round (docs/PACK_STUDIO.md §5, D2, D9, D20): a first pack built
 * step by step, about the author's own organization, with the same editors
 * as the workspace. This is what the round asks of each step and how far the
 * draft has come, read from the draft itself; the screens only show it.
 *
 * The round never blocks: "Next" always moves on, like the summary's steps.
 * A step's tick says whether the draft has what the step asks for.
 */

import type { VersionRef } from '../content/model'
import { isOwnMember } from './council'
import { isOwn, onlyHelps } from './deck'
import type { DraftPack, Effects } from './draft_pack'
import { scenarioRefs } from './draft_reading'
import { ENDING_PLACEHOLDER, endingsInOrder, isFallback } from './endings'
import { PLAY_RULE_PLACEHOLDERS } from './play_rules'
import { TOPIC_PLACEHOLDERS, TOPIC_STARTERS } from './topics'

/** The retelling round's steps, in order (§5). */
export const RETELLING_ROUND = ['world', 'scenario', 'council', 'cards', 'surprises', 'deck', 'check', 'play'] as const

/**
 * The new-topic round's steps (§5): the retelling's, with what a topic must
 * make for itself (what it trades off, its endings, a class), and without
 * filling the deck from the game's (a topic uses none of it, D33). Scores
 * come before the scenario, which sets where they start.
 */
export const TOPIC_ROUND = ['world', 'scores', 'scenario', 'council', 'cards', 'surprises', 'endings', 'class', 'check', 'play'] as const

export type RoundStep = (typeof RETELLING_ROUND)[number] | (typeof TOPIC_ROUND)[number]

/** The draft's round: a topic's is longer. */
export function roundSteps(draft: Pick<DraftPack, 'kind'>): readonly RoundStep[] {
  return draft.kind === 'new_topic' ? TOPIC_ROUND : RETELLING_ROUND
}

/**
 * The topic round is "longer, in two sittings" (§5): the first makes the
 * world (what it trades off, where it starts, who's at the table), the
 * second what happens in it. The step the second sitting starts at; a
 * retelling's round is one sitting.
 */
export function secondSitting(draft: Pick<DraftPack, 'kind'>): RoundStep | null {
  return draft.kind === 'new_topic' ? 'cards' : null
}

/**
 * What the round asks for: two of the author's own people, three of their
 * own moves; in a topic, three scores to trade between (§5 says three to
 * six), two endings besides the one every run reaches, and a class.
 */
export const ROUND_ASKS = { council: 2, cards: 3, scores: 3, endings: 2 } as const

/** What the game's checks last said, which the round's "Check it" step is about (the Studio runs them). */
export interface RoundChecks {
  clean: boolean
}

/** Where the author is in the round. The Studio's own memory, kept with the draft and never exported. */
export interface RoundState {
  step: RoundStep
  /** Steps the author has moved on from. */
  passed: RoundStep[]
}

export function startRound(draft: DraftPack): DraftPack {
  return { ...draft, round: { step: 'world', passed: [] } }
}

/** True while the draft is in a round the author can come back to. */
export function inRound(draft: DraftPack): boolean {
  return draft.round !== undefined
}

/** Where a draft is in its round, as "step 5 of 10"; null when it isn't in one. */
export function roundPlace(draft: DraftPack): { step: number; of: number } | null {
  if (!draft.round) return null
  const steps = roundSteps(draft)
  return { step: steps.indexOf(draft.round.step) + 1, of: steps.length }
}

/** Open a step (any order works), of this draft's round. */
export function goToRoundStep(draft: DraftPack, step: RoundStep): DraftPack {
  if (!draft.round || !roundSteps(draft).includes(step)) return draft
  return { ...draft, round: { ...draft.round, step } }
}

/** "Next": the current step counts as passed, and the next one opens. On the last step, nothing changes. */
export function nextRoundStep(draft: DraftPack): DraftPack {
  if (!draft.round) return draft
  const steps = roundSteps(draft)
  const index = steps.indexOf(draft.round.step)
  const passed = draft.round.passed.includes(draft.round.step) ? draft.round.passed : [...draft.round.passed, draft.round.step]
  return { ...draft, round: { step: steps[Math.min(index + 1, steps.length - 1)], passed } }
}

export function previousRoundStep(draft: DraftPack): DraftPack {
  if (!draft.round) return draft
  const steps = roundSteps(draft)
  const index = steps.indexOf(draft.round.step)
  return { ...draft, round: { ...draft.round, step: steps[Math.max(index - 1, 0)] } }
}

/** The round is over: the draft is an ordinary draft again, with everything made in it. */
export function finishRound(draft: DraftPack): DraftPack {
  const { round: _round, ...rest } = draft
  return rest
}

// ── What each step holds ──────────────────────────────────────────────────

/** How a card's changes lean: the round's one rule is that every move trades something away. */
export type CardVerdict = 'trades_off' | 'only_helps' | 'only_hurts' | 'no_changes'

export function cardVerdict(effects: Effects): CardVerdict {
  const deltas = [...effects.score_changes, ...(effects.stakeholder_changes ?? [])].map((change) => change.delta).filter((delta) => delta !== 0)
  if (deltas.length === 0) return 'no_changes'
  if (onlyHelps(effects)) return 'only_helps'
  return deltas.every((delta) => delta < 0) ? 'only_hurts' : 'trades_off'
}

/** Which way a surprise goes: the round asks for one bad and one good. A mixed one is neither. */
export type EventLeaning = 'bad' | 'good' | 'mixed' | 'no_changes'

export function eventLeaning(effects: Effects): EventLeaning {
  const deltas = [...effects.score_changes, ...(effects.stakeholder_changes ?? [])].map((change) => change.delta).filter((delta) => delta !== 0)
  if (deltas.length === 0) return 'no_changes'
  if (deltas.every((delta) => delta > 0)) return 'good'
  if (deltas.every((delta) => delta < 0)) return 'bad'
  return 'mixed'
}

/** The author's own council members, seated, with how many reactions each has. */
export function roundCouncil(draft: DraftPack): Array<{ ref: VersionRef; name: string; reactions: number }> {
  return scenarioRefs(draft, 'stakeholder_refs').filter((ref) => isOwnMember(draft, ref)).map((ref) => {
    const member = draft.content.stakeholders[ref.id]
    return { ref, name: member.name, reactions: member.reaction_rule_refs?.length ?? 0 }
  })
}

/** The author's own cards in the deck, each with its verdict. */
export function roundCards(draft: DraftPack): Array<{ ref: VersionRef; name: string; verdict: CardVerdict }> {
  return scenarioRefs(draft, 'card_refs').filter((ref) => isOwn(draft, 'cards', ref)).map((ref) => {
    const card = draft.content.cards[ref.id]
    return { ref, name: card.name, verdict: cardVerdict(card) }
  })
}

/** The author's own events in the deck, each with which way it goes. */
export function roundSurprises(draft: DraftPack): Array<{ ref: VersionRef; name: string; leaning: EventLeaning }> {
  return scenarioRefs(draft, 'event_refs').filter((ref) => isOwn(draft, 'events', ref)).map((ref) => {
    const event = draft.content.events[ref.id]
    return { ref, name: event.name, leaning: eventLeaning(event) }
  })
}

/** How a score is pulled by the author's cards: the round's rule for scores is that they trade off. */
export type ScorePull = 'both_ways' | 'only_up' | 'only_down' | 'untouched'

/**
 * The topic's scores, each with how the author's cards move it. A score no
 * card lowers is one the best plan raises every turn, and then one strategy
 * wins (§5, "Scores should trade off").
 */
export function roundScores(draft: DraftPack): Array<{ ref: VersionRef; name: string; raised_by: number; lowered_by: number; pull: ScorePull }> {
  const cards = scenarioRefs(draft, 'card_refs').filter((ref) => isOwn(draft, 'cards', ref)).map((ref) => draft.content.cards[ref.id])
  return scenarioRefs(draft, 'score_refs').filter((ref) => draft.content.scores[ref.id]).map((ref) => {
    const deltas = cards.map((card) => card.score_changes.filter((change) => change.score_id === ref.id).reduce((sum, change) => sum + change.delta, 0))
    const raised_by = deltas.filter((delta) => delta > 0).length
    const lowered_by = deltas.filter((delta) => delta < 0).length
    const pull: ScorePull = raised_by && lowered_by ? 'both_ways' : raised_by ? 'only_up' : lowered_by ? 'only_down' : 'untouched'
    return { ref, name: draft.content.scores[ref.id].name, raised_by, lowered_by, pull }
  })
}

/** A name the author gave it: not blank, and not the one the Studio started it with. */
function named(name: string, placeholder: string): boolean {
  return name.trim() !== '' && name.trim() !== placeholder
}

/** The topic's endings, in the order the game tries them, each saying whether it's the one every run reaches. */
export function roundEndings(draft: DraftPack): Array<{ ref: VersionRef; name: string; fallback: boolean }> {
  return endingsInOrder(draft).map((ending) => ({ ref: { id: ending.id, version: ending.version }, name: ending.name, fallback: isFallback(ending) }))
}

/**
 * The topic's classes, each with its favourite score (a class with none
 * plays as anyone) and whether the author has named it: the skeleton's
 * "Generalist" is a stand-in, and a Generalist with a favourite isn't one.
 */
export function roundClasses(draft: DraftPack): Array<{ id: string; name: string; favourite: string | null; named: boolean }> {
  const tracked = new Set(scenarioRefs(draft, 'score_refs').map((ref) => ref.id))
  return Object.values(draft.content.classes).map((playerClass) => ({
    id: playerClass.id,
    name: playerClass.name,
    favourite: playerClass.score_affinity && tracked.has(playerClass.score_affinity) ? playerClass.score_affinity : null,
    named: named(playerClass.name, PLAY_RULE_PLACEHOLDERS.playerClass) && playerClass.name.trim() !== TOPIC_STARTERS.playerClass.name,
  }))
}

/**
 * Whether the draft has what a step asks for. The steps that ask for
 * something countable tick when it's there; the others tick once the author
 * has moved on from them (a copied scenario already plays, so there's
 * nothing they must change).
 */
export function roundStepDone(draft: DraftPack, step: RoundStep, checks: RoundChecks = { clean: false }): boolean {
  const passed = draft.round?.passed.includes(step) ?? false
  switch (step) {
    case 'world':
      return passed && draft.name.trim() !== '' && draft.description.trim() !== '' && draft.authors.some((author) => author.name.trim() !== '')
    case 'check':
      return passed && checks.clean
    case 'council': {
      const council = roundCouncil(draft)
      return council.length >= ROUND_ASKS.council && council.every((member) => member.reactions > 0)
    }
    case 'cards':
      return roundCards(draft).length >= ROUND_ASKS.cards
    case 'surprises': {
      const leanings = roundSurprises(draft).map((event) => event.leaning)
      return leanings.includes('bad') && leanings.includes('good')
    }
    case 'scores':
      return roundScores(draft).filter((score) => named(score.name, TOPIC_PLACEHOLDERS.score)).length >= ROUND_ASKS.scores
    case 'endings':
      return roundEndings(draft).filter((ending) => !ending.fallback && named(ending.name, ENDING_PLACEHOLDER)).length >= ROUND_ASKS.endings
    case 'class':
      return roundClasses(draft).some((playerClass) => playerClass.favourite !== null && playerClass.named)
    default:
      return passed
  }
}

export function roundProgress(draft: DraftPack, checks: RoundChecks = { clean: false }): Array<{ step: RoundStep; done: boolean; current: boolean }> {
  return roundSteps(draft).map((step) => ({ step, done: roundStepDone(draft, step, checks), current: draft.round?.step === step }))
}
