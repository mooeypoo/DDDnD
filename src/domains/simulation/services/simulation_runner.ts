/**
 * Simulation Runner
 *
 * Automated multi-run gameplay simulation with telemetry collection.
 *
 * Runs N deterministic games against a ScenarioBundle, selecting random
 * available cards each turn via a seeded PRNG. Collects per-run and
 * aggregate telemetry suitable for balance tuning.
 *
 * Constraints:
 * - Pure, deterministic, no browser / Vue / Pinia imports
 * - Each run derives a unique seed from the base seed + run index
 * - Respects card cooldowns, usage limits, and requirements
 * - Returns a structured telemetry report, never writes to disk
 */

import { ScenarioBundle } from '@/domains/content/model'
import { createSeededRandom } from '@/shared/random/seeded_random'
import { createEngine, SimulationEngine } from './engine'
import { RunOutcome, RunOutcomeTier } from './get_run_outcome'
import {
  buildScoreDeltaMap,
  buildStakeholderDeltaMap,
  computeAggregate,
  deriveRunSeed,
} from './simulation_runner_helpers'

// ── Public input / output types ─────────────────────────────────

export interface SimulationRunnerInput {
  scenario_bundle: ScenarioBundle
  /** Number of automated runs to execute */
  runs: number
  /** Base seed – each run derives a child seed from this */
  seed: string
}

/**
 * Phase 1 telemetry contract:
 * turn-level stakeholder trajectory and matched reaction visibility.
 */
export interface StakeholderTurnTelemetry {
  turn_number: number
  satisfaction_by_stakeholder: Record<string, number>
  delta_by_stakeholder: Record<string, number>
  matched_reaction_rule_ids_by_stakeholder: Record<string, string[]>
}

/**
 * Phase 1 telemetry contract:
 * turn-level event observation.
 */
export interface EventTurnTelemetry {
  turn_number: number
  triggered_event_id: string | null
  score_deltas: Record<string, number>
  stakeholder_deltas: Record<string, number>
}

/**
 * Phase 1 telemetry contract:
 * turn-level action observation.
 */
export interface ActionTurnTelemetry {
  turn_number: number
  selected_card_id: string
  score_deltas: Record<string, number>
  stakeholder_deltas: Record<string, number>
}

export interface PerRunTelemetry {
  run_index: number
  seed: string
  outcome_tier: RunOutcomeTier | null
  archetype: string | null
  run_status: string
  turns_completed: number
  max_turns: number
  final_scores: Record<string, number>
  final_stakeholder_satisfaction: Record<string, number>
  cards_played: string[]
  events_triggered: string[]
  reactions_triggered: string[]
  score_average: number | null
  /** Score snapshot at the end of each turn, indexed by turn (0-based). */
  score_snapshots_by_turn: Record<string, number>[]
  /** Stakeholder telemetry by turn (Phase 1 contract). */
  stakeholder_telemetry_by_turn: StakeholderTurnTelemetry[]
  /** Event telemetry by turn (Phase 1 contract). */
  event_telemetry_by_turn: EventTurnTelemetry[]
  /** Action telemetry by turn (Phase 1 contract). */
  action_telemetry_by_turn: ActionTurnTelemetry[]
}

/** Frequency of individual cards appearing in the opening (first 3 cards played). */
export type OpeningCardFrequency = Record<string, number>

/** Frequency of exact opening card sequences (e.g. "card_a > card_b > card_c"). */
export type OpeningSequenceFrequency = Record<string, number>

/** Average score values by turn index, keyed by score ID. */
export type AverageScoreByTurn = Record<string, number[]>

/** Average stakeholder satisfaction values by turn index, keyed by stakeholder ID. */
export type AverageStakeholderSatisfactionByTurn = Record<string, number[]>

/** Fraction of stakeholder turns with positive net delta, keyed by stakeholder ID. */
export type StakeholderRecoveryRate = Record<string, number>

/** Fraction of stakeholder turns with negative net delta, keyed by stakeholder ID. */
export type StakeholderDeclineRate = Record<string, number>

/** Per-stakeholder per-rule trigger frequency across observed stakeholder turns. */
export type RuleTriggerRateByStakeholder = Record<string, Record<string, number>>

/** Frequency of unordered card pairs co-occurring in successful runs. */
export type WinningCardPairs = Record<string, number>

/**
 * Fraction of successful runs ending with a given score below a threshold.
 * Keyed by check label (e.g. "delivery_confidence_below_30").
 */
export type SuccessfulLowScoreRates = Record<string, number>

export interface AggregateTelemetry {
  total_runs: number
  outcome_distribution: Record<string, number>
  win_rate: number
  average_turns_completed: number
  average_scores: Record<string, number>
  average_stakeholder_satisfaction: Record<string, number>
  card_usage: Record<string, number>
  event_frequency: Record<string, number>
  reaction_frequency: Record<string, number>
  archetype_distribution: Record<string, number>
  /** Strategy-fingerprint telemetry: opening card frequency */
  opening_card_frequency: OpeningCardFrequency
  /** Strategy-fingerprint telemetry: opening sequence frequency */
  opening_sequence_frequency: OpeningSequenceFrequency
  /** Strategy-fingerprint telemetry: average score by turn */
  average_score_by_turn: AverageScoreByTurn
  /** Phase 1 telemetry: average stakeholder satisfaction by turn */
  average_stakeholder_satisfaction_by_turn: AverageStakeholderSatisfactionByTurn
  /** Phase 1 telemetry: fraction of turns with positive stakeholder net delta */
  stakeholder_recovery_rate: StakeholderRecoveryRate
  /** Phase 1 telemetry: fraction of turns with negative stakeholder net delta */
  stakeholder_decline_rate: StakeholderDeclineRate
  /** Phase 1 telemetry: rule trigger frequency by stakeholder */
  rule_trigger_rate_by_stakeholder: RuleTriggerRateByStakeholder
  /** Strategy-fingerprint telemetry: winning card pairs */
  winning_card_pairs: WinningCardPairs
  /** Strategy-fingerprint telemetry: successful low-score rates */
  successful_low_score_rates: SuccessfulLowScoreRates
}

export interface SimulationReport {
  scenario_id: string
  scenario_version: number
  base_seed: string
  total_runs: number
  per_run: PerRunTelemetry[]
  aggregate: AggregateTelemetry
}

// ── Single run execution ────────────────────────────────────────

function executeRun(
  engine: SimulationEngine,
  _scenarioBundle: ScenarioBundle,
  runIndex: number,
  runSeed: string
): PerRunTelemetry {
  let gameState = engine.create_run()
  const maxTurns = gameState.progress.max_turns
  const cardsPlayed: string[] = []
  const eventsTriggered: string[] = []
  const reactionsTriggered: string[] = []
  const scoreSnapshotsByTurn: Record<string, number>[] = []
  const stakeholderTelemetryByTurn: StakeholderTurnTelemetry[] = []
  const eventTelemetryByTurn: EventTurnTelemetry[] = []
  const actionTelemetryByTurn: ActionTurnTelemetry[] = []

  // Use a per-run PRNG for card selection (separate from engine random)
  const selectionRandom = createSeededRandom(`${runSeed}__selection`)

  while (gameState.progress.run_status === 'in_progress') {
    const briefing = engine.get_turn_briefing()

    // Pick a random playable card
    const playableCards = briefing.available_action_summaries.filter((a) => a.is_playable)
    if (playableCards.length === 0) {
      // No playable cards – shouldn't normally happen, but guard against infinite loop
      break
    }

    const chosen = selectionRandom.choice(playableCards)
    const actionId = chosen.card_id

    const result = engine.play_turn(actionId)
    gameState = result.game_state
    cardsPlayed.push(chosen.card_id)

    // Capture end-of-turn score snapshot for trajectory tracking
    const turnEntry = result.turn_history_entry
    scoreSnapshotsByTurn.push({ ...turnEntry.end_of_turn_scores })

    // Track events from turn history
    if (turnEntry.event_resolution?.selected_event) {
      eventsTriggered.push(turnEntry.event_resolution.selected_event.id)
    }

    // Track stakeholder reactions
    const matchedRulesByStakeholder: Record<string, string[]> = {}
    for (const reaction of turnEntry.stakeholder_resolution.reactions) {
      matchedRulesByStakeholder[reaction.stakeholder_id] = reaction.applied_rule_refs.map((ruleRef) => ruleRef.id)
      for (const ruleRef of reaction.applied_rule_refs) {
        reactionsTriggered.push(ruleRef.id)
      }
    }

    stakeholderTelemetryByTurn.push({
      turn_number: turnEntry.turn_number,
      satisfaction_by_stakeholder: Object.fromEntries(
        Object.entries(turnEntry.end_of_turn_stakeholders).map(([id, state]) => [id, state.satisfaction])
      ),
      delta_by_stakeholder: buildStakeholderDeltaMap(turnEntry.total_stakeholder_changes),
      matched_reaction_rule_ids_by_stakeholder: matchedRulesByStakeholder,
    })

    eventTelemetryByTurn.push({
      turn_number: turnEntry.turn_number,
      triggered_event_id: turnEntry.event_resolution?.selected_event?.id ?? null,
      score_deltas: buildScoreDeltaMap(turnEntry.event_resolution?.score_changes ?? []),
      stakeholder_deltas: buildStakeholderDeltaMap(turnEntry.event_resolution?.stakeholder_changes ?? []),
    })

    actionTelemetryByTurn.push({
      turn_number: turnEntry.turn_number,
      selected_card_id: turnEntry.action_resolution.selected_action.id,
      score_deltas: buildScoreDeltaMap(turnEntry.action_resolution.score_changes),
      stakeholder_deltas: buildStakeholderDeltaMap(turnEntry.action_resolution.stakeholder_changes),
    })
  }

  // Collect outcome
  const outcome: RunOutcome | null = engine.get_run_outcome()

  const finalScores = { ...gameState.scores }
  const finalStakeholders: Record<string, number> = {}
  for (const [id, state] of Object.entries(gameState.stakeholders)) {
    finalStakeholders[id] = state.satisfaction
  }

  return {
    run_index: runIndex,
    seed: runSeed,
    outcome_tier: outcome?.tier ?? null,
    archetype: outcome?.archetype ?? null,
    run_status: gameState.progress.run_status,
    turns_completed: gameState.progress.current_turn - 1,
    max_turns: maxTurns,
    final_scores: finalScores,
    final_stakeholder_satisfaction: finalStakeholders,
    cards_played: cardsPlayed,
    events_triggered: eventsTriggered,
    reactions_triggered: reactionsTriggered,
    score_average: outcome?.score_average ?? null,
    score_snapshots_by_turn: scoreSnapshotsByTurn,
    stakeholder_telemetry_by_turn: stakeholderTelemetryByTurn,
    event_telemetry_by_turn: eventTelemetryByTurn,
    action_telemetry_by_turn: actionTelemetryByTurn,
  }
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Runs N automated simulations and returns a structured telemetry report.
 *
 * Each run:
 * 1. Derives a deterministic child seed from `input.seed`
 * 2. Creates a fresh engine + run
 * 3. Each turn selects a random playable card via seeded PRNG
 * 4. Plays until run completes (max turns or failure condition)
 * 5. Collects outcome + telemetry
 *
 * The report contains per-run detail and aggregate metrics.
 */
export function simulate_runs(input: SimulationRunnerInput): SimulationReport {
  const { scenario_bundle, runs, seed } = input
  const perRun: PerRunTelemetry[] = []

  for (let i = 0; i < runs; i++) {
    const runSeed = deriveRunSeed(seed, i)
    const engine = createEngine(scenario_bundle, runSeed)
    const telemetry = executeRun(engine, scenario_bundle, i, runSeed)
    perRun.push(telemetry)
  }

  return {
    scenario_id: scenario_bundle.scenario.id,
    scenario_version: scenario_bundle.scenario.version,
    base_seed: seed,
    total_runs: runs,
    per_run: perRun,
    aggregate: computeAggregate(perRun)
  }
}
