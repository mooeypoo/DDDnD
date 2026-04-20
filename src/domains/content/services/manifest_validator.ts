import validateSpdx from 'spdx-expression-validate'
import type { ContentPackInventory, ContentPackManifest } from '../model/content_pack_manifest'
import type { VersionRef } from '../model/version_ref'

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

const INVENTORY_KEYS: Array<keyof ContentPackInventory> = [
  'scenarios',
  'cards',
  'stakeholders',
  'stakeholder_reaction_rules',
  'scores',
  'events',
  'delayed_effects',
  'outcome_tiers',
  'outcome_archetypes',
  'classes',
  'challenge_modifiers',
]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isVersionRef(value: unknown): value is VersionRef {
  if (!isObject(value)) {
    return false
  }

  const id = value.id
  const version = value.version

  return hasNonEmptyString(id) && typeof version === 'number' && Number.isInteger(version) && version > 0
}

/**
 * Validates manifest shape and field-level constraints.
 *
 * This function performs structural checks only and does not load referenced files.
 */
export function validateContentPackManifest(input: unknown): ManifestValidationResult {
  const errors: ManifestValidationError[] = []

  if (!isObject(input)) {
    return {
      valid: false,
      errors: [{ field: 'manifest', message: 'Manifest must be an object' }],
    }
  }

  if (!hasNonEmptyString(input.id)) {
    errors.push({ field: 'id', message: 'id is required and must be a non-empty string' })
  }

  if (!hasNonEmptyString(input.version)) {
    errors.push({ field: 'version', message: 'version is required and must be a non-empty string' })
  }

  if (!hasNonEmptyString(input.name)) {
    errors.push({ field: 'name', message: 'name is required and must be a non-empty string' })
  }

  if (!hasNonEmptyString(input.description)) {
    errors.push({ field: 'description', message: 'description is required and must be a non-empty string' })
  }

  if (!hasNonEmptyString(input.base_url)) {
    errors.push({ field: 'base_url', message: 'base_url is required and must be a non-empty string' })
  }

  if (!hasNonEmptyString(input.license)) {
    errors.push({ field: 'license', message: 'license is required and must be a non-empty string' })
  } else if (!validateSpdx(input.license)) {
    errors.push({ field: 'license', message: 'license must be a valid SPDX expression' })
  }

  if (!Array.isArray(input.depends_on)) {
    errors.push({ field: 'depends_on', message: 'depends_on is required and must be an array' })
  } else {
    input.depends_on.forEach((dependency, index) => {
      if (!isObject(dependency) || !hasNonEmptyString(dependency.pack_id) || !hasNonEmptyString(dependency.version)) {
        errors.push({
          field: `depends_on[${index}]`,
          message: 'dependency must contain non-empty pack_id and version strings',
        })
      }
    })
  }

  if (!Array.isArray(input.authors) || input.authors.length === 0) {
    errors.push({ field: 'authors', message: 'authors is required and must be a non-empty array' })
  } else {
    input.authors.forEach((author, index) => {
      if (!isObject(author) || !hasNonEmptyString(author.name)) {
        errors.push({
          field: `authors[${index}].name`,
          message: 'author name is required and must be a non-empty string',
        })
      }

      if (isObject(author) && author.url !== undefined && typeof author.url !== 'string') {
        errors.push({
          field: `authors[${index}].url`,
          message: 'author url must be a string when present',
        })
      }
    })
  }

  const entryPointFields: Array<keyof Pick<ContentPackManifest, 'scenarios' | 'classes' | 'challenge_modifiers' | 'tutorials'>> = [
    'scenarios',
    'classes',
    'challenge_modifiers',
    'tutorials',
  ]

  entryPointFields.forEach((field) => {
    const refs = input[field]
    if (!Array.isArray(refs)) {
      errors.push({ field, message: `${field} is required and must be an array` })
      return
    }

    refs.forEach((ref, index) => {
      if (!isVersionRef(ref)) {
        errors.push({
          field: `${field}[${index}]`,
          message: `${field} entries must contain valid id/version references`,
        })
      }
    })
  })

  if (input.pack_homepage_url !== undefined && typeof input.pack_homepage_url !== 'string') {
    errors.push({ field: 'pack_homepage_url', message: 'pack_homepage_url must be a string when present' })
  }

  if (input.tutorial_base_url !== undefined && typeof input.tutorial_base_url !== 'string') {
    errors.push({ field: 'tutorial_base_url', message: 'tutorial_base_url must be a string when present' })
  }

  if (!isObject(input.content)) {
    errors.push({ field: 'content', message: 'content is required and must be an object' })
  } else {
    const content = input.content as Record<string, unknown>

    INVENTORY_KEYS.forEach((key) => {
      const value = content[key]
      if (!Array.isArray(value)) {
        errors.push({ field: `content.${key}`, message: `${key} must be an array of filenames` })
        return
      }

      value.forEach((filename, index) => {
        if (!hasNonEmptyString(filename) || !filename.endsWith('.json')) {
          errors.push({
            field: `content.${key}[${index}]`,
            message: 'inventory entries must be non-empty .json filenames',
          })
        }
      })
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
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
