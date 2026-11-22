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

import { ScenarioBundle, versionRefKey } from '../model'
import type { NumericCondition, ScoreChange } from '../model/content_types'

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

  function isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value > 0
  }

  function isNonNegativeInteger(value: number): boolean {
    return Number.isInteger(value) && value >= 0
  }

  const trackedScoreIds = new Set(bundle.scenario.score_refs.map((ref) => ref.id))

  function recordUntrackedScore(
    scoreId: string,
    sourceType: 'card' | 'event' | 'delayed_effect' | 'reaction_rule' | 'requirement' | 'failure_condition' | 'reaction_condition' | 'event_condition',
    sourceId: string
  ): void {
    if (trackedScoreIds.has(scoreId)) {
      return
    }

    errors.push({
      type: 'untracked_score',
      message: `${sourceType} ${sourceId} references score "${scoreId}" which is not in the scenario score_refs`,
      details: { scoreId, sourceType, sourceId }
    })
  }

  function recordUntrackedScoreChanges(
    scoreChanges: ScoreChange[] | undefined,
    sourceType: 'card' | 'event' | 'delayed_effect' | 'reaction_rule',
    sourceId: string
  ): void {
    for (const change of scoreChanges ?? []) {
      recordUntrackedScore(change.score_id, sourceType, sourceId)
    }
  }

  const stakeholderIds = new Set(Array.from(bundle.stakeholders.values()).map((stakeholder) => stakeholder.id))

  /**
   * Checks condition targets. A condition on a score the scenario does not
   * track would silently read 0 (and a missing stakeholder 50), so it could
   * fire or never fire for reasons no author intended.
   */
  function recordUntrackedScoreConditions(
    conditions: NumericCondition[] | undefined,
    sourceType: 'requirement' | 'failure_condition' | 'reaction_condition' | 'event_condition',
    sourceId: string
  ): void {
    for (const condition of conditions ?? []) {
      if (condition.target_type === 'score') {
        recordUntrackedScore(condition.target_id, sourceType, sourceId)
      } else if (!stakeholderIds.has(condition.target_id)) {
        errors.push({
          type: 'unknown_condition_stakeholder',
          message: `${sourceType} ${sourceId} checks stakeholder "${condition.target_id}" which is not in the scenario`,
          details: { stakeholderId: condition.target_id, sourceType, sourceId }
        })
      }
    }
  }
  
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
    if (card.usage_limit !== undefined && card.usage_limit !== null && !isPositiveInteger(card.usage_limit)) {
      errors.push({
        type: 'invalid_card_usage_limit',
        message: `Card ${cardKey} has invalid usage_limit; expected a positive integer or null`,
        details: { cardKey, usage_limit: card.usage_limit }
      })
    }

    if (card.cooldown_turns !== undefined && !isNonNegativeInteger(card.cooldown_turns)) {
      errors.push({
        type: 'invalid_card_cooldown_turns',
        message: `Card ${cardKey} has invalid cooldown_turns; expected a non-negative integer`,
        details: { cardKey, cooldown_turns: card.cooldown_turns }
      })
    }

    recordUntrackedScoreChanges(card.score_changes, 'card', cardKey)
    recordUntrackedScoreConditions(card.requirements, 'requirement', cardKey)

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
    recordUntrackedScoreChanges(event.score_changes, 'event', eventKey)
    if (event.trigger_condition) {
      recordUntrackedScoreConditions([event.trigger_condition], 'event_condition', eventKey)
    }

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

  for (const [effectKey, effect] of bundle.delayed_effects) {
    recordUntrackedScoreChanges(effect.score_changes, 'delayed_effect', effectKey)
  }

  for (const [ruleKey, rule] of bundle.stakeholder_reaction_rules) {
    recordUntrackedScoreChanges(rule.score_changes, 'reaction_rule', ruleKey)
    recordUntrackedScoreConditions([rule.condition], 'reaction_condition', ruleKey)
  }

  recordUntrackedScoreConditions(
    bundle.scenario.failure_conditions,
    'failure_condition',
    `${bundle.scenario.id}-v${bundle.scenario.version}`
  )
  
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
  
  // Coupling rules (M3): present, and only about scores this scenario tracks
  const couplingScoreIds = new Set(bundle.scenario.score_refs.map((ref) => ref.id))
  for (const ruleRef of bundle.scenario.coupling_rule_refs ?? []) {
    const key = versionRefKey(ruleRef)
    const rule = bundle.coupling_rules.get(key)
    if (!rule) {
      errors.push({
        type: 'missing_coupling_rule',
        message: `Scenario references missing coupling rule: ${key}`,
        details: { ruleRef }
      })
      continue
    }
    for (const scoreId of [rule.trigger_score_id, ...rule.affected_score_ids]) {
      if (!couplingScoreIds.has(scoreId)) {
        errors.push({
          type: 'untracked_coupling_score',
          message: `Coupling rule ${key} uses score "${scoreId}", which this scenario doesn't track (add it to score_refs or use another rule)`,
          details: { ruleRef, scoreId }
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
