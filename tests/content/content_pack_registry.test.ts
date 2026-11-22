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
import {
  ContentOutOfScopeError,
  ContentPackConflictError,
  ContentPackDependencyError,
  ContentPackRegistry,
} from '@/domains/content/services/content_pack_registry'
import { ContentNotFoundError } from '@/domains/content/services/content_provider'

function createManifest(overrides: Partial<ContentPackManifest>): ContentPackManifest {
  return {
    schema_version: 1,
    kind: 'standalone',
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
    short_name: label,
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
    condition: { target_type: 'score', target_id: 'budget', operator: '>=', value: 0 },
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
    loadCouplingRule: vi.fn(async (ref: VersionRef) => ({
      id: ref.id, version: ref.version, name: `${label}-coupling`, description: label,
      trigger_score_id: 'score_a', threshold: 25, affected_score_ids: ['score_b'], gain_multiplier: 0.7,
    })),
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

    // ADR 0014: entry points belong to their pack; the same scenario id in two packs is two entries.
    expect(registry.getAvailableScenarios()).toEqual([
      { pack_key: 'dddnd:base', ref: { id: 'monolith_of_mild_despair', version: 1 } },
      { pack_key: 'dddnd:expansion', ref: { id: 'monolith_of_mild_despair', version: 1 } },
      { pack_key: 'dddnd:expansion', ref: { id: 'new_scenario', version: 1 } },
    ])
    expect(registry.getAvailableClasses()).toEqual([
      { id: 'boundary_mage', version: 1 },
      { id: 'new_class', version: 1 },
    ])
    expect(registry.getAvailableTutorials()).toEqual([{ pack_key: 'dddnd:expansion', ref: { id: 'tutorial_extra', version: 1 } }])
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

    const merged = registry.createGameWideProvider()

    const tutorialScenario = await merged.loadScenario({ id: 'tutorial_basics', version: 1 })
    const baseScenario = await merged.loadScenario({ id: 'monolith_of_mild_despair', version: 1 })

    expect(tutorialScenario.name).toBe('tutorial-scenario')
    expect(baseScenario.name).toBe('base-scenario')
    expect(tutorialProvider.loadScenario).toHaveBeenCalledTimes(1)
    expect(baseProvider.loadScenario).toHaveBeenCalledTimes(1)
  })

  // Before M1.3 this test asserted the opposite: the later pack silently won.
  // ADR 0001 removes cross-pack overrides, so a second claim is now refused.
  it('refuses a pack that claims content another pack already owns', () => {
    const registry = new ContentPackRegistry()
    const inventory = (challengeModifiers: string[]) => ({
      ...createManifest({}).content,
      challenge_modifiers: challengeModifiers,
    })

    registry.registerPack(createManifest({ id: 'base', content: inventory(['budget_crisis-v1.json']) }), createMockProvider('base'))

    expect(() =>
      registry.registerPack(createManifest({ id: 'expansion', content: inventory(['budget_crisis-v1.json']) }), createMockProvider('expansion')),
    ).toThrow(ContentPackConflictError)
    expect(registry.getManifests().map((manifest) => manifest.id)).toEqual(['base'])
  })

  it('derives available outcome archetypes from manifest inventory', () => {
    const registry = new ContentPackRegistry()

    const base = createManifest({
      id: 'base',
      content: {
        scenarios: [],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: ['system_stabilizer-v1.json', 'boundary_builder-v1.json'],
        classes: [],
        challenge_modifiers: [],
      },
    })

    const bespoke = createManifest({
      id: 'bespoke',
      content: {
        scenarios: [],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: ['the_visionary-v1.json'],
        classes: [],
        challenge_modifiers: [],
      },
    })

    registry.registerPack(base, createMockProvider('base'))
    registry.registerPack(bespoke, createMockProvider('bespoke'))

    expect(registry.getAvailableOutcomeArchetypes()).toEqual([
      { id: 'system_stabilizer', version: 1 },
      { id: 'boundary_builder', version: 1 },
      { id: 'the_visionary', version: 1 },
    ])
  })

  it('ignores invalid outcome archetype filenames in inventory', () => {
    const registry = new ContentPackRegistry()

    const manifest = createManifest({
      id: 'invalid-filenames',
      content: {
        scenarios: [],
        cards: [],
        stakeholders: [],
        stakeholder_reaction_rules: [],
        scores: [],
        events: [],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: ['not-a-versioned-file.json', 'budget_hawk-v2.json'],
        classes: [],
        challenge_modifiers: [],
      },
    })

    registry.registerPack(manifest, createMockProvider('invalid'))

    expect(registry.getAvailableOutcomeArchetypes()).toEqual([{ id: 'budget_hawk', version: 2 }])
  })
})

describe('pack ownership and scope (M1.3, ADR 0001)', () => {
  const emptyInventory = createManifest({}).content

  function pack(id: string, overrides: Partial<ContentPackManifest> = {}): ContentPackManifest {
    return createManifest({ id, ...overrides })
  }

  it('refuses a second pack with the same id', () => {
    const registry = new ContentPackRegistry()
    registry.registerPack(pack('base'), createMockProvider('base'))
    expect(() => registry.registerPack(pack('base'), createMockProvider('impostor'))).toThrow(ContentPackConflictError)
  })

  it('does not fall back to other packs for content no pack lists', async () => {
    const registry = new ContentPackRegistry()
    const provider = createMockProvider('base')
    registry.registerPack(pack('base'), provider)

    await expect(registry.createGameWideProvider().loadCard({ id: 'unlisted', version: 1 })).rejects.toBeInstanceOf(ContentNotFoundError)
    expect(provider.loadCard).not.toHaveBeenCalled()
  })

  it('lets a pack use its own content and its dependencies, transitively', async () => {
    const registry = new ContentPackRegistry()
    registry.registerPack(pack('base', { content: { ...emptyInventory, scores: ['budget-v1.json'] } }), createMockProvider('base'))
    registry.registerPack(pack('middle', {
      kind: 'extension',
      depends_on: [{ pack_id: 'base', version: '1.0.0' }],
      content: { ...emptyInventory, cards: ['middle_card-v1.json'] },
    }), createMockProvider('middle'))
    registry.registerPack(pack('top', {
      kind: 'extension',
      depends_on: [{ pack_id: 'middle', version: '1.0.0' }],
      content: { ...emptyInventory, scenarios: ['top_scenario-v1.json'] },
    }), createMockProvider('top'))

    const scoped = registry.createScopedProvider('dddnd:top')
    await expect(scoped.loadCard({ id: 'middle_card', version: 1 })).resolves.toMatchObject({ name: 'middle-card' })
    await expect(scoped.loadScore({ id: 'budget', version: 1 })).resolves.toMatchObject({ name: 'base-score' })
  })

  it('refuses content from a loaded pack the scenario does not depend on', async () => {
    const registry = new ContentPackRegistry()
    registry.registerPack(pack('other', { content: { ...emptyInventory, cards: ['secret_card-v1.json'] } }), createMockProvider('other'))
    registry.registerPack(pack('mine', { content: { ...emptyInventory, scenarios: ['my_scenario-v1.json'] } }), createMockProvider('mine'))

    const scoped = registry.createScopedProvider('dddnd:mine')
    await expect(scoped.loadCard({ id: 'secret_card', version: 1 })).rejects.toBeInstanceOf(ContentOutOfScopeError)
    await expect(registry.createGameWideProvider().loadCard({ id: 'secret_card', version: 1 })).resolves.toBeDefined()
  })

  it('reports a missing dependency', () => {
    const registry = new ContentPackRegistry()
    registry.registerPack(pack('orphan', { kind: 'extension', depends_on: [{ pack_id: 'base', version: '1.0.0' }] }), createMockProvider('orphan'))
    expect(() => registry.createScopedProvider('dddnd:orphan')).toThrow(/depends on pack "base", which is not loaded/)
  })

  it('accepts newer minor versions of a dependency but not a different major', () => {
    const registry = new ContentPackRegistry()
    registry.registerPack(pack('base', { version: '1.4.0' }), createMockProvider('base'))
    registry.registerPack(pack('fits', { kind: 'extension', depends_on: [{ pack_id: 'base', version: '1.2.0' }] }), createMockProvider('fits'))
    registry.registerPack(pack('too_new', { kind: 'extension', depends_on: [{ pack_id: 'base', version: '1.5.0' }] }), createMockProvider('too_new'))
    registry.registerPack(pack('wrong_major', { kind: 'extension', depends_on: [{ pack_id: 'base', version: '2.0.0' }] }), createMockProvider('wrong_major'))

    expect(() => registry.createScopedProvider('dddnd:fits')).not.toThrow()
    expect(() => registry.createScopedProvider('dddnd:too_new')).toThrow(ContentPackDependencyError)
    expect(() => registry.createScopedProvider('dddnd:wrong_major')).toThrow(ContentPackDependencyError)
  })
})

describe('packs are known by key, never by name (ADR 0014)', () => {
  const emptyInventory = createManifest({}).content
  const MINE = 'github:mooeypoo/dddnd-packs/packs/gilded_ledger'
  const THEIRS = 'github:someone-else/their-packs/gilded_ledger'

  function ledger(overrides: Partial<ContentPackManifest> = {}): ContentPackManifest {
    return createManifest({
      id: 'gilded_ledger',
      kind: 'extension',
      depends_on: [{ pack_id: 'base', version: '1.0.0' }],
      scenarios: [{ id: 'ledger_scenario', version: 1 }],
      content: { ...emptyInventory, scenarios: ['ledger_scenario-v1.json'], cards: ['ledger_card-v1.json'] },
      ...overrides,
    })
  }

  function withBase(): ContentPackRegistry {
    const registry = new ContentPackRegistry()
    registry.registerPack(createManifest({ id: 'base', content: { ...emptyInventory, cards: ['define_bounded_context-v1.json'] } }), createMockProvider('base'))
    return registry
  }

  it('registers two same-named packs with the same content ids side by side, and returns each key', () => {
    const registry = withBase()
    expect(registry.registerPack(ledger(), createMockProvider('mine'), MINE)).toBe(MINE)
    expect(registry.registerPack(ledger(), createMockProvider('theirs'), THEIRS)).toBe(THEIRS)
    expect(registry.getPacks().map((pack) => pack.key)).toEqual(['dddnd:base', MINE, THEIRS])
  })

  it('resolves each pack\'s content from that pack only', async () => {
    const registry = withBase()
    registry.registerPack(ledger(), createMockProvider('mine'), MINE)
    registry.registerPack(ledger(), createMockProvider('theirs'), THEIRS)

    await expect(registry.createScopedProvider(MINE).loadCard({ id: 'ledger_card', version: 1 })).resolves.toMatchObject({ name: 'mine-card' })
    await expect(registry.createScopedProvider(THEIRS).loadCard({ id: 'ledger_card', version: 1 })).resolves.toMatchObject({ name: 'theirs-card' })
    expect(registry.getAvailableScenarios()).toEqual([
      { pack_key: MINE, ref: { id: 'ledger_scenario', version: 1 } },
      { pack_key: THEIRS, ref: { id: 'ledger_scenario', version: 1 } },
    ])
  })

  it('refuses a second registration under the same key', () => {
    const registry = withBase()
    registry.registerPack(ledger(), createMockProvider('mine'), MINE)
    expect(() => registry.registerPack(ledger({ id: 'renamed' }), createMockProvider('impostor'), MINE)).toThrow(ContentPackConflictError)
  })

  it('still refuses a pack that lists a file its dependency lists (its scenarios could not tell which one they meant)', () => {
    const registry = withBase()
    const shadowing = ledger({ content: { ...emptyInventory, cards: ['define_bounded_context-v1.json'] } })
    expect(() => registry.registerPack(shadowing, createMockProvider('mine'), MINE)).toThrow(/which pack "base" already provides/)
  })

  it('a community pack can never satisfy a dependency, even if it calls itself what is depended on', () => {
    const registry = new ContentPackRegistry()
    registry.registerPack(createManifest({ id: 'base' }), createMockProvider('impostor'), 'github:evil/packs/base')
    registry.registerPack(ledger(), createMockProvider('mine'), MINE)
    expect(() => registry.createScopedProvider(MINE)).toThrow(/depends on pack "base", which is not loaded/)
  })

  it('offers game-wide choices (classes, challenge modifiers) only from first-party packs', async () => {
    const registry = withBase()
    registry.registerPack(
      ledger({ classes: [{ id: 'sneaky_class', version: 1 }], content: { ...emptyInventory, classes: ['sneaky_class-v1.json'] } }),
      createMockProvider('mine'),
      MINE,
    )
    expect(registry.getAvailableClasses()).toEqual([])
    await expect(registry.createGameWideProvider().loadPlayerClass({ id: 'sneaky_class', version: 1 })).rejects.toBeInstanceOf(ContentNotFoundError)
  })
})
