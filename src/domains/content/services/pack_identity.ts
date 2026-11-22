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
 * registry refuses duplicates), so content references and `depends_on`
 * still resolve by manifest id. The key is what keeps two same-named packs
 * from silently replacing each other.
 */

import type { PackOrigin, PackSnapshot } from '../model/pack_snapshot'
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
