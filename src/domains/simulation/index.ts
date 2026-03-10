/**
 * Simulation Domain
 *
 * Exports simulation runtime model types and engine services.
 */

export * from './model'
export * from './services'

// Re-export coupling query functions for UI display
export {
  computeCouplingMultiplier,
  getActiveCouplingEffects,
  type ActiveCouplingEffect
} from './rules/apply_score_changes'
