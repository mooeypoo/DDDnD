/**
 * Packs as files, in and out of the Studio (docs/PACK_STUDIO.md M4.8, D4, D26).
 *
 * Out: besides the `.dddnd-pack.json` file the bazaar imports, a zip in the
 * packs repository's layout (`<pack id>/manifest.json`, one folder per
 * content type, a README and the license's text), to commit to GitHub.
 *
 * In: a pack file or such a zip becomes a draft again. The game's own
 * snapshot builder reads it, exactly as when a player imports it, so nothing
 * reaches the Studio that the game wouldn't accept. Then the draft must hold
 * the whole pack: an import is lossless or refused (D26), so that the next
 * export is the same pack with the author's changes, never a quietly smaller
 * one.
 */

import type { ContentPackManifest } from '../content/model/content_pack_manifest'
import type { PackSnapshot } from '../content/model/pack_snapshot'
import { buildPackSnapshot, CONTENT_TYPE_BY_SECTION, inventoryPaths, parseManifestText, PackLoadError } from '../content/services/pack_snapshot_builder'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import { BASE_PACK_ID, MAX_FILES_PER_PACK } from '../content/validation/pack_policy'
import { contentPrefix } from './content_ids'
import { checkDraft, compatibleBaseGames, draftFileName, draftPackId, draftToRawPack, gameTarget, type FirstPartyPack, type PackIssue } from './draft_export'
import { DRAFT_LICENSE, DRAFT_SECTIONS, draftLicense, type DraftContent, type DraftPack, type DraftSection, type LicenseTexts } from './draft_pack'

/** An archive opened for reading. The Studio's zip adapter provides one; this file knows only packs. */
export interface PackArchive {
  /** Every file in the archive (folders left out), as relative paths. */
  names: string[]
  /**
   * Some files as text, in one pass over the archive, refusing any file over
   * `maxBytes` (counted while decompressing, whatever its header claims).
   */
  read(names: readonly string[], maxBytes: number): Promise<Record<string, string>>
}

/**
 * How much of an archive the Studio will look at: a pack's own limits, plus
 * room for the README and the folders. Nothing larger is opened.
 */
export const PACK_ARCHIVE_LIMITS = {
  archiveBytes: CONTENT_LIMITS.max_pack_bytes + CONTENT_LIMITS.max_manifest_bytes,
  entries: MAX_FILES_PER_PACK + 64,
  totalBytes: CONTENT_LIMITS.max_pack_bytes + CONTENT_LIMITS.max_manifest_bytes,
} as const

/**
 * The folder holding the pack: where its one `manifest.json` is. That is the
 * archive's top, the `<pack id>/` folder the Studio exports, or deeper (a
 * folder of a repository). An archive with several packs is refused.
 */
export function packRoot(names: readonly string[], archiveName: string): string {
  const manifests = names.filter((name) => name === 'manifest.json' || name.endsWith('/manifest.json'))
  if (manifests.length === 0) throw new PackLoadError('source', [{ file: archiveName, message: 'has no manifest.json, so it is not a DDDnD pack' }])
  if (manifests.length > 1) {
    throw new PackLoadError('source', [{ file: archiveName, message: `holds ${manifests.length} packs. Zip one pack's folder and import that.` }])
  }
  return manifests[0].slice(0, -'manifest.json'.length)
}

/**
 * Reads a pack from an archive through the game's own snapshot builder. Only
 * the manifest and the files its inventory lists are read; anything else in
 * the folder (a README, a licence) is left alone. Throws PackLoadError.
 */
export async function readPackArchive(archive: PackArchive, archiveName: string): Promise<PackSnapshot> {
  const root = packRoot(archive.names, archiveName)
  const present = new Set(archive.names)
  const manifestPath = `${root}manifest.json`
  const manifestText = (await archive.read([manifestPath], CONTENT_LIMITS.max_manifest_bytes))[manifestPath]
  const manifest = parseManifestText(manifestText)
  // A listed file that's missing is the builder's to report, with the others
  const listed = inventoryPaths(manifest).filter((path) => present.has(`${root}${path}`))
  const read = await archive.read(listed.map((path) => `${root}${path}`), CONTENT_LIMITS.max_file_bytes)
  const files = Object.fromEntries(listed.map((path) => [path, read[`${root}${path}`]]))
  return buildPackSnapshot({ manifest_text: manifestText, files }, { kind: 'file', file_name: archiveName })
}

export type DraftImport = { ok: true; draft: DraftPack } | { ok: false; problems: string[] }

const ENTRY_POINTS = ['scenarios', 'classes', 'challenge_modifiers'] as const

/**
 * A pack as a draft, with its content counted as already released at its
 * version (the version-bump assistant compares the next export with it). Or
 * every reason the Studio can't keep the whole pack.
 */
export function draftFromPack(snapshot: PackSnapshot): DraftImport {
  const { manifest } = snapshot
  const problems: string[] = []

  if (manifest.kind !== 'extension') {
    problems.push(`It is a ${manifest.kind} pack. The Studio makes packs that build on DDDnD's base game.`)
  }
  const others = manifest.depends_on.filter((dependency) => dependency.pack_id !== BASE_PACK_ID)
  if (others.length > 0) {
    problems.push(`It builds on ${others.map((dependency) => `"${dependency.pack_id}"`).join(' and ')}. The Studio makes packs that build on the base game only.`)
  }
  if (manifest.tutorials.length > 0) problems.push('It has tutorials, which the Studio cannot edit or export yet.')
  if (contentPrefix(manifest.id) !== manifest.id) {
    problems.push(`Its id, "${manifest.id}", isn't one the Studio can keep (lower-case words joined by "_", at most 16 characters). Its next export would be a different pack to players.`)
  }

  const content = Object.fromEntries(DRAFT_SECTIONS.map((section) => [section, {}])) as unknown as DraftContent
  for (const section of DRAFT_SECTIONS) {
    const own = content[section] as Record<string, { id: string; version: number }>
    for (const filename of manifest.content[section] ?? []) {
      const entity = snapshot.entities[`${CONTENT_TYPE_BY_SECTION[section]}/${filename}`] as unknown as { id: string; version: number } | undefined
      if (!entity) continue
      if (own[entity.id]) {
        problems.push(`It has two versions of "${entity.id}" (${section.replace(/_/g, ' ')}). A Studio draft holds one version of each piece of content.`)
        continue
      }
      own[entity.id] = entity
    }
  }
  for (const section of ENTRY_POINTS) {
    const offered = new Set(manifest[section].map((ref) => `${ref.id}@${ref.version}`))
    const held = Object.values(content[section] as Record<string, { id: string; version: number }>).map((entity) => `${entity.id}@${entity.version}`)
    if (held.length !== offered.size || held.some((key) => !offered.has(key))) {
      problems.push(`Its ${section.replace(/_/g, ' ')} aren't all offered to players. A Studio pack offers every one it has.`)
    }
  }
  if (problems.length > 0) return { ok: false, problems }

  const draft: DraftPack = {
    kind: Object.keys(content.scores).length > 0 ? 'new_topic' : 'retelling',
    name: manifest.name,
    description: manifest.description,
    prefix: manifest.id,
    version: manifest.version,
    authors: manifest.authors.map((author) => (author.url ? { name: author.name, url: author.url } : { name: author.name })),
    content,
    released: { version: manifest.version, content: JSON.parse(JSON.stringify(content)) as DraftContent, license: manifest.license },
  }
  if (manifest.license !== DRAFT_LICENSE) draft.license = manifest.license
  if (manifest.pack_homepage_url) draft.homepage_url = manifest.pack_homepage_url
  return { ok: true, draft }
}

const SECTION_TITLES: Partial<Record<DraftSection, string>> = {
  scenarios: 'Scenarios',
  stakeholders: 'Council members',
  cards: 'Cards',
  events: 'Events',
  scores: 'Scores',
  classes: 'Classes',
  challenge_modifiers: 'Challenge modifiers',
}

/**
 * The README a zip export carries: what the pack is, what it's for, and how
 * players get it. `withLicenseFile` says whether the zip holds the license's text.
 */
export function packReadme(draft: DraftPack, manifest: ContentPackManifest, baseVersion: string, withLicenseFile = false): string {
  const { from, series } = compatibleBaseGames({ schema_version: manifest.schema_version, base_version: baseVersion })
  const authors = draft.authors.map((author) => (author.url ? `[${author.name}](${author.url})` : author.name)).join(', ')
  const lines = [
    `# ${draft.name}`,
    '',
    draft.description,
    '',
    'A content pack for [DDDnD](https://dddnd.app), made with the DDDnD Pack Studio.',
    '',
    `- **Version:** ${manifest.version}`,
    `- **Made for:** DDDnD's base game ${from} (it works in any ${series} version from ${from} on)`,
    `- **By:** ${authors}`,
    `- **License:** ${licenseLine(draft, withLicenseFile)}`,
    '',
    '## Contents',
    '',
  ]
  for (const section of DRAFT_SECTIONS) {
    const title = SECTION_TITLES[section]
    const names = Object.values(draft.content[section] as Record<string, { name?: string }>).map((entity) => entity.name).filter(Boolean)
    if (title && names.length > 0) lines.push(`- **${title}:** ${names.join(', ')}`)
  }
  lines.push(
    '',
    '## Playing it',
    '',
    `- **From a file:** import \`${draftFileName(draft)}\` in the game's Community bazaar.`,
    '- **From GitHub:** commit this folder to a public repository, tag a release, and load the pack by its manifest\'s URL, pinned to that tag:',
    '',
    '  ```text',
    `  https://raw.githubusercontent.com/<you>/<repository>/<tag>/<path to this folder>/manifest.json`,
    '  ```',
    '',
    'Pin the URL to a tag, not a branch, so the pack can\'t change under a saved game.',
    '',
  )
  return lines.join('\n')
}

/** The README's license line: which license, whether it's the game's, and where its text is. */
function licenseLine(draft: DraftPack, withLicenseFile: boolean): string {
  const license = draftLicense(draft)
  const which = license.same_as_game ? `${license.id}, like DDDnD's base game` : license.id
  return withLicenseFile
    ? `${which}. The full text is in \`LICENSE\`.`
    : `${which}. This zip doesn't include the license's text: add it as \`LICENSE\` before you publish.`
}

/**
 * The zip's files, in the packs repository's layout under `<pack id>/`, or the
 * issues that stop the export. Only a pack the game would import is exported.
 */
export async function exportDraftArchive(
  draft: DraftPack,
  firstParty: readonly FirstPartyPack[],
  licenseTexts: LicenseTexts = {},
): Promise<{ ok: true; files: Record<string, string>; file_name: string } | { ok: false; issues: PackIssue[] }> {
  const check = await checkDraft(draft, firstParty)
  if (check.issues.length > 0 || !check.snapshot) return { ok: false, issues: check.issues }
  const target = gameTarget(firstParty)
  const raw = draftToRawPack(draft, target)
  const folder = draftPackId(draft)
  const licenseText = licenseTexts[draftLicense(draft).id]
  const files: Record<string, string> = {
    [`${folder}/README.md`]: packReadme(draft, check.snapshot.manifest, target.base_version, licenseText !== undefined),
    [`${folder}/manifest.json`]: raw.manifest_text,
  }
  if (licenseText !== undefined) files[`${folder}/LICENSE`] = licenseText
  for (const [path, text] of Object.entries(raw.files)) files[`${folder}/${path}`] = text
  return { ok: true, files, file_name: `${folder}-v${draft.version}.zip` }
}
