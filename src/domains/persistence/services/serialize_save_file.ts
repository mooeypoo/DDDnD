import { GameState } from '@/domains/simulation/model'

export const SAVE_FILE_EXPORT_TYPE = 'save_file' as const
export const SAVE_FILE_FORMAT_VERSION = 1 as const

export interface SaveFileExport {
  export_type: typeof SAVE_FILE_EXPORT_TYPE
  format_version: typeof SAVE_FILE_FORMAT_VERSION
  exported_at: string
  game_state: GameState
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function serialize_save_file(
  game_state: GameState,
  exported_at: string = new Date().toISOString()
): SaveFileExport {
  return {
    export_type: SAVE_FILE_EXPORT_TYPE,
    format_version: SAVE_FILE_FORMAT_VERSION,
    exported_at,
    game_state: cloneSerializable(game_state)
  }
}

export const serializeSaveFile = serialize_save_file
