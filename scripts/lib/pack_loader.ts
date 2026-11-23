/**
 * Loads a pack folder the way the game would: the pack plus its declared
 * dependencies, one owner per file, pack-scoped resolution (M1.3). Shared by
 * the validator, the audit report and the audit gate (journal M3.8), so any
 * pack folder can be validated and audited the same way.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ContentPackManifest } from '../../src/domains/content/model/index.js'
import type { ContentProvider } from '../../src/domains/content/services/content_provider.js'
import { ContentPackRegistry } from '../../src/domains/content/services/content_pack_registry.js'
import { assertValidContentPackManifest } from '../../src/domains/content/services/manifest_validator.js'
import { firstPartyPackKey } from '../../src/domains/content/services/pack_identity.js'
import { createFileContentProvider } from './file_content_provider.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** This repository's own content folder (the base pack). */
export const DEFAULT_CONTENT_ROOT = path.resolve(projectRoot, 'content')

/**
 * First-party packs a community pack may depend on, by pack id. When a
 * validated pack declares one of these in depends_on, it is loaded from this
 * repository so the pack is checked exactly as the game will see it.
 */
export const FIRST_PARTY_PACK_ROOTS: Record<string, string> = {
  base: DEFAULT_CONTENT_ROOT,
  tutorial: path.resolve(DEFAULT_CONTENT_ROOT, 'tutorial'),
}

export async function loadManifestFromDisk(manifestPath: string): Promise<ContentPackManifest> {
  const raw = await readFile(manifestPath, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  assertValidContentPackManifest(parsed)
  return parsed
}

/**
 * Builds the provider the game would use for this pack's scenarios: the pack
 * plus its declared dependencies, with one owner per file and pack-scoped
 * resolution (M1.3). First-party dependencies come from this repository.
 * --dependency-root folders can stand in for them (for example, to check a
 * pack against a work-in-progress base pack); community packs may not depend
 * on other community packs (ADR 0013).
 */
export async function createPackScopedProvider(
  manifest: ContentPackManifest,
  contentRoot: string,
  dependencyRoots: string[],
): Promise<ContentProvider> {
  return (await loadPackScope(manifest, contentRoot, dependencyRoots)).provider
}

/** The registry holding the pack and its dependencies, the pack's key, and its scoped provider. */
export interface PackScope {
  registry: ContentPackRegistry
  packKey: string
  provider: ContentProvider
}

export async function loadPackScope(
  manifest: ContentPackManifest,
  contentRoot: string,
  dependencyRoots: string[],
): Promise<PackScope> {
  const registry = new ContentPackRegistry()
  const registered = new Set<string>()

  const candidates = new Map<string, string>(Object.entries(FIRST_PARTY_PACK_ROOTS))
  for (const root of dependencyRoots) {
    const dependencyManifest = await loadManifestFromDisk(path.join(root, 'manifest.json'))
    candidates.set(dependencyManifest.id, root)
  }

  async function registerWithDependencies(packManifest: ContentPackManifest, root: string): Promise<void> {
    for (const dependency of packManifest.depends_on) {
      if (registered.has(dependency.pack_id)) continue
      const dependencyRoot = candidates.get(dependency.pack_id)
      if (!dependencyRoot) {
        throw new Error(
          `Pack "${packManifest.id}" depends on "${dependency.pack_id}". Pass its folder with --dependency-root <dir>.`,
        )
      }
      await registerWithDependencies(await loadManifestFromDisk(path.join(dependencyRoot, 'manifest.json')), dependencyRoot)
    }
    if (!registered.has(packManifest.id)) {
      registry.registerPack(packManifest, createFileContentProvider(root))
      registered.add(packManifest.id)
    }
  }

  await registerWithDependencies(manifest, contentRoot)
  const packKey = firstPartyPackKey(manifest.id)
  return { registry, packKey, provider: registry.createScopedProvider(packKey) }
}
