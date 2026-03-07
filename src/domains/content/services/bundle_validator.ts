/**
 * Bundle Validator
 * 
 * Validates that a scenario bundle is complete and well-formed.
 * 
 * Responsibilities:
 * - Verify all referenced IDs exist in the bundle
 * - Validate content structure matches schema expectations
 * - Ensure no missing or dangling references
 * 
 * This is the boundary between untrusted JSON content and trusted domain objects.
 * Once a bundle passes validation, the simulation can trust its structure.
 */

import { ScenarioBundle, VersionRef, versionRefKey } from '../model'

/**
 * Validation error details.
 */
export interface ValidationError {
  type: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Error thrown when bundle validation fails.
 */
export class BundleValidationError extends Error {
  constructor(public errors: ValidationError[]) {
    super(`Bundle validation failed with ${errors.length} error(s):\n${errors.map(e => `- ${e.message}`).join('\n')}`)
    this.name = 'BundleValidationError'
  }
}

/**
 * Validates a scenario bundle.
 * 
 * @param bundle - The bundle to validate
 * @returns Validation result with any errors found
 */
export function validateScenarioBundle(bundle: ScenarioBundle): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate scenario references scores that exist
  for (const scoreRef of bundle.scenario.score_refs) {
    const key = versionRefKey(scoreRef)
    if (!bundle.scores.has(key)) {
      errors.push({
        type: 'missing_score',
        message: `Scenario references missing score: ${key}`,
        details: { scoreRef }
      })
    }
  }
  
  // Validate starting scores reference valid scores
  for (const scoreId of Object.keys(bundle.scenario.starting_scores)) {
    const hasScore = Array.from(bundle.scores.values()).some(s => s.id === scoreId)
    if (!hasScore) {
      errors.push({
        type: 'invalid_starting_score',
        message: `Scenario starting_scores references unknown score id: ${scoreId}`,
        details: { scoreId }
      })
    }
  }
  
  // Validate scenario references stakeholders that exist
  for (const stakeholderRef of bundle.scenario.stakeholder_refs) {
    const key = versionRefKey(stakeholderRef)
    if (!bundle.stakeholders.has(key)) {
      errors.push({
        type: 'missing_stakeholder',
        message: `Scenario references missing stakeholder: ${key}`,
        details: { stakeholderRef }
      })
    }
  }
  
  // Validate stakeholders reference rules that exist
  for (const [stakeholderKey, stakeholder] of bundle.stakeholders) {
    for (const ruleRef of stakeholder.reaction_rule_refs) {
      const key = versionRefKey(ruleRef)
      if (!bundle.stakeholder_reaction_rules.has(key)) {
        errors.push({
          type: 'missing_stakeholder_rule',
          message: `Stakeholder ${stakeholderKey} references missing reaction rule: ${key}`,
          details: { stakeholderKey, ruleRef }
        })
      }
    }
  }
  
  // Validate scenario references cards that exist
  for (const cardRef of bundle.scenario.card_refs) {
    const key = versionRefKey(cardRef)
    if (!bundle.cards.has(key)) {
      errors.push({
        type: 'missing_card',
        message: `Scenario references missing card: ${key}`,
        details: { cardRef }
      })
    }
  }
  
  // Validate cards reference delayed effects that exist
  for (const [cardKey, card] of bundle.cards) {
    for (const effectRef of card.delayed_effect_refs) {
      const key = versionRefKey(effectRef)
      if (!bundle.delayed_effects.has(key)) {
        errors.push({
          type: 'missing_delayed_effect',
          message: `Card ${cardKey} references missing delayed effect: ${key}`,
          details: { cardKey, effectRef }
        })
      }
    }
  }
  
  // Validate scenario references events that exist
  for (const eventRef of bundle.scenario.event_refs) {
    const key = versionRefKey(eventRef)
    if (!bundle.events.has(key)) {
      errors.push({
        type: 'missing_event',
        message: `Scenario references missing event: ${key}`,
        details: { eventRef }
      })
    }
  }
  
  // Validate events reference delayed effects that exist
  for (const [eventKey, event] of bundle.events) {
    for (const effectRef of event.delayed_effect_refs) {
      const key = versionRefKey(effectRef)
      if (!bundle.delayed_effects.has(key)) {
        errors.push({
          type: 'missing_delayed_effect',
          message: `Event ${eventKey} references missing delayed effect: ${key}`,
          details: { eventKey, effectRef }
        })
      }
    }
  }
  
  // Validate outcome tier refs if present
  if (bundle.scenario.outcome_tier_refs) {
    for (const tierRef of bundle.scenario.outcome_tier_refs) {
      const key = versionRefKey(tierRef)
      if (!bundle.outcome_tiers.has(key)) {
        errors.push({
          type: 'missing_outcome_tier',
          message: `Scenario references missing outcome tier: ${key}`,
          details: { tierRef }
        })
      }
    }
  }
  
  // Validate outcome archetype refs if present
  if (bundle.scenario.outcome_archetype_refs) {
    for (const archetypeRef of bundle.scenario.outcome_archetype_refs) {
      const key = versionRefKey(archetypeRef)
      if (!bundle.outcome_archetypes.has(key)) {
        errors.push({
          type: 'missing_outcome_archetype',
          message: `Scenario references missing outcome archetype: ${key}`,
          details: { archetypeRef }
        })
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates a scenario bundle and throws if invalid.
 * 
 * @param bundle - The bundle to validate
 * @throws BundleValidationError if validation fails
 */
export function assertValidBundle(bundle: ScenarioBundle): void {
  const result = validateScenarioBundle(bundle)
  if (!result.valid) {
    throw new BundleValidationError(result.errors)
  }
}
