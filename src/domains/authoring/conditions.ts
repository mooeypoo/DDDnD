/**
 * Conditions: "when Budget is below 25" (docs/PACK_STUDIO.md §4.1).
 *
 * Reactions wait for one, and an event can require one before it can happen.
 * The game reads the structured condition; the text beside it is for people,
 * so the Studio always writes the text from the condition and they can't
 * disagree.
 */

import type { NumericCondition } from '../content/model'

/** The range scores and satisfaction take in play: what a condition can sensibly compare with. */
export const PLAY_RANGE = { min: 0, max: 100 } as const

/**
 * Comparisons an author can choose, in words. They describe a state ("is
 * below"), not a crossing ("drops below"): the game checks a condition every
 * turn, and a reaction fires every turn it holds. Equality is left out:
 * scores rarely land on one number.
 */
export const CONDITION_WORDS: Record<'<' | '<=' | '>' | '>=', string> = {
  '<': 'is below',
  '<=': 'is at most',
  '>': 'is above',
  '>=': 'is at least',
}

/** A condition in plain words: "Budget is below 25". Any of the game's comparisons. */
export function describeCondition(condition: NumericCondition, targetName: string): string {
  const words: Record<NumericCondition['operator'], string> = { ...CONDITION_WORDS, '=': 'is exactly', '==': 'is exactly' }
  return `${targetName} ${words[condition.operator]} ${condition.value}`
}

/** The condition in people's words, as the game's own content writes it ("Budget < 25"). */
export function conditionText(condition: NumericCondition, targetName: string): string {
  return `${targetName} ${condition.operator} ${condition.value}`
}

/** A starting point the author changes: the score is below 40. */
export function startingCondition(scoreId: string): NumericCondition {
  return { target_type: 'score', target_id: scoreId, operator: '<', value: 40 }
}
