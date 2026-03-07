import { describe, it, expect } from 'vitest'
import { createSeededRandom } from '@/shared/random/seeded_random'

describe('Simulation seeded random determinism', () => {
  it('produces repeatable sequences from the same seed', () => {
    const rngA = createSeededRandom('simulation-seed')
    const rngB = createSeededRandom('simulation-seed')

    const sampleA = [
      rngA.next(),
      rngA.nextInt(1, 10),
      rngA.choice(['a', 'b', 'c']),
      rngA.next(),
      rngA.getState()
    ]

    const sampleB = [
      rngB.next(),
      rngB.nextInt(1, 10),
      rngB.choice(['a', 'b', 'c']),
      rngB.next(),
      rngB.getState()
    ]

    expect(sampleA).toEqual(sampleB)
  })

  it('throws on invalid random helper inputs', () => {
    const rng = createSeededRandom('validation-seed')

    expect(() => rng.nextInt(10, 1)).toThrow()
    expect(() => rng.nextInt(1.1, 5)).toThrow()
    expect(() => rng.choice([])).toThrow()
  })
})
