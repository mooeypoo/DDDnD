import { describe, expect, it, vi } from 'vitest'
import type {
  Card,
  ContentPackManifest,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef,
  PlayerClass,
  ChallengeModifier,
} from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'

function createManifest(overrides: Partial<ContentPackManifest>): ContentPackManifest {
  return {
    id: 'pack',
    version: '1.0.0',
    name: 'Pack',
    description: 'Test pack',
    depends_on: [],
    base_url: '/content',
    license: 'MIT',
    authors: [{ name: 'Test Author' }],
    scenarios: [],
    classes: [],
    challenge_modifiers: [],
    tutorials: [],
    content: {
      scenarios: [],
      cards: [],
      stakeholders: [],
      stakeholder_reaction_rules: [],
      scores: [],
      events: [],
      delayed_effects: [],
      outcome_tiers: [],
      outcome_archetypes: [],
      classes: [],
      challenge_modifiers: [],
    },
    ...overrides,
  }
}

function createMockProvider(label: string): ContentProvider {
  const makeScore = (ref: VersionRef): Score => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-score`,
    description: label,
    default_value: 50,
  })

  const makeScenario = (ref: VersionRef): Scenario => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-scenario`,
    description: label,
    max_turns: 5,
    starting_scores: {},
    score_refs: [],
    stakeholder_refs: [],
    card_refs: [],
    event_refs: [],
  })

  const makeStakeholder = (ref: VersionRef): Stakeholder => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-stakeholder`,
    description: label,
    reaction_rule_refs: [],
  })

  const makeRule = (ref: VersionRef): StakeholderReactionRule => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-rule`,
    description: label,
    condition_description: 'always',
    score_changes: [],
  })

  const makeCard = (ref: VersionRef): Card => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-card`,
    description: label,
    score_changes: [],
    delayed_effect_refs: [],
  })

  const makeEvent = (ref: VersionRef): Event => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-event`,
    description: label,
    occurrence_weight: 1,
    score_changes: [],
    delayed_effect_refs: [],
  })

  const makeDelayedEffect = (ref: VersionRef): DelayedEffect => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-effect`,
    description: label,
    turns_until_resolution: 1,
    score_changes: [],
  })

  const makeOutcomeTier = (ref: VersionRef): OutcomeTier => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-tier`,
    description: label,
    rank: 1,
  })

  const makeOutcomeArchetype = (ref: VersionRef): OutcomeArchetype => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-archetype`,
    description: label,
  })

  const makePlayerClass = (ref: VersionRef): PlayerClass => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-class`,
    description: label,
  })

  const makeChallengeModifier = (ref: VersionRef): ChallengeModifier => ({
    id: ref.id,
    version: ref.version,
    name: `${label}-modifier`,
    description: label,
  })

  return {
    loadScenario: vi.fn(async (ref: VersionRef) => makeScenario(ref)),
    loadScore: vi.fn(async (ref: VersionRef) => makeScore(ref)),
    loadStakeholder: vi.fn(async (ref: VersionRef) => makeStakeholder(ref)),
    loadStakeholderReactionRule: vi.fn(async (ref: VersionRef) => makeRule(ref)),
    loadCard: vi.fn(async (ref: VersionRef) => makeCard(ref)),
    loadEvent: vi.fn(async (ref: VersionRef) => makeEvent(ref)),
    loadDelayedEffect: vi.fn(async (ref: VersionRef) => makeDelayedEffect(ref)),
    loadOutcomeTier: vi.fn(async (ref: VersionRef) => makeOutcomeTier(ref)),
    loadOutcomeArchetype: vi.fn(async (ref: VersionRef) => makeOutcomeArchetype(ref)),
    loadPlayerClass: vi.fn(async (ref: VersionRef) => makePlayerClass(ref)),
    loadChallengeModifier: vi.fn(async (ref: VersionRef) => makeChallengeModifier(ref)),
  }
}

describe('content pack registry', () => {
  it('aggregates scenarios, classes, and tutorials across packs', () => {
    const registry = new ContentPackRegistry()

    const base = createManifest({
      id: 'base',
      scenarios: [{ id: 'monolith_of_mild_despair', version: 1 }],
      classes: [{ id: 'boundary_mage', version: 1 }],
      tutorials: [],
    })

    const expansion = createManifest({
      id: 'expansion',
      scenarios: [{ id: 'monolith_of_mild_despair', version: 1 }, { id: 'new_scenario', version: 1 }],
      classes: [{ id: 'new_class', version: 1 }],
      tutorials: [{ id: 'tutorial_extra', version: 1 }],
    })

    registry.registerPack(base, createMockProvider('base'))
    registry.registerPack(expansion, createMockProvider('expansion'))

    expect(registry.getAvailableScenarios()).toEqual([
      { id: 'monolith_of_mild_despair', version: 1 },
      { id: 'new_scenario', version: 1 },
    ])
    expect(registry.getAvailableClasses()).toEqual([
      { id: 'boundary_mage', version: 1 },
      { id: 'new_class', version: 1 },
    ])
    expect(registry.getAvailableTutorials()).toEqual([{ id: 'tutorial_extra', version: 1 }])
  })

  it('resolves content loads to the owning pack provider using inventory', async () => {
    const registry = new ContentPackRegistry()

    const baseProvider = createMockProvider('base')
    const tutorialProvider = createMockProvider('tutorial')

    const baseManifest = createManifest({
      id: 'base',
      content: {
        scenarios: ['monolith_of_mild_despair-v1.json'],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: [],
        classes: [],
        challenge_modifiers: [],
      },
    })

    const tutorialManifest = createManifest({
      id: 'tutorial',
      content: {
        scenarios: ['tutorial_basics-v1.json'],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: [],
        classes: [],
        challenge_modifiers: [],
      },
    })

    registry.registerPack(baseManifest, baseProvider)
    registry.registerPack(tutorialManifest, tutorialProvider)

    const merged = registry.createMergedProvider()

    const tutorialScenario = await merged.loadScenario({ id: 'tutorial_basics', version: 1 })
    const baseScenario = await merged.loadScenario({ id: 'monolith_of_mild_despair', version: 1 })

    expect(tutorialScenario.name).toBe('tutorial-scenario')
    expect(baseScenario.name).toBe('base-scenario')
    expect(tutorialProvider.loadScenario).toHaveBeenCalledTimes(1)
    expect(baseProvider.loadScenario).toHaveBeenCalledTimes(1)
  })

  it('prefers later packs when multiple packs own the same challenge modifier ref', async () => {
    const registry = new ContentPackRegistry()
    const baseProvider = createMockProvider('base')
    const expansionProvider = createMockProvider('expansion')

    const sharedModifierRef = { id: 'budget_crisis', version: 1 }

    const baseManifest = createManifest({
      id: 'base',
      challenge_modifiers: [sharedModifierRef],
      content: {
        scenarios: [],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: [],
        classes: [],
        challenge_modifiers: ['budget_crisis-v1.json'],
      },
    })

    const expansionManifest = createManifest({
      id: 'expansion',
      challenge_modifiers: [sharedModifierRef],
      content: {
        scenarios: [],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: [],
        classes: [],
        challenge_modifiers: ['budget_crisis-v1.json'],
      },
    })

    registry.registerPack(baseManifest, baseProvider)
    registry.registerPack(expansionManifest, expansionProvider)

    const merged = registry.createMergedProvider()
    const modifier = await merged.loadChallengeModifier(sharedModifierRef)

    expect(modifier.name).toBe('expansion-modifier')
    expect(expansionProvider.loadChallengeModifier).toHaveBeenCalledTimes(1)
    expect(baseProvider.loadChallengeModifier).not.toHaveBeenCalled()
  })
})
