/**
 * Test support: the demo pack fixture as a validated snapshot, and a registry
 * factory that serves first-party packs from disk.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import type { ContentPackManifest, PackSnapshot } from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { buildPackSnapshot, type RawPackFiles } from '@/domains/content/services/pack_snapshot_builder'
import { createFileContentProvider } from '../../../scripts/lib/file_content_provider'

export const DEMO_PACK_ROOT = path.resolve('tests/content/fixtures/packs/gilded_ledger')
const FIRST_PARTY_ROOTS: Record<string, string> = {
  base: path.resolve('content'),
  tutorial: path.resolve('content/tutorial'),
}

function readTree(root: string, prefix = ''): Record<string, string> {
  const files: Record<string, string> = {}
  for (const entry of readdirSync(path.join(root, prefix))) {
    const relative = prefix ? `${prefix}/${entry}` : entry
    if (statSync(path.join(root, relative)).isDirectory()) Object.assign(files, readTree(root, relative))
    else files[relative] = readFileSync(path.join(root, relative), 'utf8')
  }
  return files
}

/** The demo pack's raw files, optionally changed by `edit` (manifest under "manifest.json"). */
export function demoPackRaw(edit: (files: Record<string, string>) => void = () => {}): RawPackFiles {
  const files = readTree(DEMO_PACK_ROOT)
  edit(files)
  const { 'manifest.json': manifest_text, ...rest } = files
  return { manifest_text, files: rest }
}

export function demoPackSnapshot(edit?: (files: Record<string, string>) => void): Promise<PackSnapshot> {
  return buildPackSnapshot(demoPackRaw(edit), { kind: 'file', file_name: 'gilded_ledger.dddnd-pack.json' })
}

export function readFirstPartyManifest(packId: 'base' | 'tutorial'): ContentPackManifest {
  return JSON.parse(readFileSync(path.join(FIRST_PARTY_ROOTS[packId], 'manifest.json'), 'utf8')) as ContentPackManifest
}

/** A real registry whose first-party packs read from this repository's content folders. */
export function createDiskBackedRegistry(): ContentPackRegistry {
  const registry = new ContentPackRegistry()
  const register = registry.registerPack.bind(registry)
  registry.registerPack = (manifest: ContentPackManifest, provider?: ContentProvider) =>
    register(manifest, provider ?? createFileContentProvider(FIRST_PARTY_ROOTS[manifest.id]))
  return registry
}
