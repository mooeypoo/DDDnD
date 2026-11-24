/**
 * The first-party packs (base, tutorial), read from the Studio's own site at
 * /content (studio/vite.config.ts). Loaded once and shared: the start screen
 * lists base scenarios from them, and every draft check runs against them.
 */

import { manifestRefs, type FirstPartyPack, type ReferencedSection } from '@/domains/authoring'
import type { Scenario, VersionRef } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { createContentProvider, type ContentProvider } from '@/domains/content/services/content_provider'
import { loadManifest } from '@/domains/content/services/manifest_loader'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'

const MANIFEST_URLS = ['/content/manifest.json', '/content/tutorial/manifest.json']

export interface FirstPartyContent {
  packs: FirstPartyPack[]
  /** Resolves base content (and only base), as a draft's references do. */
  base: ContentProvider
}

let loading: Promise<FirstPartyContent> | null = null

export function loadFirstParty(): Promise<FirstPartyContent> {
  if (!loading) {
    loading = (async () => {
      const manifests = await Promise.all(MANIFEST_URLS.map((url) => loadManifest(url)))
      const packs = manifests.map((manifest) => ({ manifest, provider: createContentProvider(manifest.base_url) }))
      const registry = new ContentPackRegistry()
      for (const pack of packs) registry.registerPack(pack.manifest, pack.provider)
      return { packs, base: registry.createScopedProvider(firstPartyPackKey('base')) }
    })()
    loading.catch(() => {
      loading = null
    })
  }
  return loading
}

/** Everything the base game offers in one section (its manifest's list), as references. */
export async function listBaseRefs(section: ReferencedSection): Promise<VersionRef[]> {
  const { packs } = await loadFirstParty()
  const manifest = packs.find((pack) => pack.manifest.id === 'base')?.manifest
  return manifest ? manifestRefs(manifest, section) : []
}

export interface BaseScenarioChoice {
  ref: VersionRef
  name: string
  summary: string
}

/** The base game's adventures, for "Start from a DDDnD scenario" (D13). */
export async function listBaseScenarios(): Promise<BaseScenarioChoice[]> {
  const { packs, base } = await loadFirstParty()
  const manifest = packs.find((pack) => pack.manifest.id === 'base')?.manifest
  const scenarios: Scenario[] = await Promise.all((manifest?.scenarios ?? []).map((ref) => base.loadScenario(ref)))
  return scenarios.map((scenario) => ({
    ref: { id: scenario.id, version: scenario.version },
    name: scenario.name,
    summary: scenario.short_description ?? scenario.description,
  }))
}
