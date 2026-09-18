import { describe, it, expect } from 'vitest'
import { createSeededRandom } from '@/shared/random/seeded_random'

describe('SeededRandom', () => {
  it('should produce consistent values for the same seed', () => {
    const rng1 = createSeededRandom('test-seed')
    const rng2 = createSeededRandom('test-seed')
    
    const values1 = [rng1.next(), rng1.next(), rng1.next()]
    const values2 = [rng2.next(), rng2.next(), rng2.next()]
    
    expect(values1).toEqual(values2)
  })
  
  it('should produce different values for different seeds', () => {
    const rng1 = createSeededRandom('seed-a')
    const rng2 = createSeededRandom('seed-b')
    
    const value1 = rng1.next()
    const value2 = rng2.next()
    
    expect(value1).not.toEqual(value2)
  })

  /*
   * Batch harnesses seed runs as "<base>__run_0", "<base>__run_1", and so on.
   * Without avalanche in the seed hash those neighbours started the generator a
   * few steps apart and stayed correlated for their whole sequence, which made
   * a 200-run audit batch behave like roughly 15 runs. "Different" is not
   * enough here; adjacent seeds have to be unrelated.
   */
  it('should decorrelate seeds that differ only in a trailing index', () => {
    const firstDraws = Array.from({ length: 256 }, (_, i) =>
      createSeededRandom(`batch__run_${i}`).next())

    const gaps = firstDraws.slice(1).map((value, i) => Math.abs(value - firstDraws[i]))
    const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

    // Independent uniforms average a gap of 1/3. Correlated ones average ~0.
    expect(meanGap).toBeGreaterThan(0.25)
  })
  
  it('should generate values in range [0, 1)', () => {
    const rng = createSeededRandom('range-test')
    
    for (let i = 0; i < 100; i++) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
  
  it('should generate integers in specified range', () => {
    const rng = createSeededRandom('int-test')
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(5, 10)
      expect(value).toBeGreaterThanOrEqual(5)
      expect(value).toBeLessThanOrEqual(10)
      expect(Number.isInteger(value)).toBe(true)
    }
  })
  
  it('should choose items from array', () => {
    const rng = createSeededRandom('choice-test')
    const items = ['a', 'b', 'c', 'd', 'e']
    
    for (let i = 0; i < 20; i++) {
      const chosen = rng.choice(items)
      expect(items).toContain(chosen)
    }
  })
  
  it('should be deterministic across multiple operations', () => {
    const rng1 = createSeededRandom('determinism-test')
    const rng2 = createSeededRandom('determinism-test')
    
    const items = ['option-a', 'option-b', 'option-c']
    
    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toEqual(rng2.next())
      expect(rng1.nextInt(1, 100)).toEqual(rng2.nextInt(1, 100))
      expect(rng1.choice(items)).toEqual(rng2.choice(items))
    }
  })
})
