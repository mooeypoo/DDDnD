/**
 * Content Types
 * 
 * Defines the structure of all content entities that can be loaded from JSON files.
 * All keys use snake_case as required by the content schema.
 *
 * Note: raw JSON is untrusted until validated by content services.
 */

import { VersionRef } from './version_ref'

/**
 * Base metadata present in all content files.
 *
 * The id+version pair forms the canonical identity for content resolution.
 */
export interface ContentMetadata {
  id: string
  version: number
}

/**
 * Score Definition
 * 
 * Represents a metric tracked during gameplay.
 */
export interface Score extends ContentMetadata {
  name: string
  description: string
  default_value: number
  min_value?: number
  max_value?: number
}

/**
 * Score Change
 * 
 * Represents an additive modification to a score value.
 */
export interface ScoreChange {
  score_id: string
  delta: number
}

/**
 * Stakeholder Change
 *
 * Represents an additive change in stakeholder satisfaction.
 */
export interface StakeholderChange {
  stakeholder_id: string
  delta: number
}

/**
 * Numeric Condition
 *
 * A reusable condition format for score/stakeholder gate checks.
 * Used by requirement and failure-condition evaluation.
 */
export interface NumericCondition {
  target_type: 'score' | 'stakeholder'
  target_id: string
  operator: '<' | '<=' | '>' | '>=' | '=' | '=='
  value: number
}

/**
 * Delayed Effect
 * 
 * Represents a future consequence that resolves after a number of turns.
 * Resolution timing is owned by simulation turn-phase rules.
 */
export interface DelayedEffect extends ContentMetadata {
  name: string
  description: string
  turns_until_resolution: number
  score_changes: ScoreChange[]
  stakeholder_changes?: StakeholderChange[]
}

/**
 * Card
 * 
 * Represents an architectural decision the player can take.
 */
export interface Card extends ContentMetadata {
  name: string
  description: string
  flavor_text?: string
  score_changes: ScoreChange[]
  stakeholder_changes?: StakeholderChange[]
  delayed_effect_refs: VersionRef[]
  usage_limit?: number | null
  cooldown_turns?: number
  requirements?: NumericCondition[]
  style_tags?: string[]
}

/**
 * Event
 * 
 * Represents an unexpected system pressure that may occur during a turn.
 */
export interface Event extends ContentMetadata {
  name: string
  description: string
  flavor_text?: string
  score_changes: ScoreChange[]
  stakeholder_changes?: StakeholderChange[]
  delayed_effect_refs: VersionRef[]
  occurrence_weight: number
  trigger_condition_description?: string
}

/**
 * Stakeholder Reaction Rule
 * 
 * Defines how a stakeholder reacts to specific conditions.
 * Priority is used to order rule checks when multiple rules are applicable.
 */
export interface StakeholderReactionRule extends ContentMetadata {
  name: string
  description: string
  condition_description: string
  score_changes: ScoreChange[]
  stakeholder_changes?: StakeholderChange[]
  priority?: number
}

/**
 * Stakeholder
 * 
 * Represents an organizational force with opinions about the system.
 */
export interface Stakeholder extends ContentMetadata {
  name: string
  description: string
  reaction_rule_refs: VersionRef[]
}

/**
 * Outcome Tier
 * 
 * Defines success/failure tiers for run endings.
 */
export interface OutcomeTier extends ContentMetadata {
  name: string
  description: string
  rank: number
}

/**
 * Outcome Archetype
 * 
 * Defines legacy outcome archetype classifications for run endings.
 * Player-facing surfaces should prefer endingType terminology.
 */
export interface OutcomeArchetype extends ContentMetadata {
  name: string
  description: string
  flavor_text?: string
}

/**
 * Scenario
 * 
 * Defines a complete gameplay scenario.
 * References are resolved into a validated scenario bundle before simulation.
 */
export interface Scenario extends ContentMetadata {
  name: string
  description: string
  short_description?: string
  flavor_text?: string
  max_turns: number
  starting_scores: Record<string, number>
  score_refs: VersionRef[]
  stakeholder_refs: VersionRef[]
  card_refs: VersionRef[]
  event_refs: VersionRef[]
  outcome_tier_refs?: VersionRef[]
  outcome_archetype_refs?: VersionRef[]
  failure_conditions?: NumericCondition[]
  /** Max ± random variance applied to each starting score per run */
  score_variance?: number
  /** Tutorial-only: marks this scenario as a tutorial quest */
  is_tutorial?: boolean
  /** Tutorial-only: ordering among tutorials (1 = basics, 2 = advanced, etc.) */
  tutorial_order?: number
  /** Tutorial-only: reference to the tutorial script content file */
  tutorial_script_ref?: VersionRef
}

/**
 * Player Class
 * 
 * Player class selection with optional gameplay bonus.
 */
export interface PlayerClass extends ContentMetadata {
  name: string
  description: string
  flavor_text?: string
  score_affinity?: string
}

/**
 * Challenge Modifier
 * 
 * Optional difficulty modifier applied at run creation.
 */
export interface ChallengeModifier extends ContentMetadata {
  name: string
  description: string
  flavor_text?: string
  score_adjustments?: Record<string, number>
  stakeholder_satisfaction_override?: number
  turn_adjustment?: number
}
