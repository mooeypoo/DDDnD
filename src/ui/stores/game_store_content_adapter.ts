import type { ContentPackManifest } from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { resolveContentPackManifestUrls } from '@/domains/content/services/content_pack_manifest_urls'
import { loadManifest } from '@/domains/content/services/manifest_loader'

interface ContentPackRegistryLike {
  registerPack(manifest: ContentPackManifest): void
  createMergedProvider(): ContentProvider
}

interface ValueRef<T> {
  value: T
}

interface ContentAdapterState {
  contentPackRegistry: ValueRef<ContentPackRegistryLike | null>
  externalManifestUrls: ValueRef<string[]>
}

interface ContentAdapterDependencies {
  resolveManifestUrls?: (externalManifestUrls: string[]) => string[]
  loadManifestByUrl?: (manifestUrl: string) => Promise<ContentPackManifest>
  createRegistry?: () => ContentPackRegistryLike
}

/**
 * Creates a content-loading adapter for the game store.
 *
 * This adapter owns manifest URL resolution, manifest loading, and merged
 * provider creation. It keeps orchestration logic out of the main store body.
 */
export function createGameStoreContentAdapter(
  state: ContentAdapterState,
  deps: ContentAdapterDependencies = {},
) {
  const resolveManifestUrls = deps.resolveManifestUrls ?? resolveContentPackManifestUrls
  const loadManifestByUrl = deps.loadManifestByUrl ?? loadManifest
  const createRegistry = deps.createRegistry ?? (() => new ContentPackRegistry())

  function setExternalManifestUrls(urls: string[]): void {
    state.externalManifestUrls.value = urls
    state.contentPackRegistry.value = null
  }

  async function loadContentPacks(): Promise<void> {
    if (state.contentPackRegistry.value) {
      return
    }

    const manifestUrls = resolveManifestUrls(state.externalManifestUrls.value)
    const manifests = await Promise.all(
      manifestUrls.map((manifestUrl) => loadManifestByUrl(manifestUrl)),
    )

    const registry = createRegistry()
    manifests.forEach((manifest) => {
      registry.registerPack(manifest)
    })

    state.contentPackRegistry.value = registry
  }

  async function getMergedContentProvider(): Promise<ContentProvider> {
    await loadContentPacks()

    if (!state.contentPackRegistry.value) {
      throw new Error('Content pack registry is unavailable after manifest loading')
    }

    return state.contentPackRegistry.value.createMergedProvider()
  }

  return {
    setExternalManifestUrls,
    loadContentPacks,
    getMergedContentProvider,
  }
}
