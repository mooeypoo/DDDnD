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
  /** Compact player-facing label used in play UI (weather strip, deltas, cards). */
  short_name: string
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
  /** Human-readable explanation of when the event can occur. Never parsed. */
  trigger_condition_description?: string
  /**
   * When present, the event is only eligible while this condition holds.
   * Required whenever `trigger_condition_description` is given.
   */
  trigger_condition?: NumericCondition
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
  /** Human-readable explanation of `condition`. Never parsed by the engine. */
  condition_description: string
  /** When this rule applies. Evaluated once per turn during stakeholder resolution. */
  condition: NumericCondition
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
  /** Compact summary for banners and selection surfaces (CONTENT_SCHEMA.md). */
  short_description?: string
  reaction_rule_refs: VersionRef[]
}

/**
 * Outcome Tier
 * 
 * Defines success/failure tiers for run endings.
 *
 * A run lands in the tier with the highest `min_average` at or below its
 * score average; below every threshold, it lands in the lowest tier. The
 * tier's `result` is the coarse result that exports and shares record.
 * Tiers without `min_average` are never picked (the tutorial's, until its
 * own fix). See CONTENT_SCHEMA.md "Outcome Tiers" and journal M3.4.
 */
export interface OutcomeTier extends ContentMetadata {
  name: string
  description: string
  rank: number
  /** Lowest score average that reaches this tier. Set with `result`. */
  min_average?: number
  /** The coarse result a run in this tier counts as. Set with `min_average`. */
  result?: OutcomeResult
}

/**
 * Coarse run result: what the simulator counts as a win, and what exports
 * and share links record next to the tier.
 */
export type OutcomeResult = 'success' | 'partial_success' | 'failure'

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
  /**
   * When this ending is chosen (journal M3.5). Endings are tried from the
   * highest `priority` down; the first whose conditions all hold wins. An
   * empty `when` always matches: the scenario's fallback ending. Endings
   * without criteria are never chosen.
   */
  criteria?: EndingCriteria
}

/** When an ending is chosen. See CONTENT_SCHEMA.md "Ending criteria". */
export interface EndingCriteria {
  priority: number
  when: EndingCondition[]
}

/** Comparison used by ending conditions. */
export type EndingOperator = '<' | '<=' | '>' | '>='

/**
 * One thing an ending checks at the end of a run. Every condition compares a
 * measure of the run with `value`.
 */
export type EndingCondition =
  /** Sum of the run's total changes to these scores. */
  | { measure: 'score_change'; score_ids: string[]; operator: EndingOperator; value: number }
  /** A score's value at the end of the run. */
  | { measure: 'final_score'; score_id: string; operator: EndingOperator; value: number }
  /** Sum of the run's satisfaction changes, for these stakeholders or all of them. */
  | { measure: 'stakeholder_change'; stakeholder_ids?: string[]; operator: EndingOperator; value: number }
  /** Events plus aftershocks, per turn played. */
  | { measure: 'pressure_per_turn'; operator: EndingOperator; value: number }

/**
 * Coupling Rule (M3)
 *
 * While one score sits below a threshold, gains to other scores shrink: a
 * collapsing system drags the rest down. Applies to scenarios that list it in
 * `coupling_rule_refs`. Positive changes to each affected score are multiplied
 * by `gain_multiplier` (rounded); losses are never changed. When several
 * active rules affect the same score, their multipliers stack.
 *
 * `name` and `description` are what the player sees while the rule is active.
 */
export interface CouplingRule extends ContentMetadata {
  name: string
  description: string
  /** The score that triggers the rule. */
  trigger_score_id: string
  /** The rule is active while the trigger score is strictly below this value. */
  threshold: number
  /** Scores whose gains shrink while the rule is active. */
  affected_score_ids: string[]
  /** Multiplier for those gains, between 0.1 and 1. */
  gain_multiplier: number
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
  /** Coupling between this scenario's scores (M3). None when omitted. */
  coupling_rule_refs?: VersionRef[]
  failure_conditions?: NumericCondition[]
  /**
   * When set and the playable pool is larger than the legal hand, these
   * card ids are dealt into the opening hand in order. Remaining playable
   * cards stay in the deck in `card_refs` order. Omitting this field keeps
   * the seeded pressure deal.
   */
  opening_hand_card_ids?: string[]
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
