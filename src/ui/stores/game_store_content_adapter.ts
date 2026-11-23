import type { ContentPackManifest, PackSnapshot, VersionRef } from '@/domains/content/model'
import type { RunContentPack } from '@/domains/simulation/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { resolveContentPackManifestUrls } from '@/domains/content/services/content_pack_manifest_urls'
import { loadManifest } from '@/domains/content/services/manifest_loader'
import { checkPackPlayable } from '@/domains/content/services/pack_playability_check'
import { createSnapshotContentProvider, type PackIssue } from '@/domains/content/services/pack_snapshot_builder'
import { readPackBundle, writePackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey, packKeyOf } from '@/domains/content/services/pack_identity'
import type { CommunityPackStore } from '@/domains/persistence/adapters/community_pack_store'

type ContentPackRegistryLike = Pick<
  ContentPackRegistry,
  | 'registerPack'
  | 'getManifests'
  | 'getPacks'
  | 'getPack'
  | 'getAvailableScenarios'
  | 'getAvailableTutorials'
  | 'createGameWideProvider'
  | 'createScopedProvider'
  | 'getTableClasses'
>

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
  /**
   * Where added community packs are kept between visits (M2.6). Omitted when
   * community packs are off (ADR 0009): nothing is read or written.
   */
  openPackStore?: () => Promise<CommunityPackStore>
}

/** A stored pack that could not be restored, and why. */
export interface PackRestoreIssue {
  pack_key: string
  pack_id: string
  name: string
  reason: string
}

/** Result of checking a community pack against everything already loaded. */
export interface CommunityPackCheck {
  ok: boolean
  issues: PackIssue[]
}

/**
 * How a pack being reviewed relates to packs already added (ADR 0014).
 * - `replaces`: the same pack (same key), usually another version. Adding replaces it.
 * - `same_name`: other packs with the same name from elsewhere. They stay;
 *   the player is told so they can tell them apart.
 */
export interface PackRelations {
  replaces: PackSnapshot | null
  same_name: PackSnapshot[]
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

  /** Stored community packs are restored once, on first content load. */
  let packStore: Promise<CommunityPackStore> | null = null
  let restored: Promise<PackRestoreIssue[]> | null = null

  function getPackStore(): Promise<CommunityPackStore> | null {
    if (!deps.openPackStore) return null
    packStore ??= deps.openPackStore()
    return packStore
  }

  /**
   * Re-validates every stored pack with today's rules and the packs loaded
   * now, and adds the ones that still pass. Returns the ones that don't.
   */
  async function restoreStoredPacks(): Promise<PackRestoreIssue[]> {
    const store = getPackStore()
    if (!store) return []
    const issues: PackRestoreIssue[] = []
    for (const stored of await (await store).list()) {
      const issue = (reason: string) => issues.push({ pack_key: stored.pack_key, pack_id: stored.pack_id, name: stored.name, reason })
      try {
        const snapshot = { ...(await readPackBundle(stored.bundle_text, `${stored.pack_id}.dddnd-pack.json`)), origin: stored.origin }
        // The key is recomputed, never trusted from storage.
        if (packKeyOf(snapshot) !== stored.pack_key) {
          issue('the stored copy doesn\'t match where it says it came from')
          continue
        }
        const check = await checkCommunityPack(snapshot)
        if (!check.ok) {
          issue(check.issues.map((found) => `${found.file}: ${found.message}`).join('; '))
          continue
        }
        const key = packKeyOf(snapshot)
        communityPacks.value = [...communityPacks.value.filter((pack) => packKeyOf(pack) !== key), snapshot]
      } catch (error) {
        issue(error instanceof Error ? error.message : String(error))
      }
    }
    return issues
  }

  /** Restores stored packs once. Safe to call many times. */
  function ensurePacksRestored(): Promise<PackRestoreIssue[]> {
    restored ??= restoreStoredPacks()
    return restored
  }

  /** Whether added packs are kept after a reload (false without IndexedDB). */
  async function isPackStorePersistent(): Promise<boolean> {
    const store = getPackStore()
    return store ? (await store).persistent : false
  }

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
   * they were added, each under its pack key (ADR 0014). Throws on ownership
   * conflicts (ADR 0001).
   */
  async function buildRegistry(packs: PackSnapshot[]): Promise<ContentPackRegistryLike> {
    const registry = createRegistry()
    for (const manifest of await loadDefaultManifests()) {
      registry.registerPack(manifest)
    }
    for (const snapshot of packs) {
      registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), packKeyOf(snapshot))
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

    await ensurePacksRestored()
    state.contentPackRegistry.value = await buildRegistry(communityPacks.value)
  }

  async function loadedRegistry(): Promise<ContentPackRegistryLike> {
    await loadContentPacks()
    if (!state.contentPackRegistry.value) {
      throw new Error('Content pack registry is unavailable after manifest loading')
    }
    return state.contentPackRegistry.value
  }

  /** Provider for game-wide choices (classes, challenge modifiers): first-party only. */
  async function getGameWideContentProvider(): Promise<ContentProvider> {
    return (await loadedRegistry()).createGameWideProvider()
  }

  /**
   * Provider for one pack's content: the pack and the packs it depends on
   * (ADR 0001). Scenario bundles and quest cards are built with it.
   */
  async function getPackContentProvider(packKey: string): Promise<ContentProvider> {
    return (await loadedRegistry()).createScopedProvider(packKey)
  }

  /**
   * The pack a run belongs to: the key recorded on the run, or, for runs saved
   * before pack identity existed (always first-party), the first-party pack
   * whose inventory lists the scenario.
   */
  async function resolveRunPackKey(scenarioRef: VersionRef, recordedKey: string | undefined): Promise<string | null> {
    if (recordedKey) return recordedKey
    const registry = await loadedRegistry()
    const filename = `${scenarioRef.id}-v${scenarioRef.version}.json`
    const owner = registry.getPacks().find((pack) => pack.key.startsWith(firstPartyPackKey('')) && pack.manifest.content.scenarios.includes(filename))
    return owner?.key ?? null
  }

  /**
   * How a pack relates to the packs already added: the same pack it would
   * replace (same key), and same-named packs from elsewhere, which stay.
   */
  function findPackRelations(snapshot: PackSnapshot): PackRelations {
    const key = packKeyOf(snapshot)
    return {
      replaces: communityPacks.value.find((pack) => packKeyOf(pack) === key) ?? null,
      same_name: communityPacks.value.filter((pack) => packKeyOf(pack) !== key && pack.manifest.id === snapshot.manifest.id),
    }
  }

  /**
   * Dry run: would this pack load and play next to everything already loaded
   * (minus what it would replace)? Changes nothing. Runs before the consent
   * screen is shown.
   */
  async function checkCommunityPack(snapshot: PackSnapshot): Promise<CommunityPackCheck> {
    const key = packKeyOf(snapshot)
    const others = communityPacks.value.filter((pack) => packKeyOf(pack) !== key)
    let registry: ContentPackRegistryLike
    try {
      registry = await buildRegistry([...others, snapshot])
    } catch (error) {
      return { ok: false, issues: [{ file: 'manifest.json', message: (error as Error).message }] }
    }
    const issues = await checkPackPlayable(registry, key)
    return { ok: issues.length === 0, issues }
  }

  /**
   * Adds a community pack after the player confirmed it, replacing the same
   * pack (same key) if it was added before. Same-named packs from elsewhere
   * stay. Re-checks first; throws if the pack no longer fits.
   *
   * Returns whether it was also kept on this device. Failing to store it never
   * blocks playing it this visit.
   */
  async function addCommunityPack(snapshot: PackSnapshot): Promise<{ kept: boolean }> {
    const check = await checkCommunityPack(snapshot)
    if (!check.ok) {
      throw new Error(check.issues.map((issue) => `${issue.file}: ${issue.message}`).join('; '))
    }
    const key = packKeyOf(snapshot)
    communityPacks.value = [
      ...communityPacks.value.filter((pack) => packKeyOf(pack) !== key),
      snapshot,
    ]
    state.contentPackRegistry.value = null

    const store = getPackStore()
    if (!store) return { kept: false }
    try {
      const opened = await store
      // Plain copies only: IndexedDB can't store Vue reactive proxies.
      await opened.put({
        pack_key: key,
        pack_id: snapshot.manifest.id,
        name: snapshot.manifest.name,
        version: snapshot.manifest.version,
        content_hash: snapshot.content_hash,
        origin: JSON.parse(JSON.stringify(snapshot.origin)) as PackSnapshot['origin'],
        bundle_text: writePackBundle(snapshot),
        added_at: new Date().toISOString(),
      })
      return { kept: opened.persistent }
    } catch (error) {
      console.warn('Community pack could not be kept on this device', error)
      return { kept: false }
    }
  }

  /**
   * Removes a community pack by key, here and from storage. Nothing else can
   * depend on it: community packs may depend only on first-party packs (ADR 0013).
   */
  async function removeCommunityPack(packKey: string): Promise<void> {
    communityPacks.value = communityPacks.value.filter((pack) => packKeyOf(pack) !== packKey)
    state.contentPackRegistry.value = null

    const store = getPackStore()
    if (store) {
      await (await store).remove(packKey)
    }
  }

  /** The added community pack with this key, or null (first-party or not added). */
  function findCommunityPack(packKey: string | undefined): PackSnapshot | null {
    if (!packKey) return null
    return communityPacks.value.find((pack) => packKeyOf(pack) === packKey) ?? null
  }

  /**
   * Identity of a pack, recorded on a new run (M2.6). Requires the registry
   * to be loaded (it is, once a bundle was built).
   */
  function describePack(packKey: string): RunContentPack | undefined {
    const community = findCommunityPack(packKey)
    if (community) {
      return {
        key: packKeyOf(community),
        id: community.manifest.id,
        version: community.manifest.version,
        origin: community.origin.kind,
        content_hash: community.content_hash,
        ...(community.origin.kind === 'remote' ? { source_url: community.origin.manifest_url } : {}),
      }
    }
    const manifest = state.contentPackRegistry.value?.getPack(packKey)?.manifest
    return manifest ? { key: packKey, id: manifest.id, version: manifest.version, origin: 'first_party' } : undefined
  }

  /**
   * Whether the exact community pack a run was played with is loaded, matched
   * by pack key and content hash (ADR 0012). Null when it is.
   * - `missing`: no pack with that key is loaded.
   * - `different_source`: a pack with the same name is loaded, but from somewhere else.
   * - `different_version`: the same pack is loaded, with different content.
   */
  function whyRunPackUnavailable(pack: RunContentPack): 'missing' | 'different_source' | 'different_version' | null {
    if (pack.origin === 'first_party') return null
    const loaded = communityPacks.value.find((snapshot) => packKeyOf(snapshot) === pack.key)
    if (!loaded) {
      return communityPacks.value.some((snapshot) => snapshot.manifest.id === pack.id) ? 'different_source' : 'missing'
    }
    return pack.content_hash && loaded.content_hash !== pack.content_hash ? 'different_version' : null
  }

  return {
    ensurePacksRestored,
    whyRunPackUnavailable,
    isPackStorePersistent,
    describePack,
    setExternalManifestUrls,
    loadContentPacks,
    getGameWideContentProvider,
    getPackContentProvider,
    resolveRunPackKey,
    checkCommunityPack,
    findPackRelations,
    addCommunityPack,
    removeCommunityPack,
    findCommunityPack,
  }
}
