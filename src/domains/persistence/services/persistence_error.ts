export type PersistenceErrorCode =
  | 'invalid_input'
  | 'invalid_export_type'
  | 'unsupported_format_version'
  | 'malformed_export'
  | 'missing_required_field'
  | 'invalid_content_reference'
  | 'storage_unavailable'
  | 'storage_write_failed'
  | 'storage_read_failed'
  | 'storage_clear_failed'

export interface PersistenceError {
  code: PersistenceErrorCode
  message: string
  path?: string
}

export function createPersistenceError(
  code: PersistenceErrorCode,
  message: string,
  path?: string
): PersistenceError {
  return {
    code,
    message,
    path
  }
}
