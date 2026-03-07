import { PersistenceError } from './persistence_error'

export type PersistenceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PersistenceError }

export function ok<T>(value: T): PersistenceResult<T> {
  return { ok: true, value }
}

export function err<T = never>(error: PersistenceError): PersistenceResult<T> {
  return { ok: false, error }
}
