/**
 * A topic's rules of play (M4.19, N3): who you can play as (classes), the
 * challenges you can choose (modifiers) and how one score drags others down
 * (coupling rules). The game's rules for each are in the simulation domain;
 * these are the Studio's operations and words for them.
 *
 * - A class's favourite score gets +1 every turn, where the scenario tracks
 *   it. Every table needs a class that fits it (the game's check), so a
 *   topic keeps at least one.
 * - A challenge changes where scores start, can set every council member's
 *   starting satisfaction, and can add or take away turns. It's offered only
 *   where every score it changes is tracked.
 * - A coupling rule: while one score is below a line, gains to others are
 *   multiplied down (losses aren't). Several stack.
 */

import type { ChallengeModifier, CouplingRule, PlayerClass } from '../content/model'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import { signedDelta } from './deck'
import { addContent, putContent, type DraftPack } from './draft_pack'
import { scenarioRefs } from './draft_reading'

export const PLAY_RULE_PLACEHOLDERS = { playerClass: 'New class', challenge: 'New challenge', coupling: 'New coupling rule' } as const

/** The most coupling rules one scenario can list (the game's limit). */
export const COUPLING_PER_SCENARIO = CONTENT_LIMITS.counts.coupling_rule_refs

type Names = { scores: Record<string, string> }

function listed(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? 'no score') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// ── Classes ────────────────────────────────────────────────────────────────

/** Whether a class fits every scenario's table: no favourite, or a favourite every scenario tracks. */
function classFitsAll(draft: DraftPack, playerClass: PlayerClass): boolean {
  if (!playerClass.score_affinity) return true
  return Object.values(draft.content.scenarios).every((scenario) => scenario.score_refs.some((ref) => ref.id === playerClass.score_affinity))
}

/** A new class of the draft's own, with no favourite score: it fits any table. */
export function createOwnClass(draft: DraftPack, name: string = PLAY_RULE_PLACEHOLDERS.playerClass): { draft: DraftPack; id: string } {
  return addContent(draft, 'classes', { name, description: '' } as Omit<PlayerClass, 'id' | 'version'>)
}

/** A class's favourite score, set (to one the scenarios track) or cleared (null). */
export function setClassFavourite(draft: DraftPack, id: string, scoreId: string | null): DraftPack {
  const playerClass = draft.content.classes[id]
  if (!playerClass) return draft
  const { score_affinity: _old, ...rest } = playerClass
  return putContent(draft, 'classes', scoreId ? { ...rest, score_affinity: scoreId } : rest)
}

/**
 * Whether a class can be deleted. A topic plays only its own classes, so
 * the last one that fits its tables stays: every table needs a class to
 * play as (the game's check).
 */
export function classDeletion(draft: DraftPack, id: string): { ok: true } | { ok: false; reason: string } {
  if (!draft.content.classes[id]) return { ok: false, reason: 'It isn\'t one of your classes.' }
  if (draft.kind !== 'new_topic') return { ok: true }
  const others = Object.values(draft.content.classes).filter((playerClass) => playerClass.id !== id && classFitsAll(draft, playerClass))
  return others.length > 0 ? { ok: true } : { ok: false, reason: 'Every table needs a class to play as. Make another class that fits first, or keep this one.' }
}

export function removeOwnClass(draft: DraftPack, id: string): DraftPack {
  if (!classDeletion(draft, id).ok) return draft
  const { [id]: _removed, ...classes } = draft.content.classes
  return { ...draft, content: { ...draft.content, classes } }
}

/** What a class does, in words: "+1 Rest every turn", or "no favourite score". */
export function describeClass(playerClass: Pick<PlayerClass, 'score_affinity'>, names: Names): string {
  return playerClass.score_affinity ? `${names.scores[playerClass.score_affinity] ?? GONE_SCORE} +1 every turn` : 'no favourite score: fits any table'
}

// ── Challenges (modifiers) ────────────────────────────────────────────────

/** A new challenge of the draft's own: the scenario's first score starts 10 lower, for the author to change. */
export function createOwnChallenge(draft: DraftPack, name: string = PLAY_RULE_PLACEHOLDERS.challenge): { draft: DraftPack; id: string } {
  const [first] = scenarioRefs(draft, 'score_refs')
  return addContent(draft, 'challenge_modifiers', { name, description: '', ...(first ? { score_adjustments: { [first.id]: -10 } } : {}) } as Omit<ChallengeModifier, 'id' | 'version'>)
}

export function removeOwnChallenge(draft: DraftPack, id: string): DraftPack {
  const { [id]: _removed, ...challenge_modifiers } = draft.content.challenge_modifiers
  return { ...draft, content: { ...draft.content, challenge_modifiers } }
}

/**
 * What a challenge does, in words, generically (D29): "Rest starts −15,
 * Uptime starts −5; every council member starts at 40 satisfaction; 2 fewer
 * turns". Written from the numbers, so it always agrees with them.
 */
export function describeChallenge(challenge: Pick<ChallengeModifier, 'score_adjustments' | 'stakeholder_satisfaction_override' | 'turn_adjustment'>, names: Names): string {
  const parts: string[] = []
  const adjustments = Object.entries(challenge.score_adjustments ?? {}).filter(([, delta]) => delta !== 0)
  if (adjustments.length) parts.push(adjustments.map(([id, delta]) => `${names.scores[id] ?? GONE_SCORE} starts ${signedDelta(delta)}`).join(', '))
  if (challenge.stakeholder_satisfaction_override !== undefined) parts.push(`every council member starts at ${challenge.stakeholder_satisfaction_override} satisfaction`)
  if (challenge.turn_adjustment) parts.push(`${Math.abs(challenge.turn_adjustment)} ${challenge.turn_adjustment > 0 ? 'more' : 'fewer'} ${Math.abs(challenge.turn_adjustment) === 1 ? 'turn' : 'turns'}`)
  return parts.length ? parts.join('; ') : 'no changes yet'
}

// ── Coupling rules ────────────────────────────────────────────────────────

/**
 * A new coupling rule of the draft's own, listed by every scenario: while
 * the first score is below 25, gains to the second (or the first, if there's
 * only one) are cut to 70%. Null with no scores, or at the game's limit.
 */
export function createOwnCoupling(draft: DraftPack, name: string = PLAY_RULE_PLACEHOLDERS.coupling): { draft: DraftPack; id: string } | null {
  const scores = scenarioRefs(draft, 'score_refs')
  if (scores.length === 0) return null
  if (Object.values(draft.content.scenarios).some((scenario) => (scenario.coupling_rule_refs?.length ?? 0) >= COUPLING_PER_SCENARIO)) return null
  const trigger = scores[0].id
  const affected = (scores[1] ?? scores[0]).id
  const added = addContent(draft, 'coupling_rules', {
    name, description: '', trigger_score_id: trigger, threshold: 25, affected_score_ids: [affected], gain_multiplier: 0.7,
  } as Omit<CouplingRule, 'id' | 'version'>)
  let next = added.draft
  for (const scenario of Object.values(next.content.scenarios)) {
    next = putContent(next, 'scenarios', { ...scenario, coupling_rule_refs: [...(scenario.coupling_rule_refs ?? []), { id: added.id, version: 1 }] })
  }
  return { draft: next, id: added.id }
}

export function removeOwnCoupling(draft: DraftPack, id: string): DraftPack {
  let next = draft
  for (const scenario of Object.values(next.content.scenarios)) {
    next = putContent(next, 'scenarios', { ...scenario, coupling_rule_refs: (scenario.coupling_rule_refs ?? []).filter((ref) => ref.id !== id) })
  }
  const { [id]: _removed, ...coupling_rules } = next.content.coupling_rules
  return { ...next, content: { ...next.content, coupling_rules } }
}

/** A coupling rule in words: "While Rest is below 25, gains to Uptime and Learning are cut to 70%." */
export function describeCoupling(rule: Pick<CouplingRule, 'trigger_score_id' | 'threshold' | 'affected_score_ids' | 'gain_multiplier'>, names: Names): string {
  const score = (id: string) => names.scores[id] ?? GONE_SCORE
  return `While ${score(rule.trigger_score_id)} is below ${rule.threshold}, gains to ${listed(rule.affected_score_ids.map(score))} are cut to ${Math.round(rule.gain_multiplier * 100)}%. Losses aren't changed.`
}

/** The draft's own coupling rules its scenarios list, in their order. */
export function couplingInOrder(draft: DraftPack): CouplingRule[] {
  const seen = new Set<string>()
  return Object.values(draft.content.scenarios).flatMap((scenario) => scenario.coupling_rule_refs ?? [])
    .filter((ref) => !seen.has(ref.id) && seen.add(ref.id) && draft.content.coupling_rules[ref.id])
    .map((ref) => draft.content.coupling_rules[ref.id])
}

// ── A score deleted ───────────────────────────────────────────────────────

/** A score the names don't know (taken out of the pack): words, never its id. */
const GONE_SCORE = 'a score that isn\'t in this pack'

/**
 * The coupling rules that go with a score: those that watch it, or cut only
 * it. Without it they'd never do anything, and the game's checks don't say
 * so, so deleting the score deletes them too, and the Studio says so first.
 */
export function couplingLostWith(draft: DraftPack, scoreId: string): CouplingRule[] {
  return couplingInOrder(draft).filter((rule) => rule.trigger_score_id === scoreId || (rule.affected_score_ids.length === 1 && rule.affected_score_ids[0] === scoreId))
}

/**
 * What deleting a score does to the rules of play: classes that favour it
 * lose their bonus, challenges stop changing it, coupling rules stop cutting
 * it, and the coupling rules that only make sense with it go
 * (couplingLostWith).
 */
export function withoutScoreInPlayRules(draft: DraftPack, scoreId: string): DraftPack {
  let next = draft
  for (const rule of couplingLostWith(next, scoreId)) next = removeOwnCoupling(next, rule.id)
  for (const playerClass of Object.values(next.content.classes)) {
    if (playerClass.score_affinity === scoreId) next = setClassFavourite(next, playerClass.id, null)
  }
  for (const challenge of Object.values(next.content.challenge_modifiers)) {
    if (challenge.score_adjustments && scoreId in challenge.score_adjustments) {
      const { [scoreId]: _dropped, ...rest } = challenge.score_adjustments
      next = putContent(next, 'challenge_modifiers', { ...challenge, score_adjustments: rest })
    }
  }
  for (const rule of Object.values(next.content.coupling_rules)) {
    if (rule.affected_score_ids.includes(scoreId)) {
      next = putContent(next, 'coupling_rules', { ...rule, affected_score_ids: rule.affected_score_ids.filter((id) => id !== scoreId) })
    }
  }
  return next
}
