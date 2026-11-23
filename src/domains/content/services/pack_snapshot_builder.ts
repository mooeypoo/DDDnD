/**
 * Pack Snapshot Builder
 *
 * Turns a pack's raw text files into a validated `PackSnapshot`, and serves a
 * snapshot to the rest of the game as an ordinary ContentProvider.
 *
 * This is the shared middle of every community-pack path: the remote loader
 * feeds it files fetched from GitHub, the bundle-file import feeds it files
 * from a `.dddnd-pack.json`, and a cached copy is rebuilt through it too.
 * One validation, whatever the source.
 */

import type { ContentInventoryKey, ContentPackManifest } from '../model/content_pack_manifest'
import type { ContentMetadata } from '../model/content_types'
import type { PackOrigin, PackSnapshot } from '../model/pack_snapshot'
import type { VersionRef } from '../model/version_ref'
import { parseFilename, versionRefKey } from '../model/version_ref'
import { CONTENT_LIMITS } from '../validation/content_limits'
import { ContentSchemaError, parseContentEntity } from '../validation/content_entity_parser'
import type { ContentProvider, ContentType } from './content_provider'
import { ContentNotFoundError } from './content_provider'
import { validateContentPackManifest } from './manifest_validator'
import { communityManifestIssues } from './pack_identity'

/** Inventory section → content folder. */
export const CONTENT_TYPE_BY_SECTION: Record<ContentInventoryKey, ContentType> = {
  scenarios: 'scenarios',
  cards: 'cards',
  stakeholders: 'stakeholders',
  stakeholder_reaction_rules: 'stakeholder-reaction-rules',
  scores: 'scores',
  events: 'events',
  delayed_effects: 'delayed-effects',
  outcome_tiers: 'outcome-tiers',
  outcome_archetypes: 'outcome-archetypes',
  coupling_rules: 'coupling-rules',
  classes: 'classes',
  challenge_modifiers: 'challenge-modifiers',
}

/**
 * A pack as raw text: the manifest and each content file keyed by its path
 * inside the pack (`cards/split_refunds-v1.json`).
 */
export interface RawPackFiles {
  manifest_text: string
  files: Record<string, string>
}

/** One problem found while building a snapshot. */
export interface PackIssue {
  /** File inside the pack (`manifest.json`, `cards/x-v1.json`), or `pack`. */
  file: string
  message: string
}

/**
 * Thrown when a pack cannot be loaded. Carries every issue found, so an
 * author sees the whole list at once.
 */
export class PackLoadError extends Error {
  constructor(
    public stage: 'source' | 'manifest' | 'fetch' | 'content',
    public issues: PackIssue[],
  ) {
    super(`Pack could not be loaded (${stage}): ${issues.map((issue) => `${issue.file}: ${issue.message}`).join('; ')}`)
    this.name = 'PackLoadError'
  }
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength
}

/**
 * Lists every content file path a manifest's inventory declares.
 */
export function inventoryPaths(manifest: ContentPackManifest): string[] {
  return (Object.keys(CONTENT_TYPE_BY_SECTION) as ContentInventoryKey[]).flatMap((section) =>
    (manifest.content[section] ?? []).map((filename) => `${CONTENT_TYPE_BY_SECTION[section]}/${filename}`),
  )
}

/**
 * Parses and validates a manifest's text. Throws PackLoadError('manifest').
 */
export function parseManifestText(manifestText: string): ContentPackManifest {
  if (byteLength(manifestText) > CONTENT_LIMITS.max_manifest_bytes) {
    throw new PackLoadError('manifest', [{ file: 'manifest.json', message: `is larger than ${CONTENT_LIMITS.max_manifest_bytes} bytes` }])
  }
  let raw: unknown
  try {
    raw = JSON.parse(manifestText) as unknown
  } catch {
    throw new PackLoadError('manifest', [{ file: 'manifest.json', message: 'is not valid JSON' }])
  }
  const result = validateContentPackManifest(raw)
  if (!result.valid) {
    throw new PackLoadError('manifest', result.errors.map((error) => ({ file: 'manifest.json', message: `${error.field}: ${error.message}` })))
  }
  const manifest = raw as ContentPackManifest
  // Every community pack passes here (URL, file, bundle script); first-party packs don't.
  const identityIssues = communityManifestIssues(manifest)
  if (identityIssues.length > 0) {
    throw new PackLoadError('manifest', identityIssues)
  }
  return manifest
}

/** JSON with object keys sorted at every level, so key order never matters. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Canonical text for hashing: the parsed JSON with keys sorted and no
 * whitespace, and a top-level `$schema` editor link removed. Formatting, key
 * order, and editor metadata never change a pack's identity; content does.
 */
function canonicalJson(text: string): string {
  const value = JSON.parse(text) as unknown
  if (value && typeof value === 'object' && !Array.isArray(value) && '$schema' in value) {
    const { $schema: _schemaLink, ...rest } = value as Record<string, unknown>
    return stableStringify(rest)
  }
  return stableStringify(value)
}

/**
 * SHA-256 identifying a pack's content: the manifest and every file in
 * canonical form, path-sorted and length-prefixed. The same pack loaded from
 * GitHub or from a bundle file gets the same hash.
 *
 * Call only on files that already parsed as JSON.
 */
export async function computePackContentHash(raw: RawPackFiles): Promise<string> {
  const entry = (path: string, text: string) => {
    const canonical = canonicalJson(text)
    return `${path}\n${canonical.length}\n${canonical}`
  }
  const parts = [entry('manifest.json', raw.manifest_text)]
  for (const path of Object.keys(raw.files).sort()) {
    parts.push(entry(path, raw.files[path]))
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\n')))
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `sha256:${hex}`
}

/**
 * Validates a complete pack and returns its snapshot.
 *
 * Checks, collecting every issue before failing:
 * - the manifest (schema and pack rules)
 * - every inventory file is present, and no unlisted files are included
 * - total and per-file size limits
 * - each file against its content schema, with filename/id/version agreement
 */
export async function buildPackSnapshot(raw: RawPackFiles, origin: PackOrigin): Promise<PackSnapshot> {
  const manifest = parseManifestText(raw.manifest_text)
  const issues: PackIssue[] = []
  const expected = inventoryPaths(manifest)
  const expectedSet = new Set(expected)

  for (const path of Object.keys(raw.files)) {
    if (!expectedSet.has(path)) {
      issues.push({ file: path, message: 'is not listed in the manifest inventory' })
    }
  }

  const totalBytes = byteLength(raw.manifest_text) + Object.values(raw.files).reduce((sum, text) => sum + byteLength(text), 0)
  if (totalBytes > CONTENT_LIMITS.max_pack_bytes) {
    issues.push({ file: 'pack', message: `is ${totalBytes} bytes; a pack may be at most ${CONTENT_LIMITS.max_pack_bytes}` })
  }

  const entities: Record<string, ContentMetadata> = {}
  for (const path of expected) {
    const text = raw.files[path]
    if (text === undefined) {
      issues.push({ file: path, message: 'is listed in the inventory but missing' })
      continue
    }
    if (byteLength(text) > CONTENT_LIMITS.max_file_bytes) {
      issues.push({ file: path, message: `is larger than ${CONTENT_LIMITS.max_file_bytes} bytes` })
      continue
    }
    const [folder, filename] = path.split('/') as [ContentType, string]
    const ref = parseFilename(filename) as VersionRef
    let value: unknown
    try {
      value = JSON.parse(text) as unknown
    } catch {
      issues.push({ file: path, message: 'is not valid JSON' })
      continue
    }
    try {
      const entity = parseContentEntity(folder, ref, value)
      if (entity.id !== ref.id || entity.version !== ref.version) {
        issues.push({ file: path, message: `declares id "${entity.id}" version ${entity.version}, which does not match its filename` })
        continue
      }
      entities[path] = entity
    } catch (error) {
      if (error instanceof ContentSchemaError) {
        issues.push(...error.issues.map((issue) => ({ file: path, message: `${issue.path || '(file)'}: ${issue.message}` })))
      } else {
        throw error
      }
    }
  }

  if (issues.length > 0) {
    throw new PackLoadError('content', issues)
  }

  return {
    manifest,
    entities,
    content_hash: await computePackContentHash(raw),
    origin,
  }
}

/**
 * Serves a snapshot as a ContentProvider, so it registers in the
 * ContentPackRegistry like any other pack. Nothing is fetched after loading.
 */
export function createSnapshotContentProvider(snapshot: PackSnapshot): ContentProvider {
  function load<T>(contentType: ContentType, ref: VersionRef): Promise<T> {
    const entity = snapshot.entities[`${contentType}/${versionRefKey(ref)}.json`]
    if (!entity) {
      return Promise.reject(new ContentNotFoundError(contentType, ref))
    }
    return Promise.resolve(entity as T)
  }

  return {
    loadScenario: (ref) => load('scenarios', ref),
    loadScore: (ref) => load('scores', ref),
    loadStakeholder: (ref) => load('stakeholders', ref),
    loadStakeholderReactionRule: (ref) => load('stakeholder-reaction-rules', ref),
    loadCard: (ref) => load('cards', ref),
    loadEvent: (ref) => load('events', ref),
    loadDelayedEffect: (ref) => load('delayed-effects', ref),
    loadOutcomeTier: (ref) => load('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => load('outcome-archetypes', ref),
    loadCouplingRule: (ref) => load('coupling-rules', ref),
    loadPlayerClass: (ref) => load('classes', ref),
    loadChallengeModifier: (ref) => load('challenge-modifiers', ref),
  }
}
