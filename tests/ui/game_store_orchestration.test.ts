import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/domains/content', async () => {
  const actual = await vi.importActual<typeof import('@/domains/content')>('@/domains/content')
  const { buildScenarioBundle: realBuildScenarioBundle } = await vi.importActual<
    typeof import('@/domains/content/services/bundle_builder')
  >('@/domains/content/services/bundle_builder')
  const { createMockContentProvider } = await import('../content/test_helpers')

  return {
    ...actual,
    createContentProvider: vi.fn(() => ({})),
    buildScenarioBundle: vi.fn(async () =>
      realBuildScenarioBundle('test_scenario', 1, createMockContentProvider())
    )
  }
})

import { useGameStore } from '@/ui/stores/game_store'

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
})
