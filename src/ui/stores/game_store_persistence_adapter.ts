import type { GameState } from '@/domains/simulation'
import type { LocalStorageSaveAdapter } from '@/domains/persistence/adapters/local_storage_save_adapter'
import { serializeSaveFile, deserializeSaveFile } from '@/domains/persistence/services'

interface PersistenceAdapterDependencies {
  serialize?: typeof serializeSaveFile
  deserialize?: typeof deserializeSaveFile
}

/**
 * Isolates game-store persistence mechanics from run orchestration.
 *
 * Responsibilities:
 * - Serialize and persist a game state snapshot
 * - Load and validate a saved game state snapshot
 * - Clear invalid persisted payloads
 */
export function createGameStorePersistenceAdapter(
  saveAdapter: LocalStorageSaveAdapter,
  deps: PersistenceAdapterDependencies = {},
) {
  const serialize = deps.serialize ?? serializeSaveFile
  const deserialize = deps.deserialize ?? deserializeSaveFile

  function persistGameState(gameState: GameState | null): void {
    if (!gameState) {
      return
    }

    const payload = serialize(gameState)
    const serializedPayload = JSON.stringify(payload)
    saveAdapter.save_serialized_save_file(serializedPayload)
  }

  function loadRestorableGameState(): GameState | null {
    const loaded = saveAdapter.load_serialized_save_file()
    if (!loaded.ok || !loaded.value) {
      return null
    }

    let parsedPayload: unknown
    try {
      parsedPayload = JSON.parse(loaded.value)
    } catch {
      saveAdapter.clear_saved_run()
      return null
    }

    const restored = deserialize(parsedPayload)
    if (!restored.ok) {
      saveAdapter.clear_saved_run()
      return null
    }

    return restored.value.game_state
  }

  return {
    persistGameState,
    loadRestorableGameState,
  }
}
