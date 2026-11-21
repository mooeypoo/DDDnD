/**
 * Legacy prose-condition parser (test support only).
 *
 * Until M1.4 the engine turned `condition_description` strings such as
 * "Domain clarity < 35" into conditions at runtime: a regex, then a fuzzy
 * match of the left side against score/stakeholder ids and display names.
 * M1.4 replaced that with explicit structured conditions in content and
 * removed this parser from the simulation.
 *
 * It is kept here, unchanged, for one job: proving that every first-party
 * structured condition is exactly what its prose used to mean, so the
 * migration changed no behavior and the human-readable text stays honest.
 */

import type { NumericCondition, ScenarioBundle } from '@/domains/content/model'

/**
 * Pattern for parsing textual condition descriptions into structured conditions.
 */
const CONDITION_PATTERN = /^(.+?)\s*(<=|>=|<|>|==|=)\s*(-?\d+)$/i

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function findScoreIdByToken(bundle: ScenarioBundle, token: string): string | null {
  const normalized = normalizeToken(token)

  if (bundle.scenario.starting_scores[normalized] !== undefined) {
    return normalized
  }

  for (const score of bundle.scores.values()) {
    if (normalizeToken(score.id) === normalized || normalizeToken(score.name) === normalized) {
      return score.id
    }
  }

  return null
}

function findStakeholderIdByToken(bundle: ScenarioBundle, token: string): string | null {
  const normalized = normalizeToken(token)

  for (const stakeholder of bundle.stakeholders.values()) {
    if (
      normalizeToken(stakeholder.id) === normalized ||
      normalizeToken(stakeholder.name) === normalized
    ) {
      return stakeholder.id
    }
  }

  return null
}

export function parseConditionDescription(
  conditionDescription: string,
  bundle: ScenarioBundle
): NumericCondition | null {
  const match = conditionDescription.match(CONDITION_PATTERN)

  if (!match) {
    return null
  }

  const [, rawTarget, operator, rawValue] = match
  const value = Number.parseInt(rawValue, 10)

  const scoreId = findScoreIdByToken(bundle, rawTarget)
  if (scoreId) {
    return {
      target_type: 'score',
      target_id: scoreId,
      operator: operator as NumericCondition['operator'],
      value
    }
  }

  const stakeholderId = findStakeholderIdByToken(bundle, rawTarget)
  if (stakeholderId) {
    return {
      target_type: 'stakeholder',
      target_id: stakeholderId,
      operator: operator as NumericCondition['operator'],
      value
    }
  }

  return null
}
