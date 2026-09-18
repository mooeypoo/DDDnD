/**
 * Score shape validation
 *
 * Scores are presentation + simulation inputs. short_name is mandatory so
 * packs own compact labels instead of the UI inventing them.
 */

import type { Score } from '../model/content_types'

/**
 * Error thrown when a score file is missing required presentation fields.
 */
export class ScoreShapeError extends Error {
  constructor(public scoreId: string, message: string) {
    super(`Invalid score "${scoreId}": ${message}`)
    this.name = 'ScoreShapeError'
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Asserts a loaded score has the fields the UI and engine require.
 */
export function assertScoreShape(score: Score): void {
  if (!isNonEmptyString(score.name)) {
    throw new ScoreShapeError(score.id, 'name is required and must be a non-empty string')
  }
  if (!isNonEmptyString(score.short_name)) {
    throw new ScoreShapeError(score.id, 'short_name is required and must be a non-empty string')
  }
  if (!isNonEmptyString(score.description)) {
    throw new ScoreShapeError(score.id, 'description is required and must be a non-empty string')
  }
  if (typeof score.default_value !== 'number' || Number.isNaN(score.default_value)) {
    throw new ScoreShapeError(score.id, 'default_value is required and must be a number')
  }
}
