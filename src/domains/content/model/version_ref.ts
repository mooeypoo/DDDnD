/**
 * Version Reference
 * 
 * Represents a reference to a versioned content entity.
 * Used throughout content files to reference other content.
 * The pair id+version is the canonical cross-file identity.
 */

export interface VersionRef {
  id: string
  version: number
}

/**
 * Creates a string key from a version reference.
 * Used for lookups and deduplication.
 */
export function versionRefKey(ref: VersionRef): string {
  return `${ref.id}-v${ref.version}`
}

/**
 * Parses a filename into id and version.
 * Filename format: <id>-v<version>.json
 * 
 * Returns null if filename doesn't match expected format.
 * Parsing does not validate that the referenced content actually exists.
 */
export function parseFilename(filename: string): VersionRef | null {
  const match = filename.match(/^(.+)-v(\d+)\.json$/)
  if (!match) {
    return null
  }
  return {
    id: match[1],
    version: parseInt(match[2], 10)
  }
}
