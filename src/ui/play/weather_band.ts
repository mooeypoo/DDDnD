/**
 * Compact weather presentation for score meters.
 *
 * Weather is a display mapping over engine scores. It does not change
 * thresholds, outcomes, or card legality.
 */

export type ScoreWeather = 'fair' | 'overcast' | 'squall' | 'tempest'

export interface ScoreWeatherPresentation {
  weather: ScoreWeather
  label: string
}

const WEATHER_LABEL: Record<ScoreWeather, string> = {
  fair: 'Fair',
  overcast: 'Overcast',
  squall: 'Squall',
  tempest: 'Tempest',
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
 * Resolves weather plus a short player-facing label.
 */
export function describeScoreWeather(value: number): ScoreWeatherPresentation {
  const weather = scoreWeather(value)
  return {
    weather,
    label: WEATHER_LABEL[weather],
  }
}

const SHORT_METRIC_LABEL: Record<string, string> = {
  maintainability: 'Craft',
  delivery_confidence: 'Delivery',
  team_morale: 'Morale',
  user_trust: 'Trust',
  budget: 'Purse',
  domain_clarity: 'Clarity',
  team_capacity: 'Capacity',
  system_health: 'Health',
  code_clarity: 'Code',
}

/**
 * Compact meter label for the weather strip.
 */
export function shortMetricLabel(scoreId: string, fallbackLabel: string): string {
  return SHORT_METRIC_LABEL[scoreId] ?? fallbackLabel
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

/**
 * Player-facing urgency for an engine collapse: what withers, and what to raise.
 *
 * Score names stay presentation labels. Thresholds stay in the engine.
 */
export function collapseUrgencyCopy(
  triggerScoreId: string,
  affectedScoreIds: string[],
  fallback: string,
): string {
  const trigger = shortMetricLabel(triggerScoreId, triggerScoreId)
  const affected = affectedScoreIds
    .map((id) => shortMetricLabel(id, id))
    .join(' and ')
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
