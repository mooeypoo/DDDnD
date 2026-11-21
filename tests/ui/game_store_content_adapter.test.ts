import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { createGameStoreContentAdapter } from '@/ui/stores/game_store_content_adapter'

function buildManifest(id: string): ContentPackManifest {
  return {
    schema_version: 1,
    kind: 'standalone',
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

describe('community packs in the content adapter (M2.5)', () => {
  async function createAdapter() {
    const { createDiskBackedRegistry, readFirstPartyManifest } = await import('../content/support/demo_pack')
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const communityPacks = ref<import('@/domains/content/model').PackSnapshot[]>([])
    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls: ref<string[]>([]), communityPacks },
      {
        resolveManifestUrls: () => ['base', 'tutorial'],
        loadManifestByUrl: async (id: string) => readFirstPartyManifest(id as 'base' | 'tutorial'),
        createRegistry: createDiskBackedRegistry,
      },
    )
    return { adapter, contentPackRegistry, communityPacks }
  }

  it('checks, adds, and plays the demo pack next to the first-party packs', async () => {
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const { adapter, communityPacks } = await createAdapter()
    const snapshot = await demoPackSnapshot()

    expect(await adapter.checkCommunityPack(snapshot)).toEqual({ ok: true, issues: [] })
    await adapter.addCommunityPack(snapshot)
    expect(communityPacks.value.map((pack) => pack.manifest.id)).toEqual(['gilded_ledger'])

    const scenarioRef = { id: 'ledger_payments_monolith', version: 1 }
    const provider = await adapter.getScenarioContentProvider(scenarioRef)
    await expect(provider.loadScenario(scenarioRef)).resolves.toMatchObject({ name: 'The Gilded Ledger' })
    expect(adapter.findCommunityPackForScenario(scenarioRef)?.manifest.id).toBe('gilded_ledger')
    expect(adapter.findCommunityPackForScenario({ id: 'monolith_of_mild_despair', version: 2 })).toBeNull()
  })

  it('refuses a pack that would replace first-party content, and changes nothing', async () => {
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const { adapter, communityPacks } = await createAdapter()
    const impostor = await demoPackSnapshot((files) => {
      files['manifest.json'] = files['manifest.json'].replace('"ledger_add_transactional_outbox-v1.json"', '"ledger_add_transactional_outbox-v1.json",\n      "define_bounded_context-v1.json"')
      files['cards/define_bounded_context-v1.json'] = files['cards/ledger_add_transactional_outbox-v1.json']
        .replace(/ledger_add_transactional_outbox/g, 'define_bounded_context')
    })

    const check = await adapter.checkCommunityPack(impostor)
    expect(check.ok).toBe(false)
    expect(check.issues[0].message).toMatch(/which pack "base" already provides/)
    await expect(adapter.addCommunityPack(impostor)).rejects.toThrow(/already provides/)
    expect(communityPacks.value).toEqual([])
  })

  it('refuses a pack whose scenario would fail when the player sits down', async () => {
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const { adapter } = await createAdapter()
    const broken = await demoPackSnapshot((files) => {
      const path = 'stakeholder-reaction-rules/ledger_support_relieved-v1.json'
      files[path] = files[path].replace('"target_id": "maintainability"', '"target_id": "technical_debt"')
    })

    const check = await adapter.checkCommunityPack(broken)
    expect(check.ok).toBe(false)
    expect(check.issues).toEqual([expect.objectContaining({
      file: 'scenarios/ledger_payments_monolith-v1.json',
      message: expect.stringMatching(/technical_debt/),
    })])
  })

  it('removing a pack also removes community packs that depend on it', async () => {
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const { adapter, communityPacks } = await createAdapter()
    const demo = await demoPackSnapshot()
    communityPacks.value = [demo, { ...demo, manifest: { ...demo.manifest, id: 'sequel', depends_on: [{ pack_id: 'gilded_ledger', version: '1.0.0' }] } }]

    expect(adapter.removeCommunityPack('gilded_ledger').sort()).toEqual(['gilded_ledger', 'sequel'])
    expect(communityPacks.value).toEqual([])
  })
})
