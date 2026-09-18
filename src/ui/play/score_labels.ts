/**
 * Pack-backed score labels
 *
 * Player-facing short/full names come from Score content (short_name / name).
 * The UI must not invent compact titles for known score ids.
 */

import type { Score } from '@/domains/content/model/content_types'
import type { ScenarioBundle } from '@/domains/content/model/scenario_bundle'

export interface ScoreLabels {
  short: string
  full: string
}

/**
 * Title-cases a score id when pack data is unavailable (dev/test safety only).
 */
export function titleCaseScoreId(scoreId: string): string {
  return scoreId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Finds a score definition by id in a version-keyed bundle map.
 */
export function findScoreById(
  scores: Map<string, Score> | Iterable<Score> | undefined,
  scoreId: string,
): Score | undefined {
  if (!scores) return undefined
  const list = scores instanceof Map ? scores.values() : scores
  for (const score of list) {
    if (score.id === scoreId) return score
  }
  return undefined
}

/**
 * Resolves short + full labels from pack Score data.
 */
export function resolveScoreLabels(
  scoreId: string,
  score?: Score | null,
): ScoreLabels {
  if (score) {
    return {
      short: score.short_name,
      full: score.name,
    }
  }
  const fallback = titleCaseScoreId(scoreId)
  return { short: fallback, full: fallback }
}

/**
 * Compact label used across play UI.
 */
export function scoreShortName(
  scoreId: string,
  score?: Score | null,
): string {
  return resolveScoreLabels(scoreId, score).short
}

/**
 * Full pack name (hover / inspect).
 */
export function scoreFullName(
  scoreId: string,
  score?: Score | null,
): string {
  return resolveScoreLabels(scoreId, score).full
}

/**
 * Teaches the short↔long mapping on the weather strip.
 */
export function scoreConversionLabel(
  scoreId: string,
  score?: Score | null,
): string {
  const { short, full } = resolveScoreLabels(scoreId, score)
  if (short === full) return short
  return `${short} — ${full}`
}

/**
 * Lookup helper bound to a scenario bundle's score map.
 */
export function scoreLookupFromBundle(
  bundle: ScenarioBundle | null | undefined,
): (scoreId: string) => Score | undefined {
  return (scoreId: string) => findScoreById(bundle?.scores, scoreId)
}
