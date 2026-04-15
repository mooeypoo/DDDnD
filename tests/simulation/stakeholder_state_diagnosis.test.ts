import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { create_engine } from '@/domains/simulation/services'
import { readFile } from 'fs/promises'
import path from 'path'
import {
  VersionRef,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  Card,
  Event,
  DelayedEffect,
  OutcomeTier,
  OutcomeArchetype
} from '@/domains/content/model'

interface ContentProvider {
  loadScenario(ref: VersionRef): Promise<Scenario>
  loadScore(ref: VersionRef): Promise<Score>
  loadStakeholder(ref: VersionRef): Promise<Stakeholder>
  loadStakeholderReactionRule(ref: VersionRef): Promise<StakeholderReactionRule>
  loadCard(ref: VersionRef): Promise<Card>
  loadEvent(ref: VersionRef): Promise<Event>
  loadDelayedEffect(ref: VersionRef): Promise<DelayedEffect>
  loadOutcomeTier(ref: VersionRef): Promise<OutcomeTier>
  loadOutcomeArchetype(ref: VersionRef): Promise<OutcomeArchetype>
  loadPlayerClass(): Promise<never>
}

/**
 * Diagnostic tests for stakeholder state behavior
 * 
 * Tests verify whether stakeholder satisfaction actually changes during gameplay
 * and that stakeholder_changes are properly defined in content and applied by the engine.
 */

function createFileContentProvider(contentRoot: string): ContentProvider {
  async function loadJson<T extends { id: string; version: number }>(
    directory: string,
    ref: VersionRef
  ): Promise<T> {
    const filename = `${ref.id}-v${ref.version}.json`
    const filePath = path.join(contentRoot, directory, filename)
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as T

    if (parsed.id !== ref.id || parsed.version !== ref.version) {
      throw new Error(
        `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`
      )
    }

    return parsed
  }

  return {
    loadScenario: (ref: VersionRef) => loadJson<Scenario>('scenarios', ref),
    loadScore: (ref: VersionRef) => loadJson<Score>('scores', ref),
    loadStakeholder: (ref: VersionRef) => loadJson<Stakeholder>('stakeholders', ref),
    loadStakeholderReactionRule: (ref: VersionRef) => loadJson<StakeholderReactionRule>('stakeholder-reaction-rules', ref),
    loadCard: (ref: VersionRef) => loadJson<Card>('cards', ref),
    loadEvent: (ref: VersionRef) => loadJson<Event>('events', ref),
    loadDelayedEffect: (ref: VersionRef) => loadJson<DelayedEffect>('delayed-effects', ref),
    loadOutcomeTier: (ref: VersionRef) => loadJson<OutcomeTier>('outcome-tiers', ref),
    loadOutcomeArchetype: (ref: VersionRef) => loadJson<OutcomeArchetype>('outcome-archetypes', ref),
    loadPlayerClass: async () => {
      throw new Error('Player class loading is not required for scenario bundle construction')
    }
  }
}

async function createMonolithScenarioBundle() {
  const contentRoot = path.resolve(__dirname, '../../content')
  const provider = createFileContentProvider(contentRoot)
  return buildScenarioBundle('monolith_of_mild_despair', 1, provider)
}

describe('Stakeholder State Diagnosis', () => {
  it('initializes stakeholders with satisfaction = 50', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'test' })
    const gameState = engine.create_run()

    // All stakeholders start at 50
    for (const stakeholder of Object.values(gameState.stakeholders)) {
      expect(stakeholder.satisfaction).toBe(50)
    }
  })

  it('stakeholder_reaction_rules exist and are loaded', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()

    // Test scenario has stakeholders with reaction rules
    expect(scenarioBundle.stakeholder_reaction_rules.size).toBeGreaterThan(0)

    // At least one rule should have a score_changes array
    let foundRuleWithScoreChanges = false
    for (const rule of scenarioBundle.stakeholder_reaction_rules.values()) {
      if (rule.score_changes && rule.score_changes.length > 0) {
        foundRuleWithScoreChanges = true
        break
      }
    }
    expect(foundRuleWithScoreChanges).toBe(true)
  })

  it('stakeholder_reaction_rules now include stakeholder_changes', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()

    // GET_DIAGNOSIS: Check if any reaction rule has stakeholder_changes
    let foundStakeholderChange = false
    for (const rule of scenarioBundle.stakeholder_reaction_rules.values()) {
      if (rule.stakeholder_changes && rule.stakeholder_changes.length > 0) {
        foundStakeholderChange = true
        break
      }
    }
    expect(foundStakeholderChange).toBe(true)
  })

  it('stakeholder_changes are defined on at least one card', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()

    let foundStakeholderChange = false
    for (const card of scenarioBundle.cards.values()) {
      if (card.stakeholder_changes && card.stakeholder_changes.length > 0) {
        foundStakeholderChange = true
        break
      }
    }
    expect(foundStakeholderChange).toBe(true)
  })

  it('stakeholder_changes are defined on at least one event', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()

    let foundStakeholderChange = false
    for (const event of scenarioBundle.events.values()) {
      if (event.stakeholder_changes && event.stakeholder_changes.length > 0) {
        foundStakeholderChange = true
        break
      }
    }
    expect(foundStakeholderChange).toBe(true)
  })

  it('after playing a turn, stakeholder satisfaction may have changed due to reactions', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'test-turn' })

    const initialGameState = engine.create_run()
    const initialSatisfaction: Record<string, number> = {}

    for (const [stakeholderId, stakeholder] of Object.entries(initialGameState.stakeholders)) {
      initialSatisfaction[stakeholderId] = stakeholder.satisfaction
    }

    // Play a turn - stakeholder reactions may fire
    const result = engine.play_turn('define_bounded_context')

    // With stakeholder_changes now defined, at least some stakeholder satisfaction
    // may have changed (depends on which reactions fire)
    for (const stakeholder of Object.values(result.game_state.stakeholders)) {
      // Just verify the mechanism exists; reactions may or may not fire on turn 1
      expect(stakeholder.satisfaction).toBeDefined()
    }

    // Reactions may or may not fire on turn 1, but the mechanism should exist
    expect(result.turn_resolution_context.total_stakeholder_changes).toBeDefined()
  })

  it('turn_resolution_context.total_stakeholder_changes may contain reactions when conditions are met', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'test-changes' })

    engine.create_run()
    
    // Play several turns so stakeholder reactions may trigger
    // domain_clarity starts at 30 (< 40, so CTO should react)
    let foundReactions = false
    for (let i = 0; i < 8; i++) {
      const result = engine.play_turn('define_bounded_context')
      if (result.turn_resolution_context.total_stakeholder_changes.length > 0) {
        foundReactions = true
        break
      }
    }

    // With stakeholder_changes defined and domain_clarity < 40, CTO reactions should fire
    expect(foundReactions).toBe(true)
  })

  it('stakeholder scores can change meaningfully through multiple turns as reactions fire', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'test-multi-turn' })

    engine.create_run()

    // Play multiple turns with domain_clarity-increasing cards
    let maxSatisfactionAchieved = 50
    let minSatisfactionAchieved = 50

    for (let i = 0; i < 8; i++) {
      const result = engine.play_turn('define_bounded_context')

      // Track satisfaction changes
      for (const stakeholder of Object.values(result.game_state.stakeholders)) {
        maxSatisfactionAchieved = Math.max(maxSatisfactionAchieved, stakeholder.satisfaction)
        minSatisfactionAchieved = Math.min(minSatisfactionAchieved, stakeholder.satisfaction)
      }
    }

    // With stakeholder_changes firing, at least some satisfaction changes should occur
    const hasDeviation = maxSatisfactionAchieved > 50 || minSatisfactionAchieved < 50
    expect(hasDeviation).toBe(true)
  })

  it('cumulative_stakeholder_deltas accumulates changes when stakeholders react', async () => {
    const scenarioBundle = await createMonolithScenarioBundle()
    const engine = create_engine({ scenario_bundle: scenarioBundle, seed: 'test-deltas' })

    engine.create_run()

    let lastResult
    for (let i = 0; i < 8; i++) {
      lastResult = engine.play_turn('define_bounded_context')
    }

    // With stakeholder_changes, cumulative deltas should be populated
    // CTO should react at least once during these turns
    expect(Object.keys(lastResult!.game_state.run_analytics.cumulative_stakeholder_deltas).length).toBeGreaterThan(0)
  })
})
