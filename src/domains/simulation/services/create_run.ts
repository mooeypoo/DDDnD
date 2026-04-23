/**
 * Create Run
 * 
 * Initializes a new game state from a scenario bundle.
 * 
 * Responsibilities:
 * - Create initial game state structure
 * - Set starting score values from scenario
 * - Initialize stakeholder satisfaction
 * - Set turn counter to 1
 * - Initialize empty turn history
 * - Create run analytics tracking
 */

import { ChallengeModifier, ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { VersionedContentRef } from '@/shared/contracts'
import { createSeededRandom } from '@/shared/random/seeded_random'
import { CreateInitialGameStateInput, GameState, ScoreSnapshot, createInitialGameState } from '../model'

/**
 * Converts content refs to shared versioned content refs.
 */
function toVersionedContentRef(ref: { id: string; version: number }): VersionedContentRef {
  return {
    id: ref.id,
    version: ref.version
  }
}

/**
 * Deterministic seed hash used for stable run ids and timestamps.
 */
function hashSeed(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

/**
 * Applies deterministic per-score variance for scenario start values.
 */
function applyScoreVariance(
  startingScores: ScoreSnapshot,
  variance: number,
  seed: string
): ScoreSnapshot {
  const random = createSeededRandom(`${seed}__score_variance`)
  const result: ScoreSnapshot = {}
  for (const [scoreId, baseValue] of Object.entries(startingScores)) {
    const offset = random.nextInt(-variance, variance)
    result[scoreId] = Math.max(0, Math.min(100, baseValue + offset))
  }
  return result
}

/**
 * Builds a deterministic run id from scenario ref and seed hash.
 */
function createDeterministicRunId(scenarioBundle: ScenarioBundle, seed: string): string {
  const scenarioKey = versionRefKey({
    id: scenarioBundle.scenario.id,
    version: scenarioBundle.scenario.version
  })

  return `run__${scenarioKey}__${hashSeed(seed).toString(36)}`
}

/**
 * Creates deterministic timestamp derived from seed.
 */
function createDeterministicTimestamp(seed: string): string {
  const secondsSinceEpoch = hashSeed(seed)
  return new Date(secondsSinceEpoch * 1000).toISOString()
}

/**
 * Applies challenge-modifier score adjustments with score clamping.
 */
function applyScoreAdjustments(
  scores: ScoreSnapshot,
  adjustments: Record<string, number>
): ScoreSnapshot {
  const result: ScoreSnapshot = { ...scores }
  for (const [scoreId, adjustment] of Object.entries(adjustments)) {
    if (scoreId in result) {
      result[scoreId] = Math.max(0, Math.min(100, result[scoreId] + adjustment))
    }
  }
  return result
}

/**
 * Optional inputs for run creation.
 */
export interface CreateRunOptions {
  challenge_modifier?: ChallengeModifier
}

/**
 * Creates deterministic initial run state from scenario content and seed.
 */
export function createRun(scenarioBundle: ScenarioBundle, seed: string, options?: CreateRunOptions): GameState {
  const variance = scenarioBundle.scenario.score_variance ?? 0
  let startingScores = variance > 0
    ? applyScoreVariance(scenarioBundle.scenario.starting_scores, variance, seed)
    : { ...scenarioBundle.scenario.starting_scores }

  let maxTurns = scenarioBundle.scenario.max_turns
  let stakeholderSatisfactionOverride: number | undefined

  if (options?.challenge_modifier) {
    const mod = options.challenge_modifier
    if (mod.score_adjustments) {
      startingScores = applyScoreAdjustments(startingScores, mod.score_adjustments)
    }
    if (mod.turn_adjustment) {
      maxTurns = Math.max(1, maxTurns + mod.turn_adjustment)
    }
    if (mod.stakeholder_satisfaction_override != null) {
      stakeholderSatisfactionOverride = mod.stakeholder_satisfaction_override
    }
  }

  const input: CreateInitialGameStateInput = {
    run_id: createDeterministicRunId(scenarioBundle, seed),
    seed,
    scenario_ref: toVersionedContentRef(scenarioBundle.scenario),
    max_turns: maxTurns,
    starting_scores: startingScores,
    stakeholder_refs: scenarioBundle.scenario.stakeholder_refs.map(toVersionedContentRef),
    available_action_refs: scenarioBundle.scenario.card_refs.map(toVersionedContentRef),
    available_event_refs: scenarioBundle.scenario.event_refs.map(toVersionedContentRef),
    created_at_utc: createDeterministicTimestamp(seed),
    stakeholder_satisfaction_override: stakeholderSatisfactionOverride
  }

  return createInitialGameState(input)
}
