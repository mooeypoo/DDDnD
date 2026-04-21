/**
 * Simulation Engine
 * 
 * Core game engine that orchestrates turn resolution and game state evolution.
 * 
 * The engine is PURE and DETERMINISTIC:
 * - No Vue imports
 * - No Pinia imports
 * - No browser APIs
 * - No localStorage
 * - No DOM access
 * 
 * The engine depends only on:
 * - scenario_bundle (validated content)
 * - game_state (current run state)
 * - seeded random (for deterministic randomness)
 * 
 * API surface:
 * - createRun(): Initialize a new game state
 * - getTurnBriefing(): Get current turn info for UI
 * - playTurn(actionId): Resolve a turn with player action
 * - getRunOutcome(): Determine final outcome of completed run
 */

import { ScenarioBundle } from '@/domains/content/model'
import { createSeededRandom, SeededRandom } from '@/shared/random/seeded_random'
import { GameState } from '../model'
import { createRun, CreateRunOptions } from './create_run'
import { RunOutcome, getRunOutcome } from './get_run_outcome'
import { TurnBriefing, getTurnBriefing } from './get_turn_briefing'
import { PlayTurnResult, playTurn } from './play_turn'

export interface CreateEngineInput {
  scenario_bundle: ScenarioBundle
  seed?: string
}

/**
 * Internal mutable container for one engine instance.
 */
interface EngineStateContainer {
  scenario_bundle: ScenarioBundle
  seed: string
  random: SeededRandom
  game_state: GameState | null
}

/**
 * Public simulation engine API.
 */
export interface SimulationEngine {
  create_run(options?: CreateRunOptions): GameState
  restore_run(game_state: GameState): GameState
  get_turn_briefing(): TurnBriefing
  play_turn(action_id: string): PlayTurnResult
  get_run_outcome(): RunOutcome | null
}

/**
 * Returns the active run state or throws when no run exists.
 */
function getActiveGameState(engineState: EngineStateContainer): GameState {
  if (!engineState.game_state) {
    throw new Error('Run has not been initialized. Call create_run() first.')
  }

  return engineState.game_state
}

/**
 * Creates a deterministic simulation engine bound to one scenario bundle.
 */
export function create_engine(input: CreateEngineInput): SimulationEngine {
  if (!input.scenario_bundle) {
    throw new Error('create_engine requires a scenario_bundle')
  }

  const seed = input.seed ?? 'default-seed'
  const engineState: EngineStateContainer = {
    scenario_bundle: input.scenario_bundle,
    seed,
    random: createSeededRandom(seed),
    game_state: null
  }

  return {
    create_run: (options?: CreateRunOptions) => {
      engineState.game_state = createRun(engineState.scenario_bundle, engineState.seed, options)
      return engineState.game_state
    },

    restore_run: (game_state: GameState) => {
      engineState.game_state = game_state
      return engineState.game_state
    },

    get_turn_briefing: () => {
      return getTurnBriefing(getActiveGameState(engineState), engineState.scenario_bundle)
    },

    play_turn: (action_id: string) => {
      const result = playTurn(
        getActiveGameState(engineState),
        engineState.scenario_bundle,
        action_id,
        engineState.random
      )

      engineState.game_state = result.game_state
      return result
    },

    get_run_outcome: () => {
      return getRunOutcome(getActiveGameState(engineState), engineState.scenario_bundle)
    }
  }
}

export function createEngine(
  scenarioBundle: ScenarioBundle,
  seed?: string
): SimulationEngine {
  return create_engine({
    scenario_bundle: scenarioBundle,
    seed
  })
}
