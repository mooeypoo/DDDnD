/**
 * Scenario Bundle
 * 
 * A complete, validated collection of all content needed to run a scenario.
 * Contains no missing references - everything is fully resolved.
 *
 * This is the authoritative content input for deterministic simulation.
 */

import {
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  Card,
  Event,
  DelayedEffect,
  OutcomeTier,
  OutcomeArchetype
} from './content_types'
import { versionRefKey, VersionRef } from './version_ref'

/**
 * ScenarioBundle
 * 
 * All content entities are keyed by their version ref key (e.g., "define_bounded_context-v1")
 * to allow for multiple versions of the same content to coexist if needed.
 */
export interface ScenarioBundle {
  scenario: Scenario
  scores: Map<string, Score>
  stakeholders: Map<string, Stakeholder>
  stakeholder_reaction_rules: Map<string, StakeholderReactionRule>
  cards: Map<string, Card>
  events: Map<string, Event>
  delayed_effects: Map<string, DelayedEffect>
  outcome_tiers: Map<string, OutcomeTier>
  outcome_archetypes: Map<string, OutcomeArchetype>
}

/**
 * Creates an empty bundle shell for a validated scenario.
 *
 * Callers populate maps through bundle-building services.
 */
export function createEmptyBundle(scenario: Scenario): ScenarioBundle {
  return {
    scenario,
    scores: new Map(),
    stakeholders: new Map(),
    stakeholder_reaction_rules: new Map(),
    cards: new Map(),
    events: new Map(),
    delayed_effects: new Map(),
    outcome_tiers: new Map(),
    outcome_archetypes: new Map()
  }
}

/**
 * Adds an entity to the appropriate map in the bundle.
 * Returns the version-ref storage key used by the map.
 */
export function addToBundle(
  bundle: ScenarioBundle,
  type: 'score' | 'stakeholder' | 'stakeholder_reaction_rule' | 'card' | 'event' | 'delayed_effect' | 'outcome_tier' | 'outcome_archetype',
  entity: Score | Stakeholder | StakeholderReactionRule | Card | Event | DelayedEffect | OutcomeTier | OutcomeArchetype
): string {
  const key = versionRefKey({ id: entity.id, version: entity.version })
  
  switch (type) {
    case 'score':
      bundle.scores.set(key, entity as Score)
      break
    case 'stakeholder':
      bundle.stakeholders.set(key, entity as Stakeholder)
      break
    case 'stakeholder_reaction_rule':
      bundle.stakeholder_reaction_rules.set(key, entity as StakeholderReactionRule)
      break
    case 'card':
      bundle.cards.set(key, entity as Card)
      break
    case 'event':
      bundle.events.set(key, entity as Event)
      break
    case 'delayed_effect':
      bundle.delayed_effects.set(key, entity as DelayedEffect)
      break
    case 'outcome_tier':
      bundle.outcome_tiers.set(key, entity as OutcomeTier)
      break
    case 'outcome_archetype':
      bundle.outcome_archetypes.set(key, entity as OutcomeArchetype)
      break
  }
  
  return key
}

/**
 * Looks up an entity in a bundle map by version ref.
 */
export function getFromBundle<T>(
  map: Map<string, T>,
  ref: VersionRef
): T | undefined {
  return map.get(versionRefKey(ref))
}
