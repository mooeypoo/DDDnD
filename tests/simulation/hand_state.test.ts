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
import { create_engine } from '@/domains/simulation/services'
import { DEFAULT_HAND_SIZE } from '@/domains/simulation/rules'

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

function buildHandBundle(cardCount: number, maxTurns = 8): ScenarioBundle {
  const cardRefs = Array.from({ length: cardCount }, (_, index) => ({
    id: `move_${index + 1}`,
    version: 1
  }))

  const scenario: Scenario = {
    id: 'hand_policy_scenario',
    version: 1,
    name: 'Hand Policy Scenario',
    description: 'Validates legal hand, deck, and consult behavior',
    max_turns: maxTurns,
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
      short_name: 'Clarity',
      description: 'Clarity',
      default_value: 20,
      min_value: 0,
      max_value: 100
    },
    {
      id: 'budget',
      version: 1,
      name: 'Budget',
      short_name: 'Purse',
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

describe('Legal hand and consult archives', () => {
  it('deals the same opening hand for the same seed', () => {
    const bundle = buildHandBundle(10)
    const engineA = create_engine({ scenario_bundle: bundle, seed: 'deal-seed' })
    const engineB = create_engine({ scenario_bundle: bundle, seed: 'deal-seed' })

    const stateA = engineA.create_run()
    const stateB = engineB.create_run()

    expect(stateA.hand_state.hand_refs).toEqual(stateB.hand_state.hand_refs)
    expect(stateA.hand_state.deck_refs).toEqual(stateB.hand_state.deck_refs)
    expect(stateA.hand_state.hand_refs).toHaveLength(DEFAULT_HAND_SIZE)
    expect(stateA.hand_state.deck_refs).toHaveLength(4)
    expect(stateA.hand_state.legal_hand_size).toBe(DEFAULT_HAND_SIZE)
  })

  it('honors scenario opening_hand_card_ids and leaves the rest in card_refs order', () => {
    const bundle = buildHandBundle(10)
    bundle.scenario.opening_hand_card_ids = ['move_10', 'move_9', 'move_8', 'move_7', 'move_6', 'move_5']
    const engine = create_engine({ scenario_bundle: bundle, seed: 'authored-deal' })
    const state = engine.create_run()

    expect(state.hand_state.hand_refs.map((ref) => ref.id)).toEqual([
      'move_10',
      'move_9',
      'move_8',
      'move_7',
      'move_6',
      'move_5'
    ])
    expect(state.hand_state.deck_refs.map((ref) => ref.id)).toEqual([
      'move_1',
      'move_2',
      'move_3',
      'move_4'
    ])
    expect(engine.get_turn_briefing().can_consult_archives).toBe(true)
  })

  it('deals the entire playable pool when it is smaller than the hand size', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(4), seed: 'small-pool' })
    const state = engine.create_run()
    const briefing = engine.get_turn_briefing()

    expect(state.hand_state.hand_refs).toHaveLength(4)
    expect(state.hand_state.deck_refs).toHaveLength(0)
    expect(briefing.can_consult_archives).toBe(false)
    expect(briefing.available_action_card_ids).toHaveLength(4)
  })

  it('rejects playing a card that is only in the deck', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(10), seed: 'off-hand' })
    engine.create_run()
    const briefing = engine.get_turn_briefing()
    const deckCardId = briefing.deck_action_summaries[0]?.card_id

    expect(deckCardId).toBeTruthy()
    expect(() => engine.play_turn(deckCardId)).toThrow(`Action is not in the current hand: ${deckCardId}`)
  })

  it('refills the hand from the deck after a legal play', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(10), seed: 'refill' })
    const initial = engine.create_run()
    const playedId = engine.get_turn_briefing().available_action_card_ids[0]
    const result = engine.play_turn(playedId)

    expect(result.game_state.hand_state.hand_refs).toHaveLength(DEFAULT_HAND_SIZE)
    expect(result.game_state.hand_state.hand_refs.some((ref) => ref.id === playedId)).toBe(false)
    expect(
      initial.hand_state.hand_refs.map((ref) => ref.id).sort()
    ).not.toEqual(
      result.game_state.hand_state.hand_refs.map((ref) => ref.id).sort()
    )
    expect(result.turn_resolution_context.player_intent).toEqual({
      type: 'play_card',
      action_ref: { id: playedId, version: 1 }
    })
  })

  it('consults the archives without applying card score changes', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(10), seed: 'consult' })
    const initial = engine.create_run()
    const discardedId = engine.get_turn_briefing().available_action_card_ids[0]
    const result = engine.consult_archives([discardedId])

    expect(result.turn_resolution_context.player_intent.type).toBe('consult_archives')
    expect(result.game_state.progress.current_turn).toBe(2)
    expect(result.game_state.run_analytics.total_actions_played).toBe(0)
    expect(result.game_state.run_analytics.turns_completed).toBe(1)
    expect(result.game_state.scores).toEqual(initial.scores)
    expect(result.game_state.hand_state.hand_refs).toHaveLength(DEFAULT_HAND_SIZE)
    expect(result.game_state.hand_state.hand_refs.some((ref) => ref.id === discardedId)).toBe(false)
    expect(result.turn_resolution_context.action_resolution.score_changes).toEqual([])
  })

  it('draws a named remaining deck card when consulting', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(10), seed: 'named-draw' })
    const initial = engine.create_run()
    const discardedId = initial.hand_state.hand_refs[0].id
    const fifoId = initial.hand_state.deck_refs[0].id
    const requestedId = initial.hand_state.deck_refs[1].id

    const result = engine.consult_archives([discardedId], requestedId)
    const drawnIds = result.turn_resolution_context.player_intent.type === 'consult_archives'
      ? result.turn_resolution_context.player_intent.drawn_refs.map((ref) => ref.id)
      : []

    expect(requestedId).not.toBe(fifoId)
    expect(drawnIds).toContain(requestedId)
    expect(result.game_state.hand_state.hand_refs.some((ref) => ref.id === requestedId)).toBe(true)
    expect(result.game_state.hand_state.hand_refs.some((ref) => ref.id === discardedId)).toBe(false)
    expect(result.game_state.hand_state.deck_refs.some((ref) => ref.id === fifoId)).toBe(true)
  })

  it('rejects a named consult draw that is not in the remaining deck', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(10), seed: 'bad-draw' })
    const initial = engine.create_run()
    const discardedId = initial.hand_state.hand_refs[0].id

    expect(() => engine.consult_archives([discardedId], discardedId)).toThrow(
      'Consult the Archives cannot draw the same card it discards.',
    )
    expect(() => engine.consult_archives([discardedId], 'missing_page')).toThrow(
      'Action is not in the remaining deck: missing_page',
    )
  })

  it('cannot consult when the deck is empty', () => {
    const engine = create_engine({ scenario_bundle: buildHandBundle(4), seed: 'empty-deck' })
    engine.create_run()
    const discardedId = engine.get_turn_briefing().available_action_card_ids[0]

    expect(() => engine.consult_archives([discardedId])).toThrow(
      'Cannot consult the archives: the deck is empty.'
    )
  })

  it('produces identical results for the same seed and mixed intent sequence', () => {
    const bundle = buildHandBundle(10)
    const playSequence = (seed: string) => {
      const engine = create_engine({ scenario_bundle: bundle, seed })
      engine.create_run()
      const firstCard = engine.get_turn_briefing().available_action_card_ids[0]
      engine.play_turn(firstCard)
      const discardId = engine.get_turn_briefing().available_action_card_ids[0]
      engine.consult_archives([discardId])
      const secondCard = engine.get_turn_briefing().available_action_card_ids[0]
      return engine.play_turn(secondCard)
    }

    const resultA = playSequence('mixed-intent')
    const resultB = playSequence('mixed-intent')

    expect(resultA.game_state.scores).toEqual(resultB.game_state.scores)
    expect(resultA.game_state.hand_state).toEqual(resultB.game_state.hand_state)
    expect(resultA.game_state.history.map((entry) => entry.player_intent)).toEqual(
      resultB.game_state.history.map((entry) => entry.player_intent)
    )
  })

  it('keeps the full playable pool legal when legal_hand_size is raised', () => {
    const bundle = buildHandBundle(10)
    const playerEngine = create_engine({ scenario_bundle: bundle, seed: 'oracle-hand' })
    const playerState = playerEngine.create_run()
    const oracleEngine = create_engine({ scenario_bundle: bundle, seed: 'oracle-hand' })
    const oracleState = oracleEngine.create_run({ legal_hand_size: Number.MAX_SAFE_INTEGER })
    const playerDeckIds = playerState.hand_state.deck_refs.map((ref) => ref.id)
    const playedId = oracleState.hand_state.hand_refs[0].id
    const result = oracleEngine.play_turn(playedId)

    expect(playerDeckIds.length).toBeGreaterThan(0)
    expect(oracleState.hand_state.hand_refs).toHaveLength(10)
    expect(oracleState.hand_state.deck_refs).toHaveLength(0)
    for (const cardId of playerDeckIds) {
      expect(oracleState.hand_state.hand_refs.some((ref) => ref.id === cardId)).toBe(true)
    }

    expect(result.game_state.hand_state.deck_refs).toHaveLength(0)
    expect(result.game_state.hand_state.hand_refs.length).toBeGreaterThan(DEFAULT_HAND_SIZE)
    expect(result.game_state.hand_state.legal_hand_size).toBe(Number.MAX_SAFE_INTEGER)
  })
})
