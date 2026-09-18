import { describe, expect, it } from 'vitest'

import { assertScoreShape, ScoreShapeError } from '@/domains/content/services/score_shape'
import type { Score } from '@/domains/content/model/content_types'

function validScore(overrides: Partial<Score> = {}): Score {
  return {
    id: 'maintainability',
    version: 1,
    name: 'Maintainability',
    short_name: 'Craft',
    description: 'How easy it is to change the system',
    default_value: 40,
    ...overrides,
  }
}

describe('assertScoreShape', () => {
  it('accepts a complete score', () => {
    expect(() => assertScoreShape(validScore())).not.toThrow()
  })

  it('rejects a missing short_name', () => {
    expect(() => assertScoreShape(validScore({ short_name: '   ' }))).toThrow(ScoreShapeError)
    expect(() => assertScoreShape(validScore({ short_name: '' }))).toThrow(/short_name/)
  })

  it('rejects a missing name', () => {
    expect(() => assertScoreShape(validScore({ name: '' }))).toThrow(/name is required/)
  })
})
