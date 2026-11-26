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

/** The retelling round's steps, in order (§5). */
export const ROUND_STEPS = ['world', 'scenario', 'council', 'cards', 'surprises', 'deck', 'check', 'play'] as const
export type RoundStep = (typeof ROUND_STEPS)[number]

/** What the round asks for: two of the author's own people, three of their own moves. */
export const ROUND_ASKS = { council: 2, cards: 3 } as const

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

/** Open a step (any order works). */
export function goToRoundStep(draft: DraftPack, step: RoundStep): DraftPack {
  if (!draft.round) return draft
  return { ...draft, round: { ...draft.round, step } }
}

/** "Next": the current step counts as passed, and the next one opens. On the last step, nothing changes. */
export function nextRoundStep(draft: DraftPack): DraftPack {
  if (!draft.round) return draft
  const index = ROUND_STEPS.indexOf(draft.round.step)
  const passed = draft.round.passed.includes(draft.round.step) ? draft.round.passed : [...draft.round.passed, draft.round.step]
  return { ...draft, round: { step: ROUND_STEPS[Math.min(index + 1, ROUND_STEPS.length - 1)], passed } }
}

export function previousRoundStep(draft: DraftPack): DraftPack {
  if (!draft.round) return draft
  const index = ROUND_STEPS.indexOf(draft.round.step)
  return { ...draft, round: { ...draft.round, step: ROUND_STEPS[Math.max(index - 1, 0)] } }
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
    default:
      return passed
  }
}

export function roundProgress(draft: DraftPack, checks: RoundChecks = { clean: false }): Array<{ step: RoundStep; done: boolean; current: boolean }> {
  return ROUND_STEPS.map((step) => ({ step, done: roundStepDone(draft, step, checks), current: draft.round?.step === step }))
}
