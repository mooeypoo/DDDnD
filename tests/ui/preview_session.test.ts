/**
 * A preview of a Pack Studio pack writes nothing (docs/PACK_STUDIO.md §11, D15):
 * no saved run is written, read or cleared, no pack is stored, and the
 * player's preferences stay as they were. The content mocks are the store
 * orchestration tests' own.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { ContentPackManifest } from '@/domains/content/model'

vi.mock('@/ui/services/quest_loader', async () => {
  const actual = await vi.importActual<typeof import('@/ui/services/quest_loader')>(
    '@/ui/services/quest_loader'
  )
  // Quests carry their scenario's win-rate band, as the real loader reads it (journal M3.8)
  const { baseQuest } = await import('../support/base_balance_targets')
  return {
    ...actual,
    loadQuestDisplayModels: vi.fn(async (scenarioRefs: Array<{ id: string; version: number }>, _provider: unknown, packKey: string) =>
      scenarioRefs.map((ref) => ({
        packKey,
        id: ref.id,
        version: ref.version,
        name: `${ref.id} name`,
        description: `${ref.id} description`,
        shortDescription: `${ref.id} short`,
        flavorText: `${ref.id} flavor`,
        turnCount: 8,
        stakeholderCount: 4,
        actionCardCount: 10,
        winRateTarget: baseQuest(ref.id).winRateTarget,
      }))
    )
  }
})

vi.mock('@/domains/content/services/manifest_loader', () => {
  const baseManifest: ContentPackManifest = {
    schema_version: 1,
    kind: 'standalone',
    id: 'base',
    version: '1.0.0',
    name: 'Base',
    description: 'Base pack',
    depends_on: [],
    base_url: '/content',
    license: 'GPL-3.0-only',
    authors: [{ name: 'Test Author' }],
    scenarios: [
      { id: 'monolith_of_mild_despair', version: 1 },
      { id: 'microservice_sprawl', version: 1 },
      { id: 'compliance_gauntlet', version: 1 },
      { id: 'startup_hypergrowth', version: 1 },
    ],
    classes: [
      { id: 'boundary_mage', version: 1 },
      { id: 'stakeholder_bard', version: 1 },
    ],
    challenge_modifiers: [],
    tutorials: [],
    content: {
      scenarios: [
        'monolith_of_mild_despair-v1.json',
        'microservice_sprawl-v1.json',
        'compliance_gauntlet-v1.json',
        'startup_hypergrowth-v1.json',
      ],
      cards: [],
      stakeholders: [],
      stakeholder_reaction_rules: [],
      scores: [],
      events: [],
      delayed_effects: [],
      outcome_tiers: [],
      outcome_archetypes: [],
      classes: ['boundary_mage-v1.json', 'stakeholder_bard-v1.json'],
      challenge_modifiers: [],
    },
  }

  const tutorialManifest: ContentPackManifest = {
    schema_version: 1,
    kind: 'extension',
    id: 'tutorial',
    version: '1.0.0',
    name: 'Tutorial',
    description: 'Tutorial pack',
    depends_on: [{ pack_id: 'base', version: '1.0.0' }],
    base_url: '/content/tutorial',
    license: 'GPL-3.0-only',
    authors: [{ name: 'Test Author' }],
    scenarios: [],
    classes: [],
    challenge_modifiers: [],
    tutorials: [
      { id: 'tutorial_basics', version: 1 },
      { id: 'tutorial_systems_under_pressure', version: 1 },
    ],
    content: {
      scenarios: ['tutorial_basics-v1.json', 'tutorial_systems_under_pressure-v1.json'],
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

  return {
    loadManifest: vi.fn(async (url: string) => (url.includes('/tutorial/') ? tutorialManifest : baseManifest)),
  }
})

vi.mock('@/domains/content', async () => {
  const actual = await vi.importActual<typeof import('@/domains/content')>('@/domains/content')
  const { buildScenarioBundle: realBuildScenarioBundle } = await vi.importActual<
    typeof import('@/domains/content/services/bundle_builder')
  >('@/domains/content/services/bundle_builder')
  const { createMockContentProvider } = await import('../content/test_helpers')

  return {
    ...actual,
    createContentProvider: vi.fn(() => createMockContentProvider()),
    buildScenarioBundle: vi.fn(async (_scenarioId: string, _scenarioVersion: number) =>
      realBuildScenarioBundle('test_scenario', 1, createMockContentProvider())
    )
  }
})

import { PREVIEW_WINDOW_NAME } from '@/domains/content/services/preview_handoff'
import { setBriefingDismissed, BRIEFING_DISMISSED_STORAGE_KEY } from '@/ui/services/player_preferences'
import { resetPreviewSessionForTests } from '@/ui/preview/preview_session'
import { useGameStore } from '@/ui/stores/game_store'

const SAVE_KEY = 'dddnd.mvp.save_file'

describe('a preview tab', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(SAVE_KEY, 'THE PLAYER\'S REAL SAVED RUN')
    window.name = PREVIEW_WINDOW_NAME
    resetPreviewSessionForTests()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    window.name = ''
    resetPreviewSessionForTests()
  })

  it('plays a run without writing, reading or clearing the player\'s saved run', async () => {
    const store = useGameStore()
    expect(store.isPreview).toBe(true)
    // The real save is never offered back in a preview
    expect(await store.restore_saved_run()).toBe(false)

    await store.start_new_run({ pack_key: 'dddnd:base', scenario_id: 'monolith_of_mild_despair', scenario_version: 1, seed: 'preview-seed' })
    await store.play_turn(store.turnBriefing!.available_action_card_ids[0])
    expect(store.gameState?.progress.current_turn).toBe(2)
    // The play screens call reset() for a new game; in a preview it leaves the real save alone
    store.reset()

    expect(window.localStorage.getItem(SAVE_KEY)).toBe('THE PLAYER\'S REAL SAVED RUN')
    expect(window.localStorage.length).toBe(1)
  })

  it('never stores a preference', () => {
    setBriefingDismissed(true)
    expect(window.localStorage.getItem(BRIEFING_DISMISSED_STORAGE_KEY)).toBeNull()
  })

  it('is the only place a Studio pack can be added in memory', async () => {
    window.name = ''
    resetPreviewSessionForTests()
    setActivePinia(createPinia())
    const store = useGameStore()
    expect(store.isPreview).toBe(false)
    await expect(store.add_preview_pack({} as never)).rejects.toThrow(/Only a preview tab/)
  })
})

describe('an ordinary tab', () => {
  it('is not a preview', () => {
    window.name = ''
    resetPreviewSessionForTests()
    setActivePinia(createPinia())
    expect(useGameStore().isPreview).toBe(false)
  })
})
