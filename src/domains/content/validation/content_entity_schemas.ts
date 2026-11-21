/**
 * Content Entity Schemas
 *
 * Field-level schemas for every content file type. These turn raw, untrusted
 * JSON into the typed structures in `model/content_types.ts`.
 *
 * Design rules (ADR 0001, docs/CONTENT_PACKS.md):
 * - Objects are strict: unknown keys are errors. That catches author typos
 *   (`stakehoder_changes`) that would otherwise be silently ignored, and
 *   `schema_version` (on manifests) handles forward compatibility.
 * - Every number is a bounded integer. Every string is bounded text.
 * - Nothing here is interpreted as code or markup; it is all plain data.
 *
 * Reference resolution and `score_refs` coverage are checked later by the
 * bundle validator. This layer only checks what one file can know about itself.
 */

import type {
  Card,
  ChallengeModifier,
  DelayedEffect,
  Event,
  NumericCondition,
  OutcomeArchetype,
  OutcomeTier,
  PlayerClass,
  Scenario,
  Score,
  ScoreChange,
  Stakeholder,
  StakeholderChange,
  StakeholderReactionRule,
} from '../model/content_types'
import { CONTENT_LIMITS } from './content_limits'
import {
  boundedArray,
  boundedInt,
  contentVersionSchema,
  idRecord,
  idSchema,
  textSchema,
  versionRefSchema,
  z,
} from './schema_primitives'

const { text, numbers, counts } = CONTENT_LIMITS

const metadataShape = {
  id: idSchema,
  version: contentVersionSchema,
}

const nameSchema = textSchema(text.name)
const descriptionSchema = textSchema(text.description)
const flavorTextSchema = textSchema(text.flavor_text)

const scoreChangeSchema: z.ZodMiniType<ScoreChange> = z.strictObject({
  score_id: idSchema,
  delta: boundedInt(numbers.delta),
})

const stakeholderChangeSchema: z.ZodMiniType<StakeholderChange> = z.strictObject({
  stakeholder_id: idSchema,
  delta: boundedInt(numbers.delta),
})

export const numericConditionSchema: z.ZodMiniType<NumericCondition> = z.strictObject({
  target_type: z.enum(['score', 'stakeholder']),
  target_id: idSchema,
  operator: z.enum(['<', '<=', '>', '>=', '=', '==']),
  value: boundedInt(numbers.condition_value),
})

const scoreChangesSchema = boundedArray(scoreChangeSchema, counts.changes)
const stakeholderChangesSchema = boundedArray(stakeholderChangeSchema, counts.changes)
const delayedEffectRefsSchema = boundedArray(versionRefSchema, counts.delayed_effect_refs)

export const scoreSchema: z.ZodMiniType<Score> = z
  .strictObject({
    ...metadataShape,
    name: nameSchema,
    short_name: textSchema(text.short_name),
    description: descriptionSchema,
    default_value: boundedInt(numbers.score_value),
    min_value: z.optional(boundedInt(numbers.score_value)),
    max_value: z.optional(boundedInt(numbers.score_value)),
  })
  .check(
    z.refine(
      (score: { min_value?: number; max_value?: number }) =>
        score.min_value === undefined || score.max_value === undefined || score.min_value <= score.max_value,
      { error: 'min_value must not be greater than max_value', path: ['min_value'] },
    ),
  )

export const delayedEffectSchema: z.ZodMiniType<DelayedEffect> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  turns_until_resolution: boundedInt(numbers.turns_until_resolution),
  score_changes: scoreChangesSchema,
  stakeholder_changes: z.optional(stakeholderChangesSchema),
})

export const cardSchema: z.ZodMiniType<Card> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  flavor_text: z.optional(flavorTextSchema),
  score_changes: scoreChangesSchema,
  stakeholder_changes: z.optional(stakeholderChangesSchema),
  delayed_effect_refs: delayedEffectRefsSchema,
  usage_limit: z.optional(z.nullable(boundedInt(numbers.usage_limit))),
  cooldown_turns: z.optional(boundedInt(numbers.cooldown_turns)),
  requirements: z.optional(boundedArray(numericConditionSchema, counts.conditions)),
  style_tags: z.optional(boundedArray(textSchema(text.style_tag), counts.style_tags)),
})

export const eventSchema: z.ZodMiniType<Event> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  flavor_text: z.optional(flavorTextSchema),
  score_changes: scoreChangesSchema,
  stakeholder_changes: z.optional(stakeholderChangesSchema),
  delayed_effect_refs: delayedEffectRefsSchema,
  occurrence_weight: boundedInt(numbers.occurrence_weight),
  trigger_condition_description: z.optional(textSchema(text.condition_description)),
})

export const stakeholderReactionRuleSchema: z.ZodMiniType<StakeholderReactionRule> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  condition_description: textSchema(text.condition_description),
  score_changes: scoreChangesSchema,
  stakeholder_changes: z.optional(stakeholderChangesSchema),
  priority: z.optional(boundedInt(numbers.priority)),
})

export const stakeholderSchema: z.ZodMiniType<Stakeholder> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  short_description: z.optional(textSchema(text.short_description)),
  reaction_rule_refs: boundedArray(versionRefSchema, counts.reaction_rule_refs),
})

export const outcomeTierSchema: z.ZodMiniType<OutcomeTier> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  rank: boundedInt(numbers.rank),
})

export const outcomeArchetypeSchema: z.ZodMiniType<OutcomeArchetype> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  flavor_text: z.optional(flavorTextSchema),
})

export const scenarioSchema: z.ZodMiniType<Scenario> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  short_description: z.optional(textSchema(text.short_description)),
  flavor_text: z.optional(flavorTextSchema),
  max_turns: boundedInt(numbers.max_turns),
  starting_scores: idRecord(boundedInt(numbers.score_value), counts.score_refs),
  score_refs: boundedArray(versionRefSchema, counts.score_refs),
  stakeholder_refs: boundedArray(versionRefSchema, counts.stakeholder_refs),
  card_refs: boundedArray(versionRefSchema, counts.card_refs),
  event_refs: boundedArray(versionRefSchema, counts.event_refs),
  outcome_tier_refs: z.optional(boundedArray(versionRefSchema, counts.outcome_refs)),
  outcome_archetype_refs: z.optional(boundedArray(versionRefSchema, counts.outcome_refs)),
  failure_conditions: z.optional(boundedArray(numericConditionSchema, counts.conditions)),
  opening_hand_card_ids: z.optional(boundedArray(idSchema, counts.opening_hand_card_ids)),
  score_variance: z.optional(boundedInt(numbers.score_variance)),
  is_tutorial: z.optional(z.boolean()),
  tutorial_order: z.optional(boundedInt(numbers.tutorial_order)),
  tutorial_script_ref: z.optional(versionRefSchema),
})

export const playerClassSchema: z.ZodMiniType<PlayerClass> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  flavor_text: z.optional(flavorTextSchema),
  score_affinity: z.optional(idSchema),
})

export const challengeModifierSchema: z.ZodMiniType<ChallengeModifier> = z.strictObject({
  ...metadataShape,
  name: nameSchema,
  description: descriptionSchema,
  flavor_text: z.optional(flavorTextSchema),
  score_adjustments: z.optional(idRecord(boundedInt(numbers.delta), counts.score_refs)),
  stakeholder_satisfaction_override: z.optional(boundedInt(numbers.satisfaction)),
  turn_adjustment: z.optional(boundedInt(numbers.turn_adjustment)),
})
