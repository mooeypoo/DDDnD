import { GameState } from '@/domains/simulation/model'
import { createPersistenceError } from './persistence_error'
import { err, ok, PersistenceResult } from './persistence_result'
import {
  isGameState,
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isVersionedRef
} from './validation'
import {
  SAVE_FILE_EXPORT_TYPE,
  SAVE_FILE_FORMAT_VERSION,
  SaveFileExport
} from './serialize_save_file'

/**
 * Successful save-file deserialization payload.
 */
export interface DeserializeSaveFileSuccess {
  save_file: SaveFileExport
  game_state: GameState
}

/**
 * Validates scenario reference compatibility for restored game state.
 */
function validateScenarioRefCompatibility(gameState: GameState): PersistenceResult<void> {
  if (!isVersionedRef(gameState.scenario_ref)) {
    return err(
      createPersistenceError(
        'invalid_content_reference',
        'game_state.scenario_ref must include valid id and version references',
        'game_state.scenario_ref'
      )
    )
  }

  return ok(undefined)
}

/**
 * Validates and deserializes unknown input into save-file export payload.
 */
export function deserialize_save_file(input: unknown): PersistenceResult<DeserializeSaveFileSuccess> {
  if (!isRecord(input)) {
    return err(createPersistenceError('invalid_input', 'Save file payload must be an object'))
  }

  if (input.export_type !== SAVE_FILE_EXPORT_TYPE) {
    return err(
      createPersistenceError(
        'invalid_export_type',
        `Expected export_type "${SAVE_FILE_EXPORT_TYPE}"`,
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

  if (input.format_version !== SAVE_FILE_FORMAT_VERSION) {
    return err(
      createPersistenceError(
        'unsupported_format_version',
        `Unsupported save file format version: ${input.format_version}`,
        'format_version'
      )
    )
  }

  if (!('exported_at' in input) || !isNonEmptyString(input.exported_at)) {
    return err(
      createPersistenceError(
        'missing_required_field',
        'Save file must include exported_at as a non-empty string',
        'exported_at'
      )
    )
  }

  if (!('game_state' in input) || !isGameState(input.game_state)) {
    return err(
      createPersistenceError(
        'malformed_export',
        'Save file game_state is missing required runtime structure',
        'game_state'
      )
    )
  }

  const compatibilityValidation = validateScenarioRefCompatibility(input.game_state)
  if (!compatibilityValidation.ok) {
    return compatibilityValidation
  }

  const save_file: SaveFileExport = {
    export_type: SAVE_FILE_EXPORT_TYPE,
    format_version: SAVE_FILE_FORMAT_VERSION,
    exported_at: input.exported_at,
    game_state: input.game_state
  }

  return ok({
    save_file,
    game_state: input.game_state
  })
}

export const deserializeSaveFile = deserialize_save_file
