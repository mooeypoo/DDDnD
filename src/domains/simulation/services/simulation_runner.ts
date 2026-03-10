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

// ── Public input / output types ─────────────────────────────────

export interface SimulationRunnerInput {
  scenario_bundle: ScenarioBundle
  /** Number of automated runs to execute */
  runs: number
  /** Base seed – each run derives a child seed from this */
  seed: string
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
}

/** Frequency of individual cards appearing in the opening (first 3 cards played). */
export type OpeningCardFrequency = Record<string, number>

/** Frequency of exact opening card sequences (e.g. "card_a > card_b > card_c"). */
export type OpeningSequenceFrequency = Record<string, number>

/** Average score values by turn index, keyed by score ID. */
export type AverageScoreByTurn = Record<string, number[]>

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

// ── Helpers ─────────────────────────────────────────────────────

function deriveRunSeed(baseSeed: string, runIndex: number): string {
  return `${baseSeed}__run_${runIndex}`
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
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
    for (const reaction of turnEntry.stakeholder_resolution.reactions) {
      for (const ruleRef of reaction.applied_rule_refs) {
        reactionsTriggered.push(ruleRef.id)
      }
    }
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
    score_snapshots_by_turn: scoreSnapshotsByTurn
  }
}

// ── Strategy fingerprint constants ──────────────────────────────

/** Number of opening cards to track for strategy fingerprinting. */
const OPENING_CARD_COUNT = 3

/** Low-score success thresholds: score_id → threshold value. */
const LOW_SCORE_THRESHOLDS: Array<{ score_id: string; threshold: number; label: string }> = [
  { score_id: 'delivery_confidence', threshold: 30, label: 'delivery_confidence_below_30' },
  { score_id: 'budget', threshold: 0, label: 'budget_below_0' },
  { score_id: 'user_trust', threshold: 25, label: 'user_trust_below_25' },
  { score_id: 'team_morale', threshold: 25, label: 'team_morale_below_25' },
  { score_id: 'domain_clarity', threshold: 20, label: 'domain_clarity_below_20' },
  { score_id: 'maintainability', threshold: 20, label: 'maintainability_below_20' }
]

// ── Aggregate computation ───────────────────────────────────────

function computeOpeningCards(cardsPlayed: string[]): string[] {
  return cardsPlayed.slice(0, OPENING_CARD_COUNT)
}

function formatOpeningSequenceKey(openingCards: string[]): string {
  return openingCards.join(' > ')
}

function computeWinningCardPairsForRun(cardsPlayed: string[]): string[] {
  const uniqueCards = [...new Set(cardsPlayed)].sort()
  const pairs: string[] = []
  for (let i = 0; i < uniqueCards.length; i++) {
    for (let j = i + 1; j < uniqueCards.length; j++) {
      pairs.push(`${uniqueCards[i]} + ${uniqueCards[j]}`)
    }
  }
  return pairs
}

function computeAggregate(perRun: PerRunTelemetry[]): AggregateTelemetry {
  const total = perRun.length

  // Outcome distribution
  const outcomeDistribution: Record<string, number> = {}
  for (const run of perRun) {
    const key = run.outcome_tier ?? 'unknown'
    outcomeDistribution[key] = (outcomeDistribution[key] ?? 0) + 1
  }

  // Win rate (success tier)
  const wins = perRun.filter((r) => r.outcome_tier === 'success').length
  const winRate = total > 0 ? wins / total : 0

  // Average turns completed
  const avgTurns = average(perRun.map((r) => r.turns_completed))

  // Average scores
  const scoreAccumulators: Record<string, number[]> = {}
  for (const run of perRun) {
    for (const [scoreId, value] of Object.entries(run.final_scores)) {
      if (!scoreAccumulators[scoreId]) scoreAccumulators[scoreId] = []
      scoreAccumulators[scoreId].push(value)
    }
  }
  const averageScores: Record<string, number> = {}
  for (const [scoreId, values] of Object.entries(scoreAccumulators)) {
    averageScores[scoreId] = average(values)
  }

  // Average stakeholder satisfaction
  const stakeholderAccumulators: Record<string, number[]> = {}
  for (const run of perRun) {
    for (const [id, value] of Object.entries(run.final_stakeholder_satisfaction)) {
      if (!stakeholderAccumulators[id]) stakeholderAccumulators[id] = []
      stakeholderAccumulators[id].push(value)
    }
  }
  const averageStakeholderSatisfaction: Record<string, number> = {}
  for (const [id, values] of Object.entries(stakeholderAccumulators)) {
    averageStakeholderSatisfaction[id] = average(values)
  }

  // Card usage (total across all runs)
  const cardUsage: Record<string, number> = {}
  for (const run of perRun) {
    for (const card of run.cards_played) {
      cardUsage[card] = (cardUsage[card] ?? 0) + 1
    }
  }

  // Event frequency
  const eventFrequency: Record<string, number> = {}
  for (const run of perRun) {
    for (const event of run.events_triggered) {
      eventFrequency[event] = (eventFrequency[event] ?? 0) + 1
    }
  }

  // Archetype distribution
  const archetypeDistribution: Record<string, number> = {}
  for (const run of perRun) {
    const key = run.archetype ?? 'unknown'
    archetypeDistribution[key] = (archetypeDistribution[key] ?? 0) + 1
  }

  // Reaction frequency
  const reactionFrequency: Record<string, number> = {}
  for (const run of perRun) {
    for (const reaction of run.reactions_triggered) {
      reactionFrequency[reaction] = (reactionFrequency[reaction] ?? 0) + 1
    }
  }

  // ── Strategy fingerprint: opening cards ─────────────────────

  const openingCardFrequency: OpeningCardFrequency = {}
  const openingSequenceFrequency: OpeningSequenceFrequency = {}

  for (const run of perRun) {
    const opening = computeOpeningCards(run.cards_played)

    // Individual card frequency in opening positions
    for (const cardId of opening) {
      openingCardFrequency[cardId] = (openingCardFrequency[cardId] ?? 0) + 1
    }

    // Exact sequence frequency
    if (opening.length > 0) {
      const seqKey = formatOpeningSequenceKey(opening)
      openingSequenceFrequency[seqKey] = (openingSequenceFrequency[seqKey] ?? 0) + 1
    }
  }

  // ── Strategy fingerprint: average score by turn ─────────────

  const averageScoreByTurn: AverageScoreByTurn = {}

  if (perRun.length > 0) {
    // Determine max turn count across all runs
    const maxTurnCount = Math.max(...perRun.map((r) => r.score_snapshots_by_turn.length))

    // Collect all score IDs from the first run's first snapshot
    const scoreIds = new Set<string>()
    for (const run of perRun) {
      for (const snapshot of run.score_snapshots_by_turn) {
        for (const scoreId of Object.keys(snapshot)) {
          scoreIds.add(scoreId)
        }
      }
    }

    for (const scoreId of scoreIds) {
      const turnAverages: number[] = []
      for (let turn = 0; turn < maxTurnCount; turn++) {
        const values: number[] = []
        for (const run of perRun) {
          if (turn < run.score_snapshots_by_turn.length) {
            const value = run.score_snapshots_by_turn[turn][scoreId]
            if (value !== undefined) {
              values.push(value)
            }
          }
        }
        turnAverages.push(values.length > 0 ? average(values) : 0)
      }
      averageScoreByTurn[scoreId] = turnAverages
    }
  }

  // ── Strategy fingerprint: winning card pairs ────────────────

  const winningCardPairs: WinningCardPairs = {}
  const successfulRuns = perRun.filter((r) => r.outcome_tier === 'success')

  for (const run of successfulRuns) {
    const pairs = computeWinningCardPairsForRun(run.cards_played)
    for (const pair of pairs) {
      winningCardPairs[pair] = (winningCardPairs[pair] ?? 0) + 1
    }
  }

  // ── Strategy fingerprint: successful low-score rates ────────

  const successfulLowScoreRates: SuccessfulLowScoreRates = {}
  const successCount = successfulRuns.length

  if (successCount > 0) {
    for (const check of LOW_SCORE_THRESHOLDS) {
      const matchingRuns = successfulRuns.filter((r) => {
        const scoreValue = r.final_scores[check.score_id]
        return scoreValue !== undefined && scoreValue < check.threshold
      })
      successfulLowScoreRates[check.label] = matchingRuns.length / successCount
    }
  } else {
    // No successful runs — all rates are 0
    for (const check of LOW_SCORE_THRESHOLDS) {
      successfulLowScoreRates[check.label] = 0
    }
  }

  return {
    total_runs: total,
    outcome_distribution: outcomeDistribution,
    win_rate: winRate,
    average_turns_completed: avgTurns,
    average_scores: averageScores,
    average_stakeholder_satisfaction: averageStakeholderSatisfaction,
    card_usage: cardUsage,
    event_frequency: eventFrequency,
    reaction_frequency: reactionFrequency,
    archetype_distribution: archetypeDistribution,
    opening_card_frequency: openingCardFrequency,
    opening_sequence_frequency: openingSequenceFrequency,
    average_score_by_turn: averageScoreByTurn,
    winning_card_pairs: winningCardPairs,
    successful_low_score_rates: successfulLowScoreRates
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
