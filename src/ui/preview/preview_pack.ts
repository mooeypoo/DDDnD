/**
 * Loading a pack sent by the Pack Studio's "Play it" (docs/PACK_STUDIO.md
 * §11): the same validation as any import (the bundle reader, the snapshot
 * builder's schemas, the playability check), then the pack is played in
 * memory. A pack that fails says why, in the bazaar's words, and doesn't play.
 */
import type { PackSnapshot } from '@/domains/content/model'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { packKeyOf } from '@/domains/content/services/pack_identity'
import { PackLoadError, type PackIssue } from '@/domains/content/services/pack_snapshot_builder'
import { STAGE_TITLES } from '@/ui/composables/use_community_packs'

export type PreviewPackResult =
  | { ok: true; packKey: string; name: string }
  | { ok: false; title: string; problems: PackIssue[] }

export async function loadPreviewPack(
  bundleText: string,
  deps: {
    check: (snapshot: PackSnapshot) => Promise<{ ok: boolean; issues: PackIssue[] }>
    add: (snapshot: PackSnapshot) => Promise<void>
  },
): Promise<PreviewPackResult> {
  try {
    const snapshot = await readPackBundle(bundleText, 'studio-preview.dddnd-pack.json')
    const check = await deps.check(snapshot)
    if (!check.ok) return { ok: false, title: 'This pack can\'t be played here', problems: check.issues }
    await deps.add(snapshot)
    return { ok: true, packKey: packKeyOf(snapshot), name: snapshot.manifest.name }
  } catch (error) {
    if (error instanceof PackLoadError) return { ok: false, title: STAGE_TITLES[error.stage], problems: error.issues }
    return { ok: false, title: 'Something went wrong', problems: [{ file: 'pack', message: error instanceof Error ? error.message : String(error) }] }
  }
}
