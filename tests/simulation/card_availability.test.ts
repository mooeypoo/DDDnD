import { describe, expect, it } from 'vitest'
import {
  addToBundle,
  Card,
  createEmptyBundle,
  Scenario,
  ScenarioBundle,
  Score
} from '@/domains/content/model'
import { create_engine } from '@/domains/simulation'

function buildAvailabilityBundle(): ScenarioBundle {
  const scenario: Scenario = {
    id: 'card_availability_scenario',
    version: 1,
    name: 'Card Availability Scenario',
    description: 'Scenario to validate card usage limits and cooldown behavior',
    max_turns: 6,
    starting_scores: {
      architecture_health: 50
    },
    score_refs: [{ id: 'architecture_health', version: 1 }],
    stakeholder_refs: [],
    card_refs: [
      { id: 'steady_improvement', version: 1 },
      { id: 'single_big_bet', version: 1 },
      { id: 'stabilize_on_call', version: 1 },
      { id: 'controlled_rollout', version: 1 },
      { id: 'tactical_cleanup', version: 1 }
    ],
    event_refs: []
  }

  const bundle = createEmptyBundle(scenario)

  const score: Score = {
    id: 'architecture_health',
    version: 1,
    name: 'Architecture Health',
    description: 'Overall architecture quality',
    default_value: 50,
    min_value: 0,
    max_value: 100
  }

  const cards: Card[] = [
    {
      id: 'steady_improvement',
      version: 1,
      name: 'Steady Improvement',
      description: 'Small but reliable architecture gains.',
      score_changes: [{ score_id: 'architecture_health', delta: 1 }],
      delayed_effect_refs: []
    },
    {
      id: 'single_big_bet',
      version: 1,
      name: 'Single Big Bet',
      description: 'A one-time high-impact intervention.',
      usage_limit: 1,
      score_changes: [{ score_id: 'architecture_health', delta: 5 }],
      delayed_effect_refs: []
    },
    {
      id: 'stabilize_on_call',
      version: 1,
      name: 'Stabilize On-Call',
      description: 'Strong tactical move that needs recovery time.',
      cooldown_turns: 2,
      score_changes: [{ score_id: 'architecture_health', delta: 3 }],
      delayed_effect_refs: []
    },
    {
      id: 'controlled_rollout',
      version: 1,
      name: 'Controlled Rollout',
      description: 'Limited intervention with a short cooldown.',
      usage_limit: 2,
      cooldown_turns: 1,
      score_changes: [{ score_id: 'architecture_health', delta: 2 }],
      delayed_effect_refs: []
    },
    {
      id: 'tactical_cleanup',
      version: 1,
      name: 'Tactical Cleanup',
      description: 'Limited card that should remain immediately reusable until uses are exhausted.',
      usage_limit: 2,
      score_changes: [{ score_id: 'architecture_health', delta: 2 }],
      delayed_effect_refs: []
    }
  ]

  addToBundle(bundle, 'score', score)

  for (const card of cards) {
    addToBundle(bundle, 'card', card)
  }

  return bundle
}

function findActionSummary(engine: ReturnType<typeof create_engine>, cardId: string) {
  return engine
    .get_turn_briefing()
    .available_action_summaries
    .find((summary) => summary.card_id === cardId)
}

describe('card availability rules', () => {
  it('defaults cards without availability fields to unlimited reusable behavior', () => {
    const engine = create_engine({ scenario_bundle: buildAvailabilityBundle(), seed: 'availability-default-seed' })
    engine.create_run()

    const summary = findActionSummary(engine, 'steady_improvement')

    expect(summary).toBeDefined()
    expect(summary?.is_playable).toBe(true)
    expect(summary?.usage_limit).toBeNull()
    expect(summary?.cooldown_turns).toBe(0)
    expect(summary?.turns_until_available).toBe(0)
  })

  it('enforces one-time use cards', () => {
    const engine = create_engine({ scenario_bundle: buildAvailabilityBundle(), seed: 'availability-one-time-seed' })
    engine.create_run()

    engine.play_turn('single_big_bet')

    const summaryAfterUse = findActionSummary(engine, 'single_big_bet')
    expect(summaryAfterUse?.is_playable).toBe(false)
    expect(summaryAfterUse?.unavailable_reason).toBe('usage_limit_reached')
    expect(summaryAfterUse?.uses_remaining).toBe(0)

    expect(() => engine.play_turn('single_big_bet')).toThrow('Action usage limit reached')
  })

  it('enforces cooldown and restores availability after required turns', () => {
    const engine = create_engine({ scenario_bundle: buildAvailabilityBundle(), seed: 'availability-cooldown-seed' })
    engine.create_run()

    engine.play_turn('stabilize_on_call')

    const turnTwoSummary = findActionSummary(engine, 'stabilize_on_call')
    expect(turnTwoSummary?.is_playable).toBe(false)
    expect(turnTwoSummary?.unavailable_reason).toBe('cooldown_active')
    expect(turnTwoSummary?.turns_until_available).toBe(2)
    expect(() => engine.play_turn('stabilize_on_call')).toThrow('Action is on cooldown')

    engine.play_turn('steady_improvement')

    const turnThreeSummary = findActionSummary(engine, 'stabilize_on_call')
    expect(turnThreeSummary?.is_playable).toBe(false)
    expect(turnThreeSummary?.turns_until_available).toBe(1)

    engine.play_turn('steady_improvement')

    const turnFourSummary = findActionSummary(engine, 'stabilize_on_call')
    expect(turnFourSummary?.is_playable).toBe(true)
    expect(turnFourSummary?.turns_until_available).toBe(0)
  })

  it('supports cards that combine usage limits with cooldowns', () => {
    const engine = create_engine({ scenario_bundle: buildAvailabilityBundle(), seed: 'availability-combo-seed' })
    engine.create_run()

    engine.play_turn('controlled_rollout')
    engine.play_turn('steady_improvement')
    engine.play_turn('controlled_rollout')

    const turnFourSummary = findActionSummary(engine, 'controlled_rollout')
    expect(turnFourSummary?.is_playable).toBe(false)
    expect(turnFourSummary?.unavailable_reason).toBe('usage_limit_reached')
    expect(turnFourSummary?.times_used).toBe(2)
    expect(turnFourSummary?.uses_remaining).toBe(0)

    expect(() => engine.play_turn('controlled_rollout')).toThrow('Action usage limit reached')
  })

  it('supports limited-use cards without cooldown and exhausts exactly at the limit', () => {
    const engine = create_engine({ scenario_bundle: buildAvailabilityBundle(), seed: 'availability-limited-seed' })
    engine.create_run()

    const beforeUse = findActionSummary(engine, 'tactical_cleanup')
    expect(beforeUse?.is_playable).toBe(true)
    expect(beforeUse?.turns_until_available).toBe(0)
    expect(beforeUse?.uses_remaining).toBe(2)

    engine.play_turn('tactical_cleanup')

    const afterFirstUse = findActionSummary(engine, 'tactical_cleanup')
    expect(afterFirstUse?.is_playable).toBe(true)
    expect(afterFirstUse?.turns_until_available).toBe(0)
    expect(afterFirstUse?.uses_remaining).toBe(1)

    engine.play_turn('tactical_cleanup')

    const afterSecondUse = findActionSummary(engine, 'tactical_cleanup')
    expect(afterSecondUse?.is_playable).toBe(false)
    expect(afterSecondUse?.unavailable_reason).toBe('usage_limit_reached')
    expect(afterSecondUse?.uses_remaining).toBe(0)
  })
})
