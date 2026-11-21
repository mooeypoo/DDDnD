/**
 * Pack Bundle File (`.dddnd-pack.json`)
 *
 * A whole pack in one JSON document, for loading without hosting (drag a file
 * into the game), for Pack Studio export, and for local caching. The game
 * never unzips anything; this is its only file import format (ADR 0005).
 *
 * ```json
 * {
 *   "format": "dddnd-pack",
 *   "format_version": 1,
 *   "manifest": { ...manifest.json... },
 *   "files": { "cards/my_card-v1.json": { ...card... }, ... }
 * }
 * ```
 *
 * A bundle goes through exactly the same snapshot validation as a pack loaded
 * from GitHub, and gets the same content hash for the same content.
 */

import type { PackOrigin, PackSnapshot } from '../model/pack_snapshot'
import { CONTENT_LIMITS } from '../validation/content_limits'
import { buildPackSnapshot, inventoryPaths, PackLoadError } from './pack_snapshot_builder'

export const PACK_BUNDLE_FORMAT = 'dddnd-pack'
export const PACK_BUNDLE_FORMAT_VERSION = 1
export const PACK_BUNDLE_EXTENSION = '.dddnd-pack.json'

/** Serialized bundle shape. */
export interface PackBundleFile {
  format: typeof PACK_BUNDLE_FORMAT
  format_version: number
  manifest: unknown
  files: Record<string, unknown>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Reads a bundle file's text into a validated snapshot.
 *
 * The byte limit allows the whole pack plus the bundle wrapper. Throws
 * PackLoadError ('manifest' for wrapper problems, otherwise the builder's stages).
 */
export async function readPackBundle(text: string, fileName: string): Promise<PackSnapshot> {
  const bytes = new TextEncoder().encode(text).byteLength
  const limit = CONTENT_LIMITS.max_pack_bytes + CONTENT_LIMITS.max_manifest_bytes
  if (bytes > limit) {
    throw new PackLoadError('manifest', [{ file: fileName, message: `is ${bytes} bytes; a pack file may be at most ${limit}` }])
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new PackLoadError('manifest', [{ file: fileName, message: 'is not valid JSON' }])
  }

  if (!isPlainObject(parsed) || parsed.format !== PACK_BUNDLE_FORMAT) {
    throw new PackLoadError('manifest', [{ file: fileName, message: `is not a DDDnD pack file (expected "format": "${PACK_BUNDLE_FORMAT}")` }])
  }
  if (typeof parsed.format_version !== 'number' || parsed.format_version > PACK_BUNDLE_FORMAT_VERSION) {
    throw new PackLoadError('manifest', [{
      file: fileName,
      message: `uses pack file format ${String(parsed.format_version)}, but this version of DDDnD reads up to ${PACK_BUNDLE_FORMAT_VERSION}. Update DDDnD to load it.`,
    }])
  }
  if (!isPlainObject(parsed.manifest) || !isPlainObject(parsed.files)) {
    throw new PackLoadError('manifest', [{ file: fileName, message: 'must contain a "manifest" object and a "files" object' }])
  }

  const files: Record<string, string> = {}
  for (const [path, value] of Object.entries(parsed.files)) {
    files[path] = JSON.stringify(value)
  }

  const origin: PackOrigin = { kind: 'file', file_name: fileName }
  return buildPackSnapshot({ manifest_text: JSON.stringify(parsed.manifest), files }, origin)
}

/**
 * Writes a snapshot as bundle text (pretty-printed, inventory order).
 */
export function writePackBundle(snapshot: PackSnapshot): string {
  const files: Record<string, unknown> = {}
  for (const path of inventoryPaths(snapshot.manifest)) {
    files[path] = snapshot.entities[path]
  }
  const bundle: PackBundleFile = {
    format: PACK_BUNDLE_FORMAT,
    format_version: PACK_BUNDLE_FORMAT_VERSION,
    manifest: snapshot.manifest,
    files,
  }
  return `${JSON.stringify(bundle, null, 2)}\n`
}
