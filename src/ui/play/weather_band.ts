/**
 * Compact presentation for score meters.
 *
 * Visual storm/vial animation can still look like weather. Player-facing
 * labels are the system's mood. This mapping does not change thresholds,
 * outcomes, or card legality.
 *
 * Compact score *names* come from pack `short_name` via score_labels —
 * not from an id map here.
 */

import { scoreShortName } from '@/ui/play/score_labels'
import type { Score as ScoreDef } from '@/domains/content/model/content_types'

export type ScoreWeather = 'fair' | 'overcast' | 'squall' | 'tempest'

export interface ScoreWeatherPresentation {
  weather: ScoreWeather
  label: string
}

const MOOD_LABEL: Record<ScoreWeather, string> = {
  fair: 'Steady',
  overcast: 'Strained',
  squall: 'Troubled',
  tempest: 'Critical',
}

/**
 * Maps a 0–100 score onto a weather band.
 */
export function scoreWeather(value: number): ScoreWeather {
  if (value >= 70) return 'fair'
  if (value >= 40) return 'overcast'
  if (value >= 20) return 'squall'
  return 'tempest'
}

/**
 * Resolves a mood band plus a short player-facing label.
 */
export function describeScoreWeather(value: number): ScoreWeatherPresentation {
  const weather = scoreWeather(value)
  return {
    weather,
    label: MOOD_LABEL[weather],
  }
}

/**
 * One storm chip for engine-owned coupling collapses.
 *
 * Titles come from presentation mapping over `getActiveCouplingEffects`.
 * This does not invent thresholds.
 */
export function compactCouplingLabel(titles: string[]): string | null {
  if (titles.length === 0) return null
  if (titles.length === 1) return titles[0]
  return `${titles.length} systems bound`
}

type ScoreResolver = (scoreId: string) => ScoreDef | undefined

/**
 * Player-facing urgency for an engine collapse: what withers, and what to raise.
 *
 * Score names stay pack presentation labels. Thresholds stay in the engine.
 */
export function collapseUrgencyCopy(
  triggerScoreId: string,
  affectedScoreIds: string[],
  fallback: string,
  resolveScore?: ScoreResolver,
): string {
  const short = (id: string) => scoreShortName(id, resolveScore?.(id) ?? null)
  const trigger = short(triggerScoreId)
  const affected = affectedScoreIds.map((id) => short(id)).join(' and ')
  if (!affected) return fallback
  return `${affected} gains wither until ${trigger} recovers.`
}

/**
 * Turns still on the clock, including the current one.
 */
export function remainingTurns(currentTurn: number, maxTurns: number): number {
  if (maxTurns <= 0) return 0
  if (currentTurn <= 0) return maxTurns
  return Math.max(0, maxTurns - currentTurn + 1)
}

/**
 * Late-clock presentation for the remaining turns.
 *
 * Tutorial clocks are short on purpose, so they never use this cue.
 */
export function isLateTurnClock(
  currentTurn: number,
  maxTurns: number,
  options: { isTutorial?: boolean } = {},
): boolean {
  if (options.isTutorial) return false
  const remaining = remainingTurns(currentTurn, maxTurns)
  return remaining > 0 && remaining <= 3
}
