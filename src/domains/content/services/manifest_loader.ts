import type { ContentPackManifest } from '../model/content_pack_manifest'
import { assertValidContentPackManifest } from './manifest_validator'

/**
 * Error used for manifest fetch/parse/validation failures.
 */
export class ManifestLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ManifestLoadError'
  }
}

/**
 * Loads and validates a content pack manifest from a URL.
 *
 * Returns a typed manifest only after structural validation succeeds.
 */
export async function loadManifest(manifestUrl: string): Promise<ContentPackManifest> {
  let response: Response
  try {
    response = await fetch(manifestUrl)
  } catch {
    throw new ManifestLoadError(`Unable to fetch manifest: ${manifestUrl}`)
  }

  if (!response.ok) {
    throw new ManifestLoadError(`Unable to load manifest: ${manifestUrl} (status ${response.status})`)
  }

  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    throw new ManifestLoadError(`Manifest is not valid JSON: ${manifestUrl}`)
  }

  try {
    assertValidContentPackManifest(parsed)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    throw new ManifestLoadError(`Manifest validation failed for ${manifestUrl}: ${details}`)
  }

  return parsed
}
