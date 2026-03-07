/**
 * Content Types
 * 
 * Defines the structure of all content entities that can be loaded from JSON files.
 * All keys use snake_case as required by the content schema.
 */

import { VersionRef } from './version_ref'

/**
 * Base metadata present in all content files.
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
 * Represents a modification to a score value.
 */
export interface ScoreChange {
  score_id: string
  delta: number
}

/**
 * Stakeholder Change
 *
 * Represents a change in stakeholder satisfaction.
 */
export interface StakeholderChange {
  stakeholder_id: string
  delta: number
}

/**
 * Numeric Condition
 *
 * A reusable condition format for score/stakeholder gate checks.
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
 * Defines character archetypes for run endings.
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
 */
export interface Scenario extends ContentMetadata {
  name: string
  description: string
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
}

/**
 * Player Class
 * 
 * Cosmetic player class selection.
 */
export interface PlayerClass extends ContentMetadata {
  name: string
  description: string
  flavor_text?: string
}
