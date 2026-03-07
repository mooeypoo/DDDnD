/**
 * Bundle Builder
 * 
 * Constructs a complete scenario bundle from a scenario ID.
 * 
 * Responsibilities:
 * - Load scenario definition
 * - Resolve all referenced content (cards, stakeholders, events, etc.)
 * - Resolve transitive dependencies (delayed effects, stakeholder rules)
 * - Assemble complete scenario bundle
 * 
 * A scenario bundle contains everything needed to run a scenario:
 * - scenario definition
 * - scores
 * - stakeholders and their reaction rules
 * - cards
 * - events
 * - delayed effects
 * - outcome definitions
 */

import {
  VersionRef,
  versionRefKey,
  ScenarioBundle,
  createEmptyBundle,
  addToBundle,
  Stakeholder,
  Card,
  Event
} from '../model'
import { ContentProvider } from './content_provider'

/**
 * Error thrown when a referenced content entity is missing.
 */
export class MissingContentReferenceError extends Error {
  constructor(
    public sourceType: string,
    public sourceId: string,
    public referenceType: string,
    public reference: VersionRef
  ) {
    super(
      `Missing ${referenceType} reference: ${versionRefKey(reference)} ` +
      `(referenced by ${sourceType} "${sourceId}")`
    )
    this.name = 'MissingContentReferenceError'
  }
}

/**
 * Builds a complete scenario bundle for the given scenario.
 * 
 * @param scenarioId - The scenario ID
 * @param version - The scenario version
 * @param provider - Content provider for loading content
 * @returns A complete scenario bundle with all dependencies resolved
 */
export async function buildScenarioBundle(
  scenarioId: string,
  version: number,
  provider: ContentProvider
): Promise<ScenarioBundle> {
  const scenarioRef = { id: scenarioId, version }
  
  // Load the scenario
  const scenario = await provider.loadScenario(scenarioRef)
  
  // Create empty bundle
  const bundle = createEmptyBundle(scenario)
  
  // Track what delayed effects we need to load
  const delayedEffectRefs = new Set<string>()
  
  // Load all scores
  for (const scoreRef of scenario.score_refs) {
    const score = await provider.loadScore(scoreRef)
    addToBundle(bundle, 'score', score)
  }
  
  // Load all stakeholders and collect their reaction rules
  const stakeholderRuleRefs: VersionRef[] = []
  for (const stakeholderRef of scenario.stakeholder_refs) {
    const stakeholder = await provider.loadStakeholder(stakeholderRef)
    addToBundle(bundle, 'stakeholder', stakeholder)
    
    // Collect reaction rule references
    stakeholderRuleRefs.push(...stakeholder.reaction_rule_refs)
  }
  
  // Load all stakeholder reaction rules
  for (const ruleRef of stakeholderRuleRefs) {
    const rule = await provider.loadStakeholderReactionRule(ruleRef)
    addToBundle(bundle, 'stakeholder_reaction_rule', rule)
  }
  
  // Load all cards and collect delayed effects
  for (const cardRef of scenario.card_refs) {
    const card = await provider.loadCard(cardRef)
    addToBundle(bundle, 'card', card)
    
    // Collect delayed effect references
    for (const effectRef of card.delayed_effect_refs) {
      delayedEffectRefs.add(versionRefKey(effectRef))
    }
  }
  
  // Load all events and collect delayed effects
  for (const eventRef of scenario.event_refs) {
    const event = await provider.loadEvent(eventRef)
    addToBundle(bundle, 'event', event)
    
    // Collect delayed effect references
    for (const effectRef of event.delayed_effect_refs) {
      delayedEffectRefs.add(versionRefKey(effectRef))
    }
  }
  
  // Load all delayed effects
  for (const effectKey of delayedEffectRefs) {
    // Parse the key back to a ref
    const match = effectKey.match(/^(.+)-v(\d+)$/)
    if (match) {
      const effectRef = { id: match[1], version: parseInt(match[2], 10) }
      const effect = await provider.loadDelayedEffect(effectRef)
      addToBundle(bundle, 'delayed_effect', effect)
    }
  }
  
  // Load outcome tiers if specified
  if (scenario.outcome_tier_refs) {
    for (const tierRef of scenario.outcome_tier_refs) {
      const tier = await provider.loadOutcomeTier(tierRef)
      addToBundle(bundle, 'outcome_tier', tier)
    }
  }
  
  // Load outcome archetypes if specified
  if (scenario.outcome_archetype_refs) {
    for (const archetypeRef of scenario.outcome_archetype_refs) {
      const archetype = await provider.loadOutcomeArchetype(archetypeRef)
      addToBundle(bundle, 'outcome_archetype', archetype)
    }
  }
  
  return bundle
}
