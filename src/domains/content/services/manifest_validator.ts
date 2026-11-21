import type { ContentPackManifest } from '../model/content_pack_manifest'
import { toSchemaIssues } from '../validation/content_entity_parser'
import { manifestRuleIssues, manifestShapeSchema } from '../validation/manifest_schema'
import { CURRENT_PACK_SCHEMA_VERSION } from '../validation/pack_policy'

/**
 * Validation error entry for one manifest field.
 */
export interface ManifestValidationError {
  field: string
  message: string
}

/**
 * Result of manifest validation.
 */
export interface ManifestValidationResult {
  valid: boolean
  errors: ManifestValidationError[]
}

/**
 * Checks `schema_version` before anything else.
 *
 * A pack written for a newer format may use fields this game has never heard
 * of. Reporting "unknown field" for each of them would be confusing; one clear
 * "needs a newer DDDnD" message is what the player and author need.
 */
function schemaVersionError(input: unknown): ManifestValidationError | null {
  if (typeof input !== 'object' || input === null) {
    return null
  }
  const declared = (input as Record<string, unknown>).schema_version
  if (typeof declared === 'number' && Number.isInteger(declared) && declared > CURRENT_PACK_SCHEMA_VERSION) {
    return {
      field: 'schema_version',
      message: `this pack uses pack format ${declared}, but this version of DDDnD supports up to ${CURRENT_PACK_SCHEMA_VERSION}. Update DDDnD to load it.`,
    }
  }
  return null
}

/**
 * Validates manifest shape and pack-level rules (ADR 0001, ADR 0004).
 *
 * This does not load referenced files. Field paths use the same dotted format
 * as content errors (for example `authors[0].url`).
 */
export function validateContentPackManifest(input: unknown): ManifestValidationResult {
  const versionError = schemaVersionError(input)
  if (versionError) {
    return { valid: false, errors: [versionError] }
  }

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, errors: [{ field: 'manifest', message: 'manifest must be an object' }] }
  }

  const result = manifestShapeSchema.safeParse(input)
  if (!result.success) {
    return {
      valid: false,
      errors: toSchemaIssues(result.error, input).map((issue) => ({
        field: issue.path || 'manifest',
        message: issue.message,
      })),
    }
  }

  const ruleErrors = manifestRuleIssues(result.data).map((issue) => ({ field: issue.path, message: issue.message }))
  return { valid: ruleErrors.length === 0, errors: ruleErrors }
}

/**
 * Asserts manifest validity and narrows input to ContentPackManifest.
 * Throws with combined field-level details when invalid.
 */
export function assertValidContentPackManifest(input: unknown): asserts input is ContentPackManifest {
  const validation = validateContentPackManifest(input)
  if (validation.valid) {
    return
  }

  const details = validation.errors.map((error) => `${error.field}: ${error.message}`).join('; ')
  throw new Error(`Invalid content pack manifest: ${details}`)
}
