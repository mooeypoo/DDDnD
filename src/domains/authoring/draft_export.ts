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
import { JSON_SCHEMA_BASE_URL } from '../content/validation/json_schema_export'
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

/**
 * A section's content in the order a pack lists it: an imported pack's own
 * order (DraftPack.layout), then everything else by id. The order is part of
 * the pack's identity, so the same content always exports in the same order.
 */
function orderedEntities<S extends DraftSection>(draft: DraftPack, section: S, list: 'content' | 'entries' = 'content') {
  const order = (list === 'content' ? draft.layout?.content[section] : draft.layout?.entries[section as 'classes']) ?? []
  const place = (id: string) => {
    const index = order.indexOf(id)
    return index === -1 ? order.length : index
  }
  return Object.values(draft.content[section]).sort((a, b) => place(a.id) - place(b.id) || a.id.localeCompare(b.id) || a.version - b.version)
}

/**
 * The sections a manifest lists: every one for the Studio's own drafts; an
 * imported pack's own, in its order, and then any it has gained content in.
 */
function manifestSections(draft: DraftPack): DraftSection[] {
  if (!draft.layout) return [...DRAFT_SECTIONS]
  const listed = Object.keys(draft.layout.content) as DraftSection[]
  return [...listed, ...DRAFT_SECTIONS.filter((section) => !listed.includes(section) && Object.keys(draft.content[section]).length > 0)]
}

/** The schema a section's files follow, by its published name (card, coupling-rule, …). */
const SCHEMA_NAMES: Record<DraftSection, string> = {
  scenarios: 'scenario', stakeholders: 'stakeholder', stakeholder_reaction_rules: 'stakeholder-reaction-rule', cards: 'card', events: 'event',
  delayed_effects: 'delayed-effect', scores: 'score', outcome_tiers: 'outcome-tier', outcome_archetypes: 'outcome-archetype',
  coupling_rules: 'coupling-rule', classes: 'class', challenge_modifiers: 'challenge-modifier',
}

/**
 * A file as the packs repository writes them: its schema's link first, for
 * editors (the game ignores it), then the content. The official packs carry
 * it, so an imported pack's files keep it.
 */
function packFileText(schema: string, value: object): string {
  return `${JSON.stringify({ $schema: `${JSON_SCHEMA_BASE_URL}${schema}.schema.json`, ...value }, null, 2)}\n`
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
    orderedEntities(draft, section, 'entries').map(({ id, version }) => ({ id, version }))
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
    content: Object.fromEntries(manifestSections(draft).map((section) => [section, orderedEntities(draft, section).map(fileName)])) as unknown as ContentPackManifest['content'],
  }
}

/** The draft as a pack folder's files: `manifest.json` and one file per entity, at its path. */
export function draftToRawPack(draft: DraftPack, target: GameTarget): RawPackFiles {
  const files: Record<string, string> = {}
  for (const section of DRAFT_SECTIONS) {
    for (const entity of orderedEntities(draft, section)) {
      files[`${CONTENT_TYPE_BY_SECTION[section]}/${fileName(entity)}`] = packFileText(SCHEMA_NAMES[section], entity)
    }
  }
  return { manifest_text: packFileText('manifest', draftManifest(draft, target)), files }
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

/** Who a preview's pack is by, when the author hasn't added their name yet. */
export const PREVIEW_AUTHOR = 'Played from the Pack Studio'

/**
 * The pack "Play it" sends to the game (D15): the draft as it is now, with
 * the two things only an export needs filled in when missing (the author's
 * name, the pack's description), so an author can play before they finish
 * the details. Never exported: the draft itself doesn't change.
 */
export async function previewBundle(
  draft: DraftPack,
  firstParty: readonly FirstPartyPack[],
): Promise<{ ok: true; text: string } | { ok: false; issues: PackIssue[] }> {
  const named = draft.authors.some((author) => author.name.trim() !== '')
  const preview: DraftPack = {
    ...draft,
    authors: named ? draft.authors : [{ name: PREVIEW_AUTHOR }],
    description: draft.description.trim() || `A pack from the DDDnD Pack Studio: ${draft.name || 'untitled'}.`,
  }
  const exported = await exportDraftBundle(preview, firstParty)
  return exported.ok ? { ok: true, text: exported.text } : { ok: false, issues: exported.issues }
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

/** What the Studio calls each kind of content a check can be about. */
const ISSUE_PLACES: Partial<Record<DraftSection, string>> = {
  scenarios: 'Scenario',
  scores: 'Score',
  outcome_archetypes: 'Ending',
  outcome_tiers: 'Outcome tier',
  classes: 'Class',
  challenge_modifiers: 'Challenge modifier',
  coupling_rules: 'Coupling rule',
  cards: 'Card',
  events: 'Event',
  stakeholders: 'Council member',
  stakeholder_reaction_rules: 'Reaction',
  delayed_effects: 'Aftershock',
}

/**
 * A check's issue in the Studio's words: where it is ("Pack details",
 * "Card") and what to do, plainly, for the commonest problems. Anything
 * else keeps the game's own message.
 */
export function describeIssue(issue: PackIssue): { where: string; text: string } {
  const { file, message } = issue
  const subject = issueSubject(file)
  const where = subject?.kind === 'manifest' ? 'Pack details' : (subject?.kind === 'content' && ISSUE_PLACES[subject.section]) || 'Pack'
  const pack = subject?.kind === 'manifest'
  let text = message
  if (/^authors: must be at least 1/.test(message)) text = 'Add your name as the author.'
  else if (/^description: must not be blank/.test(message)) {
    text = pack ? 'Add a description of the pack.'
      : subject?.kind === 'content' && subject.section === 'stakeholders' ? 'Add a description: who they are and what they care about.'
        : subject?.kind === 'content' && subject.section === 'scores' ? 'Add a description: what it measures, in a sentence.'
          : subject?.kind === 'content' && subject.section === 'scenarios' ? 'Add a description: what the player walks into.'
            : 'Add a description: what it does, in a sentence.'
  } else if (/^name: must not be blank/.test(message)) text = pack ? 'Give the pack a name.' : 'Give it a name.'
  return { where, text }
}

/** One reason the game would refuse the pack, as its checks report it. */
export type { PackIssue }
