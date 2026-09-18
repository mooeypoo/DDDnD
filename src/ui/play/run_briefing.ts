/**
 * Opening briefing copy for a run.
 *
 * A cold player needs the objective before any vocabulary. The charge line is
 * derived from the starting scores the engine actually dealt, so it stays true
 * after a challenge modifier and works for packs this file has never seen.
 *
 * Presentation only: this names scores, it does not score them.
 */

import type { ScoreSnapshot } from '@/domains/simulation/model'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'

export const TURN_SHAPE_LINE =
  'A turn is one card. You place it, last turn’s delayed consequences catch up, '
  + 'the system may throw something at you, and the council answers.'

export const TRADEOFF_LINE =
  'Every card trades something away. There is no move that only helps — deciding what to '
  + 'give up is the whole game.'

/**
 * Score ids under the most pressure, weakest first.
 *
 * Ties break on score id so the same starting state always reads the same way.
 */
export function weakestScoreIds(scores: ScoreSnapshot, limit = 2): string[] {
  return Object.entries(scores)
    .sort(([leftId, leftValue], [rightId, rightValue]) => {
      if (leftValue !== rightValue) return leftValue - rightValue
      return leftId.localeCompare(rightId)
    })
    .slice(0, Math.max(0, limit))
    .map(([scoreId]) => scoreId)
}

function scorePhrase(scoreId: string): string {
  return getMetricPresentation(scoreId).label.toLowerCase()
}

function clockPhrase(maxTurns: number): string {
  return maxTurns === 1 ? '1 turn remains' : `${maxTurns} turns remain`
}

/**
 * One-sentence objective plus where the system is hurting most.
 */
export function describeCharge(scores: ScoreSnapshot, maxTurns: number): string {
  const goal = 'Leave the system stronger than you found it, and keep the council with you.'
  const weakest = weakestScoreIds(scores, 2).map(scorePhrase)

  if (weakest.length === 0) {
    return `${goal} ${clockPhrase(maxTurns)}.`
  }

  const pressure = weakest.length === 1
    ? `${weakest[0]} is the weakest right now`
    : `${weakest[0]} and ${weakest[1]} are the weakest right now`

  return `${goal} ${clockPhrase(maxTurns)}, and ${pressure}.`
}
