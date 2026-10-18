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
  addToBundle
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
/**
 * Keeps the first version ref for each id+version so shared rules and
 * aftershocks are fetched once, in first-seen order.
 */
function dedupeRefs(refs: VersionRef[]): VersionRef[] {
  const seen = new Set<string>()
  const deduped: VersionRef[] = []

  for (const ref of refs) {
    const key = versionRefKey(ref)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(ref)
  }

  return deduped
}

export async function buildScenarioBundle(
  scenarioId: string,
  version: number,
  provider: ContentProvider
): Promise<ScenarioBundle> {
  const scenarioRef = { id: scenarioId, version }
  const scenario = await provider.loadScenario(scenarioRef)
  const bundle = createEmptyBundle(scenario)

  // Direct scenario references do not depend on each other. Fetch them
  // together so a run start is one round of requests instead of one file
  // after another.
  const [scores, stakeholders, cards, events, outcomeTiers, outcomeArchetypes] = await Promise.all([
    Promise.all(scenario.score_refs.map((ref) => provider.loadScore(ref))),
    Promise.all(scenario.stakeholder_refs.map((ref) => provider.loadStakeholder(ref))),
    Promise.all(scenario.card_refs.map((ref) => provider.loadCard(ref))),
    Promise.all(scenario.event_refs.map((ref) => provider.loadEvent(ref))),
    Promise.all((scenario.outcome_tier_refs ?? []).map((ref) => provider.loadOutcomeTier(ref))),
    Promise.all((scenario.outcome_archetype_refs ?? []).map((ref) => provider.loadOutcomeArchetype(ref))),
  ])

  for (const score of scores) {
    addToBundle(bundle, 'score', score)
  }
  for (const stakeholder of stakeholders) {
    addToBundle(bundle, 'stakeholder', stakeholder)
  }
  for (const card of cards) {
    addToBundle(bundle, 'card', card)
  }
  for (const event of events) {
    addToBundle(bundle, 'event', event)
  }
  for (const tier of outcomeTiers) {
    addToBundle(bundle, 'outcome_tier', tier)
  }
  for (const archetype of outcomeArchetypes) {
    addToBundle(bundle, 'outcome_archetype', archetype)
  }

  const ruleRefs = dedupeRefs(stakeholders.flatMap((stakeholder) => stakeholder.reaction_rule_refs))
  const effectRefs = dedupeRefs([
    ...cards.flatMap((card) => card.delayed_effect_refs),
    ...events.flatMap((event) => event.delayed_effect_refs),
  ])

  const [rules, effects] = await Promise.all([
    Promise.all(ruleRefs.map((ref) => provider.loadStakeholderReactionRule(ref))),
    Promise.all(effectRefs.map((ref) => provider.loadDelayedEffect(ref))),
  ])

  for (const rule of rules) {
    addToBundle(bundle, 'stakeholder_reaction_rule', rule)
  }
  for (const effect of effects) {
    addToBundle(bundle, 'delayed_effect', effect)
  }

  return bundle
}
