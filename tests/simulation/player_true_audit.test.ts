import { describe, expect, it } from 'vitest'
import {
  addToBundle,
  Card,
  createEmptyBundle,
  OutcomeTier,
  Scenario,
  ScenarioBundle,
  Score
} from '@/domains/content/model'
import { createSeededRandom } from '@/shared/random/seeded_random'
import { DEFAULT_HAND_SIZE } from '@/domains/simulation/rules'
import {
  simulate_player_true_and_oracle,
  simulate_runs
} from '@/domains/simulation/services/simulation_runner'
import {
  chooseOracleTurn,
  choosePlayerTrueTurn
} from '@/domains/simulation/services/simulation_runner_play_policy'
import type { TurnBriefing, TurnBriefingActionSummary } from '@/domains/simulation/services/get_turn_briefing'

function buildCard(id: string, scoreId: string, delta: number): Card {
  return {
    id,
    version: 1,
    name: id,
    description: `Play ${id}`,
    score_changes: [{ score_id: scoreId, delta }],
    delayed_effect_refs: []
  }
}

function buildPolicyBundle(cardCount: number): ScenarioBundle {
  const cardRefs = Array.from({ length: cardCount }, (_, index) => ({
    id: `move_${index + 1}`,
    version: 1
  }))

  const scenario: Scenario = {
    id: 'hand_policy_scenario',
    version: 1,
    name: 'Hand Policy Scenario',
    description: 'Validates player-true consult and oracle policies',
    max_turns: 8,
    starting_scores: {
      domain_clarity: 20,
      budget: 80
    },
    score_refs: [
      { id: 'domain_clarity', version: 1 },
      { id: 'budget', version: 1 }
    ],
    stakeholder_refs: [],
    card_refs: cardRefs,
    event_refs: [],
    outcome_tier_refs: [
      { id: 'survival', version: 1 }
    ]
  }

  const bundle = createEmptyBundle(scenario)
  const scores: Score[] = [
    {
      id: 'domain_clarity',
      version: 1,
      name: 'Domain Clarity',
      description: 'Clarity',
      default_value: 20,
      min_value: 0,
      max_value: 100
    },
    {
      id: 'budget',
      version: 1,
      name: 'Budget',
      description: 'Budget',
      default_value: 80,
      min_value: 0,
      max_value: 100
    }
  ]

  for (const score of scores) {
    addToBundle(bundle, 'score', score)
  }

  cardRefs.forEach((ref, index) => {
    const helpsClarity = index < 3
    addToBundle(
      bundle,
      'card',
      buildCard(ref.id, helpsClarity ? 'domain_clarity' : 'budget', helpsClarity ? 4 : 1)
    )
  })

  const survival: OutcomeTier = {
    id: 'survival',
    version: 1,
    name: 'Survival',
    description: 'Survival',
    rank: 3
  }
  addToBundle(bundle, 'outcome_tier', survival)

  return bundle
}

function actionSummary(cardId: string, isPlayable = true): TurnBriefingActionSummary {
  return {
    card_id: cardId,
    card_version: 1,
    short_summary: cardId,
    is_playable: isPlayable,
    unavailable_reason: isPlayable ? null : 'cooldown_active',
    usage_limit: null,
    uses_remaining: null,
    times_used: 0,
    cooldown_turns: 0,
    available_on_turn: 1,
    turns_until_available: 0
  }
}

function briefing(partial: Partial<TurnBriefing> & Pick<TurnBriefing, 'hand_action_summaries' | 'deck_action_summaries' | 'can_consult_archives'>): TurnBriefing {
  return {
    turn_number: 2,
    current_scores: { domain_clarity: 12, team_morale: 50, budget: 90 },
    stakeholder_satisfaction: {},
    available_action_card_ids: partial.hand_action_summaries
      .filter((summary) => summary.is_playable)
      .map((summary) => summary.card_id),
    available_action_summaries: [
      ...partial.hand_action_summaries,
      ...partial.deck_action_summaries
    ],
    pending_delayed_effects_resolving_this_turn: [],
    ...partial
  }
}

describe('Player-true runner and full-pool oracle', () => {
  it('consults when the hand cannot address pressure and the deck still can', () => {
    const bundle = buildPolicyBundle(10)
    const choice = choosePlayerTrueTurn(
      briefing({
        can_consult_archives: true,
        hand_action_summaries: [
          actionSummary('move_8'),
          actionSummary('move_9')
        ],
        deck_action_summaries: [actionSummary('move_1')]
      }),
      bundle,
      createSeededRandom('consult-choice')
    )

    expect(choice).toEqual({
      type: 'consult_archives',
      discard_ids: ['move_8']
    })
  })

  it('plays from the hand when a held card already addresses pressure', () => {
    const bundle = buildPolicyBundle(10)
    const choice = choosePlayerTrueTurn(
      briefing({
        can_consult_archives: true,
        hand_action_summaries: [
          actionSummary('move_1'),
          actionSummary('move_8')
        ],
        deck_action_summaries: [actionSummary('move_2')]
      }),
      bundle,
      createSeededRandom('play-choice')
    )

    expect(choice.type).toBe('play_card')
    if (choice.type === 'play_card') {
      expect(['move_1', 'move_8']).toContain(choice.action_id)
    }
  })

  it('never consults as a full-pool oracle', () => {
    const choice = chooseOracleTurn(
      briefing({
        can_consult_archives: true,
        hand_action_summaries: [
          actionSummary('move_8'),
          actionSummary('move_1')
        ],
        deck_action_summaries: [actionSummary('move_2')]
      }),
      createSeededRandom('oracle-choice')
    )

    expect(choice.type).toBe('play_card')
  })

  it('runs player-true bots from the legal hand without throwing', () => {
    const bundle = buildPolicyBundle(10)
    const report = simulate_runs({
      scenario_bundle: bundle,
      runs: 4,
      seed: 'player-true-hand',
      play_policy: 'player_true'
    })

    expect(report.play_policy).toBe('player_true')

    for (const run of report.per_run) {
      expect(run.cards_played.length + run.consults_used).toBe(run.turns_completed)
      expect(run.turns_completed).toBeGreaterThan(0)
    }
  })

  it('lets the oracle play cards that start in the player-true deck', () => {
    const bundle = buildPolicyBundle(10)
    const reports = simulate_player_true_and_oracle({
      scenario_bundle: bundle,
      runs: 8,
      seed: 'oracle-vs-hand'
    })

    expect(reports.player_true.play_policy).toBe('player_true')
    expect(reports.oracle.play_policy).toBe('full_pool_oracle')
    expect(reports.oracle.per_run.every((run) => run.consults_used === 0)).toBe(true)

    const oracleCardIds = new Set(reports.oracle.per_run.flatMap((run) => run.cards_played))
    expect(oracleCardIds.size).toBeGreaterThan(DEFAULT_HAND_SIZE)
  })

  it('is deterministic for the same seed and play policy', () => {
    const bundle = buildPolicyBundle(10)
    const first = simulate_runs({
      scenario_bundle: bundle,
      runs: 3,
      seed: 'policy-det',
      play_policy: 'player_true'
    })
    const second = simulate_runs({
      scenario_bundle: bundle,
      runs: 3,
      seed: 'policy-det',
      play_policy: 'player_true'
    })

    expect(first.per_run.map((run) => run.cards_played)).toEqual(
      second.per_run.map((run) => run.cards_played)
    )
    expect(first.per_run.map((run) => run.consults_used)).toEqual(
      second.per_run.map((run) => run.consults_used)
    )
  })
})
