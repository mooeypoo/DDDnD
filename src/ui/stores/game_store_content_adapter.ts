import type { ContentPackManifest, PackSnapshot, VersionRef } from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { resolveContentPackManifestUrls } from '@/domains/content/services/content_pack_manifest_urls'
import { loadManifest } from '@/domains/content/services/manifest_loader'
import { checkPackPlayable } from '@/domains/content/services/pack_playability_check'
import { createSnapshotContentProvider, type PackIssue } from '@/domains/content/services/pack_snapshot_builder'

interface ContentPackRegistryLike {
  registerPack(manifest: ContentPackManifest, provider?: ContentProvider): void
  getManifests(): ContentPackManifest[]
  createMergedProvider(): ContentProvider
  createScopedProvider(packId: string): ContentProvider
  createScenarioProvider(scenarioRef: VersionRef): ContentProvider
  findOwnerPackId(contentType: 'scenarios', ref: VersionRef): string | null
}

interface ValueRef<T> {
  value: T
}

interface ContentAdapterState {
  contentPackRegistry: ValueRef<ContentPackRegistryLike | null>
  externalManifestUrls: ValueRef<string[]>
  /** Community packs added this session (ADR 0001). Registered after first-party packs. */
  communityPacks?: ValueRef<PackSnapshot[]>
}

interface ContentAdapterDependencies {
  resolveManifestUrls?: (externalManifestUrls: string[]) => string[]
  loadManifestByUrl?: (manifestUrl: string) => Promise<ContentPackManifest>
  createRegistry?: () => ContentPackRegistryLike
}

/** Result of checking a community pack against everything already loaded. */
export interface CommunityPackCheck {
  ok: boolean
  issues: PackIssue[]
}

/**
 * Creates a content-loading adapter for the game store.
 *
 * This adapter owns manifest URL resolution, manifest loading, community-pack
 * registration, and provider creation. It keeps orchestration logic out of
 * the main store body.
 */
export function createGameStoreContentAdapter(
  state: ContentAdapterState,
  deps: ContentAdapterDependencies = {},
) {
  const resolveManifestUrls = deps.resolveManifestUrls ?? resolveContentPackManifestUrls
  const loadManifestByUrl = deps.loadManifestByUrl ?? loadManifest
  const createRegistry = deps.createRegistry ?? (() => new ContentPackRegistry())
  const communityPacks = state.communityPacks ?? { value: [] as PackSnapshot[] }

  /** First-party manifests, fetched once per set of manifest URLs. */
  let defaultManifests: Promise<ContentPackManifest[]> | null = null

  function loadDefaultManifests(): Promise<ContentPackManifest[]> {
    if (!defaultManifests) {
      const manifestUrls = resolveManifestUrls(state.externalManifestUrls.value)
      const pending = Promise.all(manifestUrls.map((manifestUrl) => loadManifestByUrl(manifestUrl)))
      defaultManifests = pending
      pending.catch(() => {
        if (defaultManifests === pending) defaultManifests = null
      })
    }
    return defaultManifests
  }

  /**
   * Builds a registry: first-party packs, then community packs in the order
   * they were added. Throws on ownership conflicts (ADR 0001).
   */
  async function buildRegistry(packs: PackSnapshot[]): Promise<ContentPackRegistryLike> {
    const registry = createRegistry()
    for (const manifest of await loadDefaultManifests()) {
      registry.registerPack(manifest)
    }
    for (const snapshot of packs) {
      registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot))
    }
    return registry
  }

  function setExternalManifestUrls(urls: string[]): void {
    state.externalManifestUrls.value = urls
    state.contentPackRegistry.value = null
    defaultManifests = null
  }

  async function loadContentPacks(): Promise<void> {
    if (state.contentPackRegistry.value) {
      return
    }

    state.contentPackRegistry.value = await buildRegistry(communityPacks.value)
  }

  async function getMergedContentProvider(): Promise<ContentProvider> {
    await loadContentPacks()

    if (!state.contentPackRegistry.value) {
      throw new Error('Content pack registry is unavailable after manifest loading')
    }

    return state.contentPackRegistry.value.createMergedProvider()
  }

  /**
   * Provider for building one scenario's bundle: limited to the pack that owns
   * the scenario and the packs it depends on (ADR 0001).
   */
  async function getScenarioContentProvider(scenarioRef: VersionRef): Promise<ContentProvider> {
    await loadContentPacks()

    if (!state.contentPackRegistry.value) {
      throw new Error('Content pack registry is unavailable after manifest loading')
    }

    return state.contentPackRegistry.value.createScenarioProvider(scenarioRef)
  }

  /**
   * Dry run: would this pack load and play next to everything already loaded?
   * Changes nothing. Runs before the consent screen is shown.
   */
  async function checkCommunityPack(snapshot: PackSnapshot): Promise<CommunityPackCheck> {
    const others = communityPacks.value.filter((pack) => pack.manifest.id !== snapshot.manifest.id)
    let registry: ContentPackRegistryLike
    try {
      registry = await buildRegistry([...others, snapshot])
    } catch (error) {
      return { ok: false, issues: [{ file: 'manifest.json', message: (error as Error).message }] }
    }
    const issues = await checkPackPlayable(registry, snapshot.manifest.id)
    return { ok: issues.length === 0, issues }
  }

  /**
   * Adds (or replaces, by pack id) a community pack after the player confirmed it.
   * Re-checks first; throws if the pack no longer fits.
   */
  async function addCommunityPack(snapshot: PackSnapshot): Promise<void> {
    const check = await checkCommunityPack(snapshot)
    if (!check.ok) {
      throw new Error(check.issues.map((issue) => `${issue.file}: ${issue.message}`).join('; '))
    }
    communityPacks.value = [
      ...communityPacks.value.filter((pack) => pack.manifest.id !== snapshot.manifest.id),
      snapshot,
    ]
    state.contentPackRegistry.value = null
  }

  /**
   * Removes a community pack, and any community pack that depends on it.
   * Returns the ids removed.
   */
  function removeCommunityPack(packId: string): string[] {
    const removed = new Set([packId])
    let changed = true
    while (changed) {
      changed = false
      for (const pack of communityPacks.value) {
        const dependsOnRemoved = pack.manifest.depends_on.some((dependency) => removed.has(dependency.pack_id))
        if (!removed.has(pack.manifest.id) && dependsOnRemoved) {
          removed.add(pack.manifest.id)
          changed = true
        }
      }
    }
    communityPacks.value = communityPacks.value.filter((pack) => !removed.has(pack.manifest.id))
    state.contentPackRegistry.value = null
    return [...removed]
  }

  /**
   * The community pack that owns a scenario, or null for first-party content.
   */
  function findCommunityPackForScenario(scenarioRef: VersionRef): PackSnapshot | null {
    const ownerId = state.contentPackRegistry.value?.findOwnerPackId('scenarios', scenarioRef)
    return communityPacks.value.find((pack) => pack.manifest.id === ownerId) ?? null
  }

  return {
    setExternalManifestUrls,
    loadContentPacks,
    getMergedContentProvider,
    getScenarioContentProvider,
    checkCommunityPack,
    addCommunityPack,
    removeCommunityPack,
    findCommunityPackForScenario,
  }
}
