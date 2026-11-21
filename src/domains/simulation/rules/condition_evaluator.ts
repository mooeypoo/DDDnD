import { NumericCondition } from '@/domains/content/model'
import { GameState } from '../model'

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

/**
 * Runtime condition evaluation state projected from game state.
 */
export interface ConditionEvaluationState {
  scores: GameState['scores']
  stakeholders: GameState['stakeholders']
}

/**
 * Evaluates a structured numeric condition against current runtime state.
 */
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
