import { NumericCondition, ScenarioBundle } from '@/domains/content/model'
import { GameState } from '../model'

const CONDITION_PATTERN = /^(.+?)\s*(<=|>=|<|>|==|=)\s*(-?\d+)$/i

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function compare(actual: number, operator: NumericCondition['operator'], expected: number): boolean {
  switch (operator) {
    case '<':
      return actual < expected
    case '<=':
      return actual <= expected
    case '>':
      return actual > expected
    case '>=':
      return actual >= expected
    case '=':
    case '==':
      return actual === expected
    default:
      return false
  }
}

export interface ConditionEvaluationState {
  scores: GameState['scores']
  stakeholders: GameState['stakeholders']
}

export function evaluateNumericCondition(
  condition: NumericCondition,
  state: ConditionEvaluationState
): boolean {
  if (condition.target_type === 'score') {
    const actual = state.scores[condition.target_id] ?? 0
    return compare(actual, condition.operator, condition.value)
  }

  const actual = state.stakeholders[condition.target_id]?.satisfaction ?? 50
  return compare(actual, condition.operator, condition.value)
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
