/**
 * Exporting and checking drafts (docs/PACK_STUDIO.md §4.1, D4).
 *
 * A draft becomes the same raw files a pack folder holds, and from there the
 * game's own code takes over: `buildPackSnapshot` (schemas, limits, identity
 * rules) and `checkPackPlayable` (scenarios build next to the base pack;
 * classes and modifiers fit). So "the Studio says it's fine" and "the game
 * imports it" are the same statement: there's no second validator to drift.
 */

import type { ContentPackManifest } from '../content/model/content_pack_manifest'
import type { PackSnapshot } from '../content/model/pack_snapshot'
import { parseFilename } from '../content/model/version_ref'
import { ContentPackRegistry } from '../content/services/content_pack_registry'
import type { ContentProvider } from '../content/services/content_provider'
import { writePackBundle, PACK_BUNDLE_EXTENSION } from '../content/services/pack_bundle_file'
import { packKeyOf } from '../content/services/pack_identity'
import { checkPackPlayable } from '../content/services/pack_playability_check'
import {
  buildPackSnapshot,
  CONTENT_TYPE_BY_SECTION,
  createSnapshotContentProvider,
  PackLoadError,
  type PackIssue,
  type RawPackFiles,
} from '../content/services/pack_snapshot_builder'
import { BASE_PACK_ID, CURRENT_PACK_SCHEMA_VERSION } from '../content/validation/pack_policy'
import { contentPrefix } from './content_ids'
import { DRAFT_LICENSE, DRAFT_SECTIONS, type DraftPack, type DraftSection } from './draft_pack'

/** Pack ids the game reserves for its own packs. */
const FIRST_PARTY_IDS = ['base', 'tutorial']

/** The pack's id: its prefix, kept off the ids that ship with the game. */
export function draftPackId(draft: DraftPack): string {
  const id = contentPrefix(draft.prefix) || 'pack'
  return FIRST_PARTY_IDS.includes(id) ? `${id}_pack` : id
}

function fileName(entity: { id: string; version: number }): string {
  return `${entity.id}-v${entity.version}.json`
}

function sortedEntities<S extends DraftSection>(draft: DraftPack, section: S) {
  return Object.values(draft.content[section]).sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version)
}

/**
 * The game a draft is exported for: the pack format this build of the game
 * reads, and the version of the base pack the draft was checked against.
 * Both come from the game's own code and content in this repository, so the
 * Studio can't fall behind the game it ships with.
 */
export interface GameTarget {
  schema_version: number
  base_version: string
}

/** The game the first-party packs describe. Every draft check and export runs against them. */
export function gameTarget(firstParty: readonly FirstPartyPack[]): GameTarget {
  const base = firstParty.find((pack) => pack.manifest.id === BASE_PACK_ID)
  if (!base) throw new Error('The base game is not loaded, so the Studio cannot tell which game a pack is for.')
  return { schema_version: CURRENT_PACK_SCHEMA_VERSION, base_version: base.manifest.version }
}

/**
 * Which base games accept a pack made for this target: the game resolves a
 * dependency with caret semantics, so the same major version, from this one on.
 */
export function compatibleBaseGames(target: GameTarget): { from: string; series: string } {
  return { from: target.base_version, series: `${target.base_version.split('.')[0]}.x` }
}

/** The manifest a draft exports with, for the game it was checked against. */
export function draftManifest(draft: DraftPack, target: GameTarget): ContentPackManifest {
  const refs = (section: 'scenarios' | 'classes' | 'challenge_modifiers') =>
    sortedEntities(draft, section).map(({ id, version }) => ({ id, version }))
  return {
    schema_version: target.schema_version,
    kind: 'extension',
    id: draftPackId(draft),
    version: draft.version,
    name: draft.name,
    description: draft.description,
    depends_on: [{ pack_id: BASE_PACK_ID, version: target.base_version }],
    base_url: '.',
    license: draft.license ?? DRAFT_LICENSE,
    authors: draft.authors,
    ...(draft.homepage_url ? { pack_homepage_url: draft.homepage_url } : {}),
    scenarios: refs('scenarios'),
    classes: refs('classes'),
    challenge_modifiers: refs('challenge_modifiers'),
    tutorials: [],
    content: Object.fromEntries(DRAFT_SECTIONS.map((section) => [section, sortedEntities(draft, section).map(fileName)])) as unknown as ContentPackManifest['content'],
  }
}

/** The draft as a pack folder's files: `manifest.json` and one file per entity, at its path. */
export function draftToRawPack(draft: DraftPack, target: GameTarget): RawPackFiles {
  const files: Record<string, string> = {}
  for (const section of DRAFT_SECTIONS) {
    for (const entity of sortedEntities(draft, section)) {
      files[`${CONTENT_TYPE_BY_SECTION[section]}/${fileName(entity)}`] = `${JSON.stringify(entity, null, 2)}\n`
    }
  }
  return { manifest_text: `${JSON.stringify(draftManifest(draft, target), null, 2)}\n`, files }
}

/** A first-party pack the draft is checked against: its manifest and where its files come from. */
export interface FirstPartyPack {
  manifest: ContentPackManifest
  provider: ContentProvider
}

export interface DraftCheck {
  /** Every reason the game would refuse the pack, or nothing. */
  issues: PackIssue[]
  /** The validated pack, when it got that far (playability issues can still remain). */
  snapshot?: PackSnapshot
}

/**
 * Checks a draft the way the game checks an import: the snapshot builder,
 * then playability next to the first-party packs (base, tutorial).
 */
export async function checkDraft(draft: DraftPack, firstParty: readonly FirstPartyPack[]): Promise<DraftCheck> {
  let snapshot: PackSnapshot
  try {
    snapshot = await buildPackSnapshot(draftToRawPack(draft, gameTarget(firstParty)), { kind: 'file', file_name: draftFileName(draft) })
  } catch (error) {
    if (error instanceof PackLoadError) return { issues: error.issues }
    throw error
  }

  const registry = new ContentPackRegistry()
  for (const pack of firstParty) registry.registerPack(pack.manifest, pack.provider)
  const key = packKeyOf(snapshot)
  try {
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
  } catch (error) {
    return { issues: [{ file: 'pack', message: (error as Error).message }], snapshot }
  }
  return { issues: await checkPackPlayable(registry, key), snapshot }
}

/** The download name for a draft's pack file. */
export function draftFileName(draft: DraftPack): string {
  return `${draftPackId(draft)}-v${draft.version}${PACK_BUNDLE_EXTENSION}`
}

/**
 * The `.dddnd-pack.json` text to download (D4), or the issues that stop it.
 * Only a pack the game would import can be exported.
 */
export async function exportDraftBundle(
  draft: DraftPack,
  firstParty: readonly FirstPartyPack[],
): Promise<{ ok: true; text: string; file_name: string } | { ok: false; issues: PackIssue[] }> {
  const check = await checkDraft(draft, firstParty)
  if (check.issues.length > 0 || !check.snapshot) return { ok: false, issues: check.issues }
  return { ok: true, text: writePackBundle(check.snapshot), file_name: draftFileName(draft) }
}

/** What a check's issue is about: the pack's details, or one piece of content. */
export type IssueSubject =
  | { kind: 'manifest' }
  | { kind: 'content'; section: DraftSection; ref: { id: string; version: number } }

/**
 * Reads an issue's file path (as the game's checks report it) back into what
 * it's about, using the same file layout the export writes. Null for issues
 * about the pack as a whole.
 */
export function issueSubject(file: string): IssueSubject | null {
  if (file === 'manifest.json') return { kind: 'manifest' }
  const slash = file.indexOf('/')
  if (slash < 0) return null
  const folder = file.slice(0, slash)
  const section = DRAFT_SECTIONS.find((candidate) => CONTENT_TYPE_BY_SECTION[candidate] === folder)
  const ref = parseFilename(file.slice(slash + 1))
  return section && ref ? { kind: 'content', section, ref } : null
}

/** One reason the game would refuse the pack, as its checks report it. */
export type { PackIssue }
