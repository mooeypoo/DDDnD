import { GameState } from '@/domains/simulation/model'
import { RunStatus, VersionedContentRef } from '@/shared/contracts'

export const EXACT_RUN_EXPORT_TYPE = 'exact_run' as const
export const EXACT_RUN_FORMAT_VERSION = 1 as const

export interface ExactRunSeedInfo {
  seed: string
  run_id: string
  created_at_utc: string
  last_updated_at: string
  content_pack_version?: string
}

export interface ExactRunOutcomeSnapshot {
  run_status: RunStatus
  turns_completed: number
  max_turns: number
  final_turn_number: number | null
  is_completed: boolean
  score_average: number | null
}

export interface ExactRunExport {
  export_type: typeof EXACT_RUN_EXPORT_TYPE
  format_version: typeof EXACT_RUN_FORMAT_VERSION
  exported_at: string
  scenario_ref: VersionedContentRef
  seed_info: ExactRunSeedInfo
  player_profile: GameState['player_profile']
  action_sequence: VersionedContentRef[]
  turn_history: GameState['history']
  outcome_snapshot: ExactRunOutcomeSnapshot
  game_state: GameState
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function computeScoreAverage(scores: Record<string, number>): number | null {
  const scoreValues = Object.values(scores)
  if (scoreValues.length === 0) {
    return null
  }

  const total = scoreValues.reduce((sum, value) => sum + value, 0)
  return total / scoreValues.length
}

function buildOutcomeSnapshot(gameState: GameState): ExactRunOutcomeSnapshot {
  const isCompleted = gameState.progress.run_status !== 'in_progress'
  const lastHistoryEntry = gameState.history.at(-1)

  return {
    run_status: gameState.progress.run_status,
    turns_completed: gameState.run_analytics.turns_completed,
    max_turns: gameState.progress.max_turns,
    final_turn_number: lastHistoryEntry?.turn_number ?? null,
    is_completed: isCompleted,
    score_average: computeScoreAverage(gameState.scores)
  }
}

export function serialize_exact_run(
  game_state: GameState,
  exported_at: string = new Date().toISOString()
): ExactRunExport {
  const actionSequence = game_state.history.map((entry) => entry.action_resolution.selected_action)

  return {
    export_type: EXACT_RUN_EXPORT_TYPE,
    format_version: EXACT_RUN_FORMAT_VERSION,
    exported_at,
    scenario_ref: cloneSerializable(game_state.scenario_ref),
    seed_info: {
      seed: game_state.meta.seed,
      run_id: game_state.meta.run_id,
      created_at_utc: game_state.meta.created_at_utc,
      last_updated_at: game_state.meta.last_updated_at,
      content_pack_version: game_state.meta.content_pack_version
    },
    player_profile: cloneSerializable(game_state.player_profile),
    action_sequence: cloneSerializable(actionSequence),
    turn_history: cloneSerializable(game_state.history),
    outcome_snapshot: buildOutcomeSnapshot(game_state),
    game_state: cloneSerializable(game_state)
  }
}

export const serializeExactRun = serialize_exact_run
