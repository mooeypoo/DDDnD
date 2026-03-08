import { GameState } from '@/domains/simulation/model'
import { createPersistenceError } from './persistence_error'
import { err, ok, PersistenceResult } from './persistence_result'
import {
  isGameState,
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isTurnHistoryArray,
  isVersionedRef,
  isVersionedRefArray
} from './validation'
import {
  EXACT_RUN_EXPORT_TYPE,
  EXACT_RUN_FORMAT_VERSION,
  ExactRunExport,
  ExactRunOutcomeSnapshot,
  ExactRunSeedInfo
} from './serialize_exact_run'

function isSeedInfo(value: unknown): value is ExactRunSeedInfo {
  if (!isRecord(value)) {
    return false
  }

  if (
    !isNonEmptyString(value.seed) ||
    !isNonEmptyString(value.run_id) ||
    !isNonEmptyString(value.created_at_utc) ||
    !isNonEmptyString(value.last_updated_at)
  ) {
    return false
  }

  if (value.content_pack_version !== undefined && !isNonEmptyString(value.content_pack_version)) {
    return false
  }

  return true
}

function isOutcomeSnapshot(value: unknown): value is ExactRunOutcomeSnapshot {
  if (!isRecord(value)) {
    return false
  }

  const hasValidTier =
    value.tier === 'success' || value.tier === 'partial_success' || value.tier === 'failure'
  const hasValidArchetype = typeof value.archetype === 'string' && value.archetype.length > 0

  if (!hasValidTier || !hasValidArchetype) {
    return false
  }

  if (
    value.run_status !== 'in_progress' &&
    value.run_status !== 'completed_success' &&
    value.run_status !== 'completed_failure' &&
    value.run_status !== 'completed_max_turns'
  ) {
    return false
  }

  if (
    !isPositiveInteger(value.max_turns) ||
    typeof value.turns_completed !== 'number' ||
    value.turns_completed < 0 ||
    typeof value.is_completed !== 'boolean'
  ) {
    return false
  }

  const hasValidFinalTurn = value.final_turn_number === null || isPositiveInteger(value.final_turn_number)
  const hasValidAverage = value.score_average === null || typeof value.score_average === 'number'

  return hasValidFinalTurn && hasValidAverage
}

function validateScenarioRefCompatibility(gameState: GameState, scenarioRef: ExactRunExport['scenario_ref']) {
  if (gameState.scenario_ref.id !== scenarioRef.id || gameState.scenario_ref.version !== scenarioRef.version) {
    return err(
      createPersistenceError(
        'invalid_content_reference',
        'scenario_ref does not match game_state.scenario_ref',
        'scenario_ref'
      )
    )
  }

  return ok(undefined)
}

export function deserialize_exact_run(input: unknown): PersistenceResult<ExactRunExport> {
  if (!isRecord(input)) {
    return err(createPersistenceError('invalid_input', 'Exact run payload must be an object'))
  }

  if (input.export_type !== EXACT_RUN_EXPORT_TYPE) {
    return err(
      createPersistenceError(
        'invalid_export_type',
        `Expected export_type "${EXACT_RUN_EXPORT_TYPE}"`,
        'export_type'
      )
    )
  }

  if (!isPositiveInteger(input.format_version)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'format_version must be a positive integer',
        'format_version'
      )
    )
  }

  if (input.format_version !== EXACT_RUN_FORMAT_VERSION) {
    return err(
      createPersistenceError(
        'unsupported_format_version',
        `Unsupported exact run format version: ${input.format_version}`,
        'format_version'
      )
    )
  }

  if (!isNonEmptyString(input.exported_at)) {
    return err(
      createPersistenceError(
        'missing_required_field',
        'Exact run export must include exported_at as a non-empty string',
        'exported_at'
      )
    )
  }

  if (!isVersionedRef(input.scenario_ref)) {
    return err(
      createPersistenceError(
        'invalid_content_reference',
        'Exact run export must include a valid scenario_ref',
        'scenario_ref'
      )
    )
  }

  if (!isSeedInfo(input.seed_info)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Exact run export seed_info is malformed',
        'seed_info'
      )
    )
  }

  if (!isRecord(input.player_profile)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Exact run export player_profile must be an object',
        'player_profile'
      )
    )
  }

  if (!isVersionedRefArray(input.action_sequence)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Exact run export action_sequence must contain versioned content references',
        'action_sequence'
      )
    )
  }

  if (!isTurnHistoryArray(input.turn_history)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Exact run export turn_history is malformed',
        'turn_history'
      )
    )
  }

  if (!isOutcomeSnapshot(input.outcome_snapshot)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Exact run export outcome_snapshot is malformed',
        'outcome_snapshot'
      )
    )
  }

  if (!isGameState(input.game_state)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Exact run export game_state is missing required runtime structure',
        'game_state'
      )
    )
  }

  const compatibilityValidation = validateScenarioRefCompatibility(input.game_state, input.scenario_ref)
  if (!compatibilityValidation.ok) {
    return compatibilityValidation
  }

  const exactRun: ExactRunExport = {
    export_type: EXACT_RUN_EXPORT_TYPE,
    format_version: EXACT_RUN_FORMAT_VERSION,
    exported_at: input.exported_at,
    scenario_ref: input.scenario_ref,
    seed_info: input.seed_info,
    player_profile: input.player_profile,
    action_sequence: input.action_sequence,
    turn_history: input.turn_history,
    outcome_snapshot: input.outcome_snapshot,
    game_state: input.game_state
  }

  return ok(exactRun)
}

export const deserializeExactRun = deserialize_exact_run
