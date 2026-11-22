import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { packKeyOf } from '@/domains/content/services/pack_identity'
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

  it('creates the game-wide provider after loading manifests', async () => {
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const externalManifestUrls = ref<string[]>([])

    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls },
      {
        resolveManifestUrls: () => ['/content/base/manifest.json'],
        loadManifestByUrl: async () => buildManifest('base'),
      },
    )

    const provider = await adapter.getGameWideContentProvider()

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
    const key = packKeyOf(snapshot)
    const provider = await adapter.getPackContentProvider(key)
    await expect(provider.loadScenario(scenarioRef)).resolves.toMatchObject({ name: 'The Gilded Ledger' })
    expect(adapter.findCommunityPack(key)?.manifest.id).toBe('gilded_ledger')
    expect(adapter.findCommunityPack('dddnd:base')).toBeNull()
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

  it('removing a pack removes only that pack (community packs never depend on each other, ADR 0013)', async () => {
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const { adapter, communityPacks } = await createAdapter()
    const demo = await demoPackSnapshot()
    const other = { ...demo, origin: { kind: 'remote' as const, manifest_url: 'https://raw.githubusercontent.com/someone/packs/v1.0.0/x/manifest.json', pinning: 'release_tag' as const } }
    communityPacks.value = [demo, other]

    await adapter.removeCommunityPack(packKeyOf(demo))
    expect(communityPacks.value).toEqual([other])
  })
})

describe('keeping community packs between visits (M2.6)', () => {
  async function adapterWithStore(store: import('@/domains/persistence/adapters/community_pack_store').CommunityPackStore) {
    const { createDiskBackedRegistry, readFirstPartyManifest } = await import('../content/support/demo_pack')
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const communityPacks = ref<import('@/domains/content/model').PackSnapshot[]>([])
    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls: ref<string[]>([]), communityPacks },
      {
        resolveManifestUrls: () => ['base', 'tutorial'],
        loadManifestByUrl: async (id: string) => readFirstPartyManifest(id as 'base' | 'tutorial'),
        createRegistry: createDiskBackedRegistry,
        openPackStore: async () => store,
      },
    )
    return { adapter, communityPacks }
  }

  it('restores an added pack on the next visit, with its origin and identity', async () => {
    const { createMemoryCommunityPackStore } = await import('@/domains/persistence/adapters/community_pack_store')
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const store = createMemoryCommunityPackStore(true)
    const remote = { ...(await demoPackSnapshot()), origin: { kind: 'remote' as const, manifest_url: 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json', pinning: 'release_tag' as const } }

    const firstVisit = await adapterWithStore(store)
    await firstVisit.adapter.addCommunityPack(remote)
    expect(await store.list()).toEqual([expect.objectContaining({ pack_key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger', pack_id: 'gilded_ledger', content_hash: remote.content_hash })])

    const nextVisit = await adapterWithStore(store)
    expect(await nextVisit.adapter.ensurePacksRestored()).toEqual([])
    expect(nextVisit.communityPacks.value).toHaveLength(1)
    expect(nextVisit.communityPacks.value[0].content_hash).toBe(remote.content_hash)
    expect(nextVisit.communityPacks.value[0].origin).toEqual(remote.origin)

    await nextVisit.adapter.loadContentPacks()
    expect(nextVisit.adapter.describePack('github:mooeypoo/dddnd-packs/packs/gilded_ledger')).toEqual({
      key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger',
      id: 'gilded_ledger',
      version: '1.0.0',
      origin: 'remote',
      content_hash: remote.content_hash,
      source_url: remote.origin.manifest_url,
    })
    expect(nextVisit.adapter.describePack('dddnd:base')).toEqual({ key: 'dddnd:base', id: 'base', version: '1.0.0', origin: 'first_party' })
  })

  it('re-validates stored packs: one that no longer passes is left out and reported', async () => {
    const { createMemoryCommunityPackStore } = await import('@/domains/persistence/adapters/community_pack_store')
    const store = createMemoryCommunityPackStore(true)
    await store.put({
      pack_key: `file:sha256:${'0'.repeat(64)}`,
      pack_id: 'tampered',
      name: 'Tampered Pack',
      version: '1.0.0',
      content_hash: `sha256:${'0'.repeat(64)}`,
      origin: { kind: 'file', file_name: 'tampered.dddnd-pack.json' },
      bundle_text: '{"format":"dddnd-pack","format_version":1,"manifest":{"id":"tampered"},"files":{}}',
      added_at: '2026-11-22T00:00:00.000Z',
    })

    const visit = await adapterWithStore(store)
    const issues = await visit.adapter.ensurePacksRestored()
    expect(issues).toEqual([expect.objectContaining({ pack_id: 'tampered', name: 'Tampered Pack' })])
    expect(visit.communityPacks.value).toEqual([])
  })

  it('removing a pack deletes its stored copy', async () => {
    const { createMemoryCommunityPackStore } = await import('@/domains/persistence/adapters/community_pack_store')
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const store = createMemoryCommunityPackStore(true)
    const visit = await adapterWithStore(store)
    const snapshot = await demoPackSnapshot()
    await visit.adapter.addCommunityPack(snapshot)
    await visit.adapter.removeCommunityPack(packKeyOf(snapshot))
    expect(await store.list()).toEqual([])
  })
})

describe('same-named packs from different places (ADR 0012, ADR 0014)', () => {
  const MINE = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json'
  const THEIRS = 'https://raw.githubusercontent.com/someone-else/their-packs/v1.0.0/gilded_ledger/manifest.json'

  async function setup() {
    const { createMemoryCommunityPackStore } = await import('@/domains/persistence/adapters/community_pack_store')
    const { createDiskBackedRegistry, readFirstPartyManifest, demoPackSnapshot } = await import('../content/support/demo_pack')
    const store = createMemoryCommunityPackStore(true)
    const contentPackRegistry = ref<ContentPackRegistry | null>(null)
    const communityPacks = ref<import('@/domains/content/model').PackSnapshot[]>([])
    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry, externalManifestUrls: ref<string[]>([]), communityPacks },
      {
        resolveManifestUrls: () => ['base', 'tutorial'],
        loadManifestByUrl: async (id: string) => readFirstPartyManifest(id as 'base' | 'tutorial'),
        createRegistry: createDiskBackedRegistry,
        openPackStore: async () => store,
      },
    )
    const demo = await demoPackSnapshot()
    const from = (manifest_url: string, snapshot = demo) => ({ ...snapshot, origin: { kind: 'remote' as const, manifest_url, pinning: 'release_tag' as const } })
    return { adapter, communityPacks, store, demo, from, demoPackSnapshot }
  }

  /** Someone else's pack, also called gilded_ledger, with its own text. */
  async function theirs(from: (url: string, snapshot?: import('@/domains/content/model').PackSnapshot) => import('@/domains/content/model').PackSnapshot) {
    const { demoPackSnapshot } = await import('../content/support/demo_pack')
    const snapshot = await demoPackSnapshot((files) => {
      const path = 'scenarios/ledger_payments_monolith-v1.json'
      files[path] = files[path].replace('"name": "The Gilded Ledger"', '"name": "Their Ledger"')
    })
    return from(THEIRS, snapshot)
  }

  it('loads two packs with the same name side by side, each under its own key', async () => {
    const { adapter, communityPacks, store, from } = await setup()
    await adapter.addCommunityPack(from(MINE))
    const other = await theirs(from)

    expect(adapter.findPackRelations(other)).toEqual({ replaces: null, same_name: [expect.objectContaining({ origin: expect.objectContaining({ manifest_url: MINE }) })] })
    expect(await adapter.checkCommunityPack(other)).toEqual({ ok: true, issues: [] })
    await adapter.addCommunityPack(other)

    expect(communityPacks.value.map(packKeyOf)).toEqual([
      'github:mooeypoo/dddnd-packs/packs/gilded_ledger',
      'github:someone-else/their-packs/gilded_ledger',
    ])
    expect((await store.list()).map((stored) => stored.pack_key).sort()).toEqual([
      'github:mooeypoo/dddnd-packs/packs/gilded_ledger',
      'github:someone-else/their-packs/gilded_ledger',
    ])
  })

  it('never mixes them up: each key resolves its own content, even with identical content ids', async () => {
    const { adapter, from } = await setup()
    await adapter.addCommunityPack(from(MINE))
    await adapter.addCommunityPack(await theirs(from))
    const ref = { id: 'ledger_payments_monolith', version: 1 }

    const mine = await (await adapter.getPackContentProvider('github:mooeypoo/dddnd-packs/packs/gilded_ledger')).loadScenario(ref)
    const other = await (await adapter.getPackContentProvider('github:someone-else/their-packs/gilded_ledger')).loadScenario(ref)
    expect(mine.name).toBe('The Gilded Ledger')
    expect(other.name).toBe('Their Ledger')
    expect(adapter.describePack('github:someone-else/their-packs/gilded_ledger')).toMatchObject({ key: 'github:someone-else/their-packs/gilded_ledger', id: 'gilded_ledger' })
  })

  it('removing one keeps the other, here and in storage', async () => {
    const { adapter, communityPacks, store, from } = await setup()
    await adapter.addCommunityPack(from(MINE))
    await adapter.addCommunityPack(await theirs(from))

    await adapter.removeCommunityPack('github:mooeypoo/dddnd-packs/packs/gilded_ledger')
    expect(communityPacks.value.map(packKeyOf)).toEqual(['github:someone-else/their-packs/gilded_ledger'])
    expect((await store.list()).map((stored) => stored.pack_key)).toEqual(['github:someone-else/their-packs/gilded_ledger'])
  })

  it('a newer version of the same pack replaces it, and is stored as one entry', async () => {
    const { adapter, store, from, demoPackSnapshot } = await setup()
    await adapter.addCommunityPack(from(MINE))
    const newer = await demoPackSnapshot((files) => {
      files['manifest.json'] = files['manifest.json'].replace('"version": "1.0.0"', '"version": "1.1.0"')
    })
    const next = from(MINE.replace('gilded_ledger-v1.0.0', 'gilded_ledger-v1.1.0'), newer)

    expect(adapter.findPackRelations(next)).toEqual({ replaces: expect.objectContaining({ content_hash: expect.any(String) }), same_name: [] })
    await adapter.addCommunityPack(next)
    expect(await store.list()).toEqual([expect.objectContaining({ pack_key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger', version: '1.1.0' })])
  })

  it('says why a saved run cannot continue: missing, another pack with that name, or other content', async () => {
    const { adapter, from, demo } = await setup()
    const played = {
      key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger',
      id: 'gilded_ledger',
      version: '1.0.0',
      origin: 'remote' as const,
      content_hash: demo.content_hash,
      source_url: MINE,
    }

    expect(adapter.whyRunPackUnavailable(played)).toBe('missing')
    await adapter.addCommunityPack(from(THEIRS))
    expect(adapter.whyRunPackUnavailable(played)).toBe('different_source')
    await adapter.addCommunityPack(from(MINE))
    expect(adapter.whyRunPackUnavailable(played)).toBeNull()
    expect(adapter.whyRunPackUnavailable({ ...played, content_hash: `sha256:${'d'.repeat(64)}` })).toBe('different_version')
    expect(adapter.whyRunPackUnavailable({ key: 'dddnd:base', id: 'base', version: '1.0.0', origin: 'first_party' })).toBeNull()
  })

  it('does not trust a stored key: a file stored under a GitHub pack\'s key is left out', async () => {
    const { store, demo } = await setup()
    const { writePackBundle } = await import('@/domains/content/services/pack_bundle_file')
    await store.put({
      pack_key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger',
      pack_id: 'gilded_ledger',
      name: demo.manifest.name,
      version: demo.manifest.version,
      content_hash: demo.content_hash,
      origin: { kind: 'file', file_name: 'gilded_ledger.dddnd-pack.json' },
      bundle_text: writePackBundle(demo),
      added_at: '2026-11-22T00:00:00.000Z',
    })

    const { adapter, communityPacks } = await setupWith(store)
    expect(await adapter.ensurePacksRestored()).toEqual([expect.objectContaining({ reason: expect.stringMatching(/doesn't match where it says it came from/) })])
    expect(communityPacks.value).toEqual([])
  })

  async function setupWith(store: import('@/domains/persistence/adapters/community_pack_store').CommunityPackStore) {
    const { createDiskBackedRegistry, readFirstPartyManifest } = await import('../content/support/demo_pack')
    const communityPacks = ref<import('@/domains/content/model').PackSnapshot[]>([])
    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry: ref<ContentPackRegistry | null>(null), externalManifestUrls: ref<string[]>([]), communityPacks },
      {
        resolveManifestUrls: () => ['base', 'tutorial'],
        loadManifestByUrl: async (id: string) => readFirstPartyManifest(id as 'base' | 'tutorial'),
        createRegistry: createDiskBackedRegistry,
        openPackStore: async () => store,
      },
    )
    return { adapter, communityPacks }
  }
})

describe('storing packs that passed through Vue reactivity (M2.6 regression)', () => {
  it('keeps a pack whose snapshot is a reactive proxy (IndexedDB rejects proxies)', async () => {
    const { reactive } = await import('vue')
    const { createMemoryCommunityPackStore } = await import('@/domains/persistence/adapters/community_pack_store')
    const { createDiskBackedRegistry, demoPackSnapshot, readFirstPartyManifest } = await import('../content/support/demo_pack')
    const store = createMemoryCommunityPackStore(true)
    const adapter = createGameStoreContentAdapter(
      { contentPackRegistry: ref<ContentPackRegistry | null>(null), externalManifestUrls: ref<string[]>([]), communityPacks: ref([]) },
      {
        resolveManifestUrls: () => ['base'],
        loadManifestByUrl: async () => readFirstPartyManifest('base'),
        createRegistry: createDiskBackedRegistry,
        openPackStore: async () => store,
      },
    )

    const proxied = reactive(await demoPackSnapshot())
    expect(await adapter.addCommunityPack(proxied)).toEqual({ kept: true })
    expect(await store.list()).toHaveLength(1)
  })
})
