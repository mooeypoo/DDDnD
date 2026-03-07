/**
 * Seeded Random
 * 
 * Provides deterministic pseudo-random number generation.
 * 
 * Critical for simulation determinism:
 * - Same seed = same sequence of random values
 * - Enables replay of runs
 * - Enables testing with known random sequences
 * 
 * This is used by the simulation engine for:
 * - Event selection
 * - Any probabilistic game mechanics
 * 
 * DO NOT use Math.random() in simulation code.
 * Always use this seeded random generator.
 */

export interface SeededRandom {
  /**
   * Returns a random number in range [0, 1)
   */
  next(): number
  
  /**
   * Returns a random integer in range [min, max]
   */
  nextInt(min: number, max: number): number

  /**
   * Returns the current deterministic state snapshot.
   */
  getState(): number
  
  /**
   * Returns a random element from an array
   */
  choice<T>(items: T[]): T
}

/**
 * Creates a seeded random number generator.
 * Uses a simple LCG (Linear Congruential Generator) algorithm.
 */
export function createSeededRandom(seed: string): SeededRandom {
  // Simple hash function to convert seed string to number
  let state = 0
  for (let i = 0; i < seed.length; i++) {
    state = ((state << 5) - state + seed.charCodeAt(i)) | 0
  }
  
  // Ensure positive seed
  state = Math.abs(state) || 1
  
  return {
    next(): number {
      // LCG parameters (from Numerical Recipes)
      state = (state * 1664525 + 1013904223) | 0
      return Math.abs(state) / 2147483648
    },
    
    nextInt(min: number, max: number): number {
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error('nextInt requires integer min and max values')
      }

      if (max < min) {
        throw new Error(`nextInt received invalid range: min=${min}, max=${max}`)
      }

      return Math.floor(this.next() * (max - min + 1)) + min
    },
    
    choice<T>(items: T[]): T {
      if (items.length === 0) {
        throw new Error('choice requires a non-empty array')
      }

      const index = this.nextInt(0, items.length - 1)
      return items[index]
    },

    getState(): number {
      return state
    }
  }
}
