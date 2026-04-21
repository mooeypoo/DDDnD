import { PersistenceError } from './persistence_error'

/**
 * Result union for persistence operations.
 */
export type PersistenceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PersistenceError }

/**
 * Constructs a successful persistence result.
 */
export function ok<T>(value: T): PersistenceResult<T> {
  return { ok: true, value }
}

/**
 * Constructs a failed persistence result.
 */
export function err<T = never>(error: PersistenceError): PersistenceResult<T> {
  return { ok: false, error }
}
