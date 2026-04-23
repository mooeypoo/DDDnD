import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { createGameStoreContentAdapter } from '@/ui/stores/game_store_content_adapter'

function buildManifest(id: string): ContentPackManifest {
  return {
    id,
    version: '1.0.0',
    name: id,
    description: `${id} pack`,
    depends_on: [],
    base_url: `/content/${id}`,
    license: 'GPL-3.0-only',
    authors: [{ name: 'Test Author' }],
    scenarios: [],
    classes: [],
    challenge_modifiers: [],
    tutorials: [],
    content: {
      scenarios: [],
      cards: [],
      stakeholders: [],
      stakeholder_reaction_rules: [],
      scores: [],
      events: [],
      delayed_effects: [],
      outcome_tiers: [],
      outcome_archetypes: [],
      classes: [],
      challenge_modifiers: [],
    },
  }
}

describe('game_store_content_adapter', () => {
  it('loads manifests once and caches registry', async () => {
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const externalManifestUrls = ref<string[]>([])

    const resolveManifestUrls = vi.fn(() => ['/content/base/manifest.json', '/content/tutorial/manifest.json'])
    const loadManifestByUrl = vi.fn(async (url: string) =>
      url.includes('tutorial') ? buildManifest('tutorial') : buildManifest('base'),
    )

    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls },
      { resolveManifestUrls, loadManifestByUrl },
    )

    await adapter.loadContentPacks()
    await adapter.loadContentPacks()

    expect(resolveManifestUrls).toHaveBeenCalledTimes(1)
    expect(loadManifestByUrl).toHaveBeenCalledTimes(2)
    expect(contentPackRegistry.value).not.toBeNull()
  })

  it('resetting external URLs clears registry and allows reload', async () => {
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const externalManifestUrls = ref<string[]>([])

    const resolveManifestUrls = vi.fn((urls: string[]) => urls)
    const loadManifestByUrl = vi.fn(async (_url: string) => buildManifest('base'))

    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls },
      { resolveManifestUrls, loadManifestByUrl },
    )

    adapter.setExternalManifestUrls(['/content/base/manifest.json'])
    await adapter.loadContentPacks()

    expect(contentPackRegistry.value).not.toBeNull()

    adapter.setExternalManifestUrls(['/content/new/manifest.json'])
    expect(contentPackRegistry.value).toBeNull()

    await adapter.loadContentPacks()

    expect(resolveManifestUrls).toHaveBeenLastCalledWith(['/content/new/manifest.json'])
    expect(loadManifestByUrl).toHaveBeenCalledTimes(2)
    expect(contentPackRegistry.value).not.toBeNull()
  })

  it('creates a merged provider after loading manifests', async () => {
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const externalManifestUrls = ref<string[]>([])

    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls },
      {
        resolveManifestUrls: () => ['/content/base/manifest.json'],
        loadManifestByUrl: async () => buildManifest('base'),
      },
    )

    const provider = await adapter.getMergedContentProvider()

    expect(provider).toMatchObject({
      loadScenario: expect.any(Function),
      loadScore: expect.any(Function),
      loadStakeholder: expect.any(Function),
      loadStakeholderReactionRule: expect.any(Function),
      loadCard: expect.any(Function),
      loadEvent: expect.any(Function),
      loadDelayedEffect: expect.any(Function),
      loadOutcomeTier: expect.any(Function),
      loadOutcomeArchetype: expect.any(Function),
      loadPlayerClass: expect.any(Function),
      loadChallengeModifier: expect.any(Function),
    })
  })
})
