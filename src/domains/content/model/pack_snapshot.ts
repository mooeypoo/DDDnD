import type { ContentPackManifest } from './content_pack_manifest'
import type { ContentMetadata } from './content_types'

/**
 * Where a loaded pack came from. Shown to players and stored with saves.
 */
export type PackOrigin =
  | {
      kind: 'remote'
      manifest_url: string
      /** See `PackPinning` in the source policy: whether the URL can change later. */
      pinning: 'commit' | 'release_tag' | 'unpinned'
    }
  | {
      kind: 'file'
      file_name: string
    }

/**
 * A complete, validated community pack held in memory.
 *
 * Every way a pack can arrive (a GitHub URL, an imported file, a locally
 * cached copy) becomes a snapshot through the same validation, so the rest of
 * the game never needs to know where a pack came from.
 */
export interface PackSnapshot {
  manifest: ContentPackManifest
  /** `<content-type>/<id>-v<version>.json` → validated entity. */
  entities: Record<string, ContentMetadata>
  /**
   * `sha256:<hex>` over the manifest and every content file in canonical JSON
   * form (whitespace and `$schema` links don't count). Identifies this exact
   * content in saves and exports, whether it was loaded from a URL or a file.
   */
  content_hash: string
  origin: PackOrigin
}
