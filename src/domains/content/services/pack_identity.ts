/**
 * Pack Identity (ADR 0012)
 *
 * A manifest `id` is the name a pack gives itself. Nothing makes it unique:
 * two authors can both publish a `gilded_ledger`. So anything that must tell
 * packs apart over time (stored packs, saved runs, exports) uses a **pack
 * key**, which comes from where the pack is published, not from what it says
 * about itself:
 *
 * | Where it comes from | Pack key                                   |
 * | ------------------- | ------------------------------------------ |
 * | Ships with DDDnD    | `dddnd:<id>`                               |
 * | GitHub raw          | `github:<owner>/<repo>/<folder>`           |
 * | GitHub Pages        | `github-pages:<owner>/<folder>`            |
 * | A pack file         | `file:<content hash>`                      |
 *
 * - The ref (tag, branch, commit) is not part of a GitHub key, so a newer
 *   release of the same pack is recognized as the same pack. The exact
 *   content played is pinned separately by the content hash.
 * - GitHub owner and repository names are case-insensitive, so they are
 *   lowercased. Folder paths are case-sensitive on GitHub and kept as-is.
 * - A file carries no trustworthy information about where it came from, so
 *   its identity is its content. A file can never claim a GitHub pack's key.
 * - The same pack served from GitHub raw and from GitHub Pages gets two
 *   different keys: a Pages URL doesn't reliably say which repository it is.
 *
 * Within one game session only one pack per manifest id can be loaded (the
 * registry refuses duplicates). The key is what keeps two same-named packs
 * from silently replacing each other.
 *
 * Dependencies name a pack id, and an id proves nothing. So a community pack
 * may depend only on packs that ship with DDDnD, whose ids are reserved
 * (ADR 0013): no community pack can stand in for another pack's dependency.
 */

import type { ContentPackManifest } from '../model/content_pack_manifest'
import type { PackOrigin, PackSnapshot } from '../model/pack_snapshot'
import { FIRST_PARTY_PACK_IDS } from '../validation/pack_policy'
import { checkPackSourceUrl, type PackSource } from './pack_source_policy'

/** Key for a pack that ships with the game. */
export function firstPartyPackKey(packId: string): string {
  return `dddnd:${packId}`
}

/** Key for a pack loaded from a URL that passed the source policy. */
export function packKeyForSource(source: PackSource): string {
  const folder = source.pack_dir ? `/${source.pack_dir}` : ''
  if (source.host_kind === 'github_raw') {
    return `github:${source.owner.toLowerCase()}/${(source.repo ?? '').toLowerCase()}${folder}`
  }
  return `github-pages:${source.owner.toLowerCase()}${folder}`
}

/**
 * Key for a community pack, from where it was loaded and its content hash.
 * Throws if a remote origin's URL doesn't pass the source policy (a stored
 * origin that was tampered with, for example).
 */
export function packKeyForOrigin(origin: PackOrigin, contentHash: string): string {
  if (origin.kind === 'file') {
    return `file:${contentHash}`
  }
  const check = checkPackSourceUrl(origin.manifest_url)
  if (!check.ok) {
    throw new Error(`Pack origin ${origin.manifest_url} is not an allowed source: ${check.reason}`)
  }
  return packKeyForSource(check.source)
}

/** Key for a loaded community pack. */
export function packKeyOf(snapshot: Pick<PackSnapshot, 'origin' | 'content_hash'>): string {
  return packKeyForOrigin(snapshot.origin, snapshot.content_hash)
}

/** Shape check for a pack key read from a save or storage. */
export function isPackKey(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= 512
    && /^(?:dddnd:[a-z0-9_]{1,64}|github:[^\s]+|github-pages:[^\s]+|file:sha256:[0-9a-f]{64})$/.test(value)
}

/** A rule a community pack's manifest breaks, in the same shape as other load issues. */
export interface CommunityManifestIssue {
  file: 'manifest.json'
  message: string
}

/**
 * Identity rules for community packs (ADR 0013), checked when a community
 * pack's manifest is read, before any content is fetched:
 * - it may not use the id of a pack that ships with DDDnD;
 * - it may depend only on packs that ship with DDDnD;
 * - it may not offer game-wide choices (player classes, challenge modifiers).
 */
export function communityManifestIssues(
  manifest: Pick<ContentPackManifest, 'id' | 'depends_on' | 'classes' | 'challenge_modifiers'>,
): CommunityManifestIssue[] {
  const firstParty = FIRST_PARTY_PACK_IDS.join(', ')
  const issues: CommunityManifestIssue[] = []
  if (FIRST_PARTY_PACK_IDS.includes(manifest.id)) {
    issues.push({ file: 'manifest.json', message: `id: "${manifest.id}" belongs to a pack that ships with DDDnD. Choose another id.` })
  }
  for (const dependency of manifest.depends_on) {
    if (!FIRST_PARTY_PACK_IDS.includes(dependency.pack_id)) {
      issues.push({
        file: 'manifest.json',
        message: `depends_on: "${dependency.pack_id}" is not a pack that ships with DDDnD. ` +
          `Community packs can build only on DDDnD's own packs (${firstParty}) for now, because a pack id doesn't prove which pack it is.`,
      })
    }
  }
  // Player classes and challenge modifiers are game-wide choices offered for
  // every scenario, so they come only from packs that ship with DDDnD (ADR 0014).
  if (manifest.classes.length > 0) {
    issues.push({ file: 'manifest.json', message: 'classes: community packs can\'t add player classes yet; leave "classes" empty.' })
  }
  if ((manifest.challenge_modifiers ?? []).length > 0) {
    issues.push({ file: 'manifest.json', message: 'challenge_modifiers: community packs can\'t add challenge modifiers yet; leave "challenge_modifiers" empty.' })
  }
  return issues
}
