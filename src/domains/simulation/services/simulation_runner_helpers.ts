/**
 * Simulation Runner Helpers
 *
 * Deterministic helper utilities used by `simulate_runs` for telemetry shaping
 * and aggregate report computation.
 *
 * This module intentionally remains pure and side-effect free.
 */

import type {
  AggregateTelemetry,
  AverageScoreByTurn,
  AverageStakeholderSatisfactionByTurn,
  EventTurnTelemetry,
  OpeningCardFrequency,
  OpeningSequenceFrequency,
  PerRunTelemetry,
  RuleTriggerRateByStakeholder,
  StakeholderDeclineRate,
  StakeholderRecoveryRate,
  SuccessfulLowScoreRates,
  WinningCardPairs,
} from './simulation_runner'

/** Number of opening cards tracked for strategy-fingerprint telemetry. */
const OPENING_CARD_COUNT = 3

/**
 * Low-score checks applied across successful runs.
 * `label` is used as the serialized aggregate telemetry key.
 */
const LOW_SCORE_THRESHOLDS: Array<{ score_id: string; threshold: number; label: string }> = [
  { score_id: 'delivery_confidence', threshold: 30, label: 'delivery_confidence_below_30' },
  { score_id: 'budget', threshold: 0, label: 'budget_below_0' },
  { score_id: 'user_trust', threshold: 25, label: 'user_trust_below_25' },
  { score_id: 'team_morale', threshold: 25, label: 'team_morale_below_25' },
  { score_id: 'domain_clarity', threshold: 20, label: 'domain_clarity_below_20' },
  { score_id: 'maintainability', threshold: 20, label: 'maintainability_below_20' },
]

/**
 * Derives a unique deterministic run seed from a base seed and run index.
 */
export function deriveRunSeed(baseSeed: string, runIndex: number): string {
  return `${baseSeed}__run_${runIndex}`
}

/**
 * Arithmetic mean helper that safely returns 0 for empty arrays.
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Folds score change records into a score-id keyed delta map.
 */
export function buildScoreDeltaMap(changes: Array<{ score_id: string; delta: number }>): Record<string, number> {
  const map: Record<string, number> = {}
  for (const change of changes) {
    map[change.score_id] = (map[change.score_id] ?? 0) + change.delta
  }
  return map
}

/**
 * Folds stakeholder change records into a stakeholder-id keyed delta map.
 */
export function buildStakeholderDeltaMap(
  changes: Array<{ stakeholder_id: string; delta: number }>
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const change of changes) {
    map[change.stakeholder_id] = (map[change.stakeholder_id] ?? 0) + change.delta
  }
  return map
}

/**
 * Returns the opening window used for strategy fingerprinting.
 */
function computeOpeningCards(cardsPlayed: string[]): string[] {
  return cardsPlayed.slice(0, OPENING_CARD_COUNT)
}

/**
 * Formats opening cards into a stable aggregate map key.
 */
function formatOpeningSequenceKey(openingCards: string[]): string {
  return openingCards.join(' > ')
}

/**
 * Computes unordered unique card-pair keys for a single run.
 */
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

/**
 * Computes aggregate telemetry across all per-run outputs.
 */
export function computeAggregate(perRun: PerRunTelemetry[]): AggregateTelemetry {
  const total = perRun.length

  const outcomeDistribution: Record<string, number> = {}
  for (const run of perRun) {
    const key = run.outcome_tier ?? 'unknown'
    outcomeDistribution[key] = (outcomeDistribution[key] ?? 0) + 1
  }

  const wins = perRun.filter((r) => r.outcome_tier === 'success').length
  const winRate = total > 0 ? wins / total : 0

  const avgTurns = average(perRun.map((r) => r.turns_completed))

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

  const cardUsage: Record<string, number> = {}
  for (const run of perRun) {
    for (const card of run.cards_played) {
      cardUsage[card] = (cardUsage[card] ?? 0) + 1
    }
  }

  const eventFrequency: Record<string, number> = {}
  for (const run of perRun) {
    for (const event of run.events_triggered) {
      eventFrequency[event] = (eventFrequency[event] ?? 0) + 1
    }
  }

  const archetypeDistribution: Record<string, number> = {}
  for (const run of perRun) {
    const key = run.archetype ?? 'unknown'
    archetypeDistribution[key] = (archetypeDistribution[key] ?? 0) + 1
  }

  const reactionFrequency: Record<string, number> = {}
  for (const run of perRun) {
    for (const reaction of run.reactions_triggered) {
      reactionFrequency[reaction] = (reactionFrequency[reaction] ?? 0) + 1
    }
  }

  const openingCardFrequency: OpeningCardFrequency = {}
  const openingSequenceFrequency: OpeningSequenceFrequency = {}

  for (const run of perRun) {
    const opening = computeOpeningCards(run.cards_played)

    for (const cardId of opening) {
      openingCardFrequency[cardId] = (openingCardFrequency[cardId] ?? 0) + 1
    }

    if (opening.length > 0) {
      const seqKey = formatOpeningSequenceKey(opening)
      openingSequenceFrequency[seqKey] = (openingSequenceFrequency[seqKey] ?? 0) + 1
    }
  }

  const averageScoreByTurn: AverageScoreByTurn = {}

  if (perRun.length > 0) {
    const maxTurnCount = Math.max(...perRun.map((r) => r.score_snapshots_by_turn.length))

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

  const averageStakeholderSatisfactionByTurn: AverageStakeholderSatisfactionByTurn = {}
  const stakeholderRecoveryRate: StakeholderRecoveryRate = {}
  const stakeholderDeclineRate: StakeholderDeclineRate = {}
  const ruleTriggerRateByStakeholder: RuleTriggerRateByStakeholder = {}

  const stakeholderIds = new Set<string>()
  for (const run of perRun) {
    for (const turn of run.stakeholder_telemetry_by_turn) {
      for (const stakeholderId of Object.keys(turn.satisfaction_by_stakeholder)) {
        stakeholderIds.add(stakeholderId)
      }
    }
    for (const stakeholderId of Object.keys(run.final_stakeholder_satisfaction)) {
      stakeholderIds.add(stakeholderId)
    }
  }

  const maxStakeholderTurnCount =
    perRun.length > 0
      ? Math.max(...perRun.map((r) => r.stakeholder_telemetry_by_turn.length))
      : 0

  for (const stakeholderId of stakeholderIds) {
    const turnAverages: number[] = []
    let stakeholderTurnObservations = 0
    let positiveDeltaTurns = 0
    let negativeDeltaTurns = 0
    const ruleCountById: Record<string, number> = {}

    for (let turn = 0; turn < maxStakeholderTurnCount; turn++) {
      const values: number[] = []

      for (const run of perRun) {
        const turnTelemetry = run.stakeholder_telemetry_by_turn[turn]
        if (!turnTelemetry) {
          continue
        }

        const satisfaction = turnTelemetry.satisfaction_by_stakeholder[stakeholderId]
        if (satisfaction === undefined) {
          continue
        }

        values.push(satisfaction)
        stakeholderTurnObservations += 1

        const delta = turnTelemetry.delta_by_stakeholder[stakeholderId] ?? 0
        if (delta > 0) {
          positiveDeltaTurns += 1
        } else if (delta < 0) {
          negativeDeltaTurns += 1
        }

        const matchedRuleIds = turnTelemetry.matched_reaction_rule_ids_by_stakeholder[stakeholderId] ?? []
        for (const ruleId of matchedRuleIds) {
          ruleCountById[ruleId] = (ruleCountById[ruleId] ?? 0) + 1
        }
      }

      turnAverages.push(values.length > 0 ? average(values) : 0)
    }

    averageStakeholderSatisfactionByTurn[stakeholderId] = turnAverages
    stakeholderRecoveryRate[stakeholderId] =
      stakeholderTurnObservations > 0 ? positiveDeltaTurns / stakeholderTurnObservations : 0
    stakeholderDeclineRate[stakeholderId] =
      stakeholderTurnObservations > 0 ? negativeDeltaTurns / stakeholderTurnObservations : 0

    ruleTriggerRateByStakeholder[stakeholderId] = {}
    for (const [ruleId, count] of Object.entries(ruleCountById)) {
      ruleTriggerRateByStakeholder[stakeholderId][ruleId] =
        stakeholderTurnObservations > 0 ? count / stakeholderTurnObservations : 0
    }
  }

  const winningCardPairs: WinningCardPairs = {}
  const successfulRuns = perRun.filter((r) => r.outcome_tier === 'success')

  for (const run of successfulRuns) {
    const pairs = computeWinningCardPairsForRun(run.cards_played)
    for (const pair of pairs) {
      winningCardPairs[pair] = (winningCardPairs[pair] ?? 0) + 1
    }
  }

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
    average_stakeholder_satisfaction_by_turn: averageStakeholderSatisfactionByTurn,
    stakeholder_recovery_rate: stakeholderRecoveryRate,
    stakeholder_decline_rate: stakeholderDeclineRate,
    rule_trigger_rate_by_stakeholder: ruleTriggerRateByStakeholder,
    winning_card_pairs: winningCardPairs,
    successful_low_score_rates: successfulLowScoreRates,
  }
}
