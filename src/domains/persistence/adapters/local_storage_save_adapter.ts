import { createPersistenceError } from '../services/persistence_error'
import { err, ok, PersistenceResult } from '../services/persistence_result'

export const DEFAULT_SAVE_STORAGE_KEY = 'dddnd.mvp.save_file'

export interface LocalStorageSaveAdapter {
  save_serialized_save_file(serialized_save_file: string): PersistenceResult<void>
  load_serialized_save_file(): PersistenceResult<string | null>
  clear_saved_run(): PersistenceResult<void>
}

interface CreateLocalStorageSaveAdapterInput {
  storage_key?: string
  storage?: Storage
}

function getStorage(storage: Storage | undefined): PersistenceResult<Storage> {
  if (storage) {
    return ok(storage)
  }

  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return err(
      createPersistenceError(
        'storage_unavailable',
        'localStorage is not available in the current runtime environment'
      )
    )
  }

  return ok(globalThis.localStorage)
}

export function create_local_storage_save_adapter(
  input: CreateLocalStorageSaveAdapterInput = {}
): LocalStorageSaveAdapter {
  const storage_key = input.storage_key ?? DEFAULT_SAVE_STORAGE_KEY

  return {
    save_serialized_save_file(serialized_save_file: string): PersistenceResult<void> {
      if (typeof serialized_save_file !== 'string' || serialized_save_file.length === 0) {
        return err(
          createPersistenceError(
            'invalid_input',
            'serialized_save_file must be a non-empty JSON string',
            'serialized_save_file'
          )
        )
      }

      const storageResult = getStorage(input.storage)
      if (!storageResult.ok) {
        return storageResult
      }

      try {
        storageResult.value.setItem(storage_key, serialized_save_file)
        return ok(undefined)
      } catch {
        return err(
          createPersistenceError(
            'storage_write_failed',
            `Failed to persist save file to localStorage key "${storage_key}"`
          )
        )
      }
    },

    load_serialized_save_file(): PersistenceResult<string | null> {
      const storageResult = getStorage(input.storage)
      if (!storageResult.ok) {
        return storageResult
      }

      try {
        return ok(storageResult.value.getItem(storage_key))
      } catch {
        return err(
          createPersistenceError(
            'storage_read_failed',
            `Failed to read save file from localStorage key "${storage_key}"`
          )
        )
      }
    },

    clear_saved_run(): PersistenceResult<void> {
      const storageResult = getStorage(input.storage)
      if (!storageResult.ok) {
        return storageResult
      }

      try {
        storageResult.value.removeItem(storage_key)
        return ok(undefined)
      } catch {
        return err(
          createPersistenceError(
            'storage_clear_failed',
            `Failed to clear save file from localStorage key "${storage_key}"`
          )
        )
      }
    }
  }
}

export const createLocalStorageSaveAdapter = create_local_storage_save_adapter
