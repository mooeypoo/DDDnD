import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/ui/services/quest_loader', async () => {
  const actual = await vi.importActual<typeof import('@/ui/services/quest_loader')>(
    '@/ui/services/quest_loader'
  )
  return {
    ...actual,
    loadQuestDisplayModels: vi.fn(async (scenarioRefs: Array<{ id: string; version: number }>) =>
      scenarioRefs.map((ref) => ({
        id: ref.id,
        version: ref.version,
        name: `${ref.id} name`,
        description: `${ref.id} description`,
        shortDescription: `${ref.id} short`,
        flavorText: `${ref.id} flavor`,
        turnCount: 8,
        stakeholderCount: 4,
        actionCardCount: 10
      }))
    )
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

import { useGameStore } from '@/ui/stores/game_store'
import { buildScenarioBundle } from '@/domains/content'
import { AVAILABLE_QUESTS } from '@/ui/config/available_quests'

describe('game_store orchestration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starting a new run initializes engine-backed run state and turn briefing', async () => {
    const store = useGameStore()

    await store.start_new_run({
      scenario_id: 'monolith_of_mild_despair',
      scenario_version: 1,
      seed: 'store-seed-start'
    })

    expect(store.engine).not.toBeNull()
    expect(store.hasActiveRun).toBe(true)
    expect(store.gameState).not.toBeNull()
    expect(store.gameState?.progress.current_turn).toBe(1)
    expect(store.turnBriefing).not.toBeNull()
    expect(store.turnBriefing?.turn_number).toBe(1)
    expect(store.lastTurnResolution).toBeNull()
    expect(store.runOutcome).toBeNull()
    expect(buildScenarioBundle).toHaveBeenCalledWith(
      'monolith_of_mild_despair',
      1,
      expect.any(Object)
    )
  })

  it('playing a turn updates game_state, turn_resolution, and turn_briefing', async () => {
    const store = useGameStore()

    await store.start_new_run({
      scenario_id: 'monolith_of_mild_despair',
      scenario_version: 1,
      seed: 'store-seed-play'
    })

    const previousGameState = store.gameState
    const previousBriefing = store.turnBriefing
    const actionId = store.turnBriefing?.available_action_card_ids[0]

    expect(actionId).toBeTruthy()
    await store.play_turn(actionId!)

    expect(store.lastTurnResolution).not.toBeNull()
    expect(store.gameState).toBe(store.lastTurnResolution?.game_state)
    expect(store.gameState).not.toBe(previousGameState)
    expect(store.turnBriefing).not.toBeNull()
    expect(store.turnBriefing?.turn_number).toBeGreaterThan(previousBriefing?.turn_number ?? 0)
    expect(store.lastTurnResolution?.turn_resolution_context.selected_action.id).toBe(actionId)
  })

  it('exposes card availability data in turn briefing summaries', async () => {
    const store = useGameStore()

    await store.start_new_run({
      scenario_id: 'monolith_of_mild_despair',
      scenario_version: 1,
      seed: 'store-seed-availability'
    })

    const summary = store.turnBriefing?.available_action_summaries[0]

    expect(summary).toBeDefined()
    expect(summary?.is_playable).toBe(true)
    expect(summary?.usage_limit).toBeNull()
    expect(summary?.cooldown_turns).toBe(0)
    expect(summary?.turns_until_available).toBe(0)
    expect(summary?.uses_remaining).toBeNull()
  })

  it('opening/closing modals changes only UI state and does not reset the run', async () => {
    const store = useGameStore()

    await store.start_new_run({
      scenario_id: 'monolith_of_mild_despair',
      scenario_version: 1,
      seed: 'store-seed-ui-state'
    })

    const runIdBefore = store.gameState?.meta.run_id
    const turnBefore = store.gameState?.progress.current_turn
    const briefingTurnBefore = store.turnBriefing?.turn_number

    store.openAboutModal()
    expect(store.isAboutModalOpen).toBe(true)
    expect(store.isRulesModalOpen).toBe(false)

    store.closeAboutModal()
    expect(store.isAboutModalOpen).toBe(false)

    store.openRulesModal()
    expect(store.isRulesModalOpen).toBe(true)

    store.closeRulesModal()
    expect(store.isRulesModalOpen).toBe(false)

    expect(store.hasActiveRun).toBe(true)
    expect(store.engine).not.toBeNull()
    expect(store.gameState?.meta.run_id).toBe(runIdBefore)
    expect(store.gameState?.progress.current_turn).toBe(turnBefore)
    expect(store.turnBriefing?.turn_number).toBe(briefingTurnBefore)
  })

  it('loads available quests from the UI config', async () => {
    const store = useGameStore()

    expect(store.availableQuests).toHaveLength(0)

    await store.load_available_quests()

    expect(store.availableQuests).toHaveLength(AVAILABLE_QUESTS.length)
    expect(store.availableQuests.map((quest) => quest.id)).toEqual(
      AVAILABLE_QUESTS.map((questRef) => questRef.id)
    )
    expect(store.availableQuests.every((quest) => quest.turnCount > 0)).toBe(true)
    expect(store.availableQuests.every((quest) => quest.stakeholderCount > 0)).toBe(true)
    expect(store.availableQuests.every((quest) => quest.actionCardCount > 0)).toBe(true)
  })
})

