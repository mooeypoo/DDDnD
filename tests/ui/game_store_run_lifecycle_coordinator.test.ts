import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type {
  GameState,
  PlayTurnResult,
  RunOutcome,
  SimulationEngine,
  TurnBriefing,
} from '@/domains/simulation'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import type { ScenarioBundle } from '@/domains/content/model'
import { createGameStoreRunLifecycleCoordinator } from '@/ui/stores/game_store_run_lifecycle_coordinator'

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    engine: ref<SimulationEngine | null>(null),
    gameState: ref<GameState | null>(null),
    scenarioBundle: ref<ScenarioBundle | null>(null),
    turnBriefing: ref<TurnBriefing | null>(null),
    lastTurnResolution: ref<PlayTurnResult | null>(null),
    runOutcome: ref<RunOutcome | null>(null),
    isLoadingBundle: ref(false),
    isPlayingTurn: ref(false),
    isIntroSplashOpen: ref(false),
    isTutorialCompleteSplashOpen: ref(false),
    isRunComplete: ref(false),
    ...overrides,
  }
}

function makeEngine(input: {
  createRunState?: GameState
  playResult?: PlayTurnResult
  briefing?: TurnBriefing
  outcome?: RunOutcome | null
} = {}): SimulationEngine {
  const createRunState =
    input.createRunState ??
    ({ player_profile: {}, progress: { current_turn: 1, run_status: 'in_progress' } } as unknown as GameState)

  const playResult =
    input.playResult ??
    ({
      game_state: { progress: { current_turn: 2, run_status: 'in_progress' } },
      turn_resolution_context: { selected_action: { id: 'card_a', version: 1 } },
      turn_history_entry: { turn_number: 1 },
    } as unknown as PlayTurnResult)

  const briefing = input.briefing ?? ({ turn_number: 1 } as unknown as TurnBriefing)
  const outcome = input.outcome ?? ({ outcome_tier: 'success' } as unknown as RunOutcome)

  return {
    create_run: vi.fn(() => createRunState),
    restore_run: vi.fn((gameState: GameState) => gameState),
    get_turn_briefing: vi.fn(() => briefing),
    play_turn: vi.fn(() => playResult),
    get_run_outcome: vi.fn(() => outcome),
  }
}

describe('game_store_run_lifecycle_coordinator', () => {
  it('starts a run, applies profile fields, and prepares first briefing', async () => {
    const initialState = {
      player_profile: {},
      progress: { current_turn: 1, run_status: 'in_progress' },
    } as unknown as GameState
    const briefing = { turn_number: 1 } as unknown as TurnBriefing
    const engine = makeEngine({ createRunState: initialState, briefing })

    const state = makeState({ isIntroSplashOpen: ref(false) })

    const provider = {
      loadChallengeModifier: vi.fn(async () => ({ id: 'nightmare_mode', version: 1 })),
      loadPlayerClass: vi.fn(async () => ({ id: 'boundary_mage', version: 1, score_affinity: 'domain_clarity' })),
    } as unknown as ContentProvider

    const bundle = {
      scenario: { id: 'scenario_a', version: 1, is_tutorial: true },
    } as unknown as ScenarioBundle

    const tutorial = {
      isTutorialMode: ref(false),
      initTutorial: vi.fn(async () => undefined),
      resetTutorial: vi.fn(),
      advanceToTrigger: vi.fn(),
    }

    const persistRunState = vi.fn()
    const initializeEngine = vi.fn(() => {
      state.engine.value = engine
      state.scenarioBundle.value = bundle
    })

    const coordinator = createGameStoreRunLifecycleCoordinator(state, {
      getMergedContentProvider: vi.fn(async () => provider),
      buildScenarioBundle: vi.fn(async () => bundle),
      initializeEngine,
      persistRunState,
      tutorial,
    })

    await coordinator.startNewRun({
      scenario_id: 'scenario_a',
      scenario_version: 1,
      selected_class_ref: { id: 'boundary_mage', version: 1 },
      selected_challenge_modifier_ref: { id: 'nightmare_mode', version: 1 },
      character_name: 'Ada',
      seed: 'seed-a',
      is_tutorial: true,
    })

    expect(initializeEngine).toHaveBeenCalledWith(bundle, 'seed-a')
    expect(state.gameState.value).toEqual(initialState)
    expect(state.turnBriefing.value).toEqual(briefing)
    expect(initialState.player_profile).toMatchObject({
      selected_class_ref: { id: 'boundary_mage', version: 1 },
      challenge_modifier_ref: { id: 'nightmare_mode', version: 1 },
      class_score_affinity: 'domain_clarity',
      display_name: 'Ada',
    })
    expect(persistRunState).toHaveBeenCalledTimes(1)
    expect(tutorial.initTutorial).toHaveBeenCalledTimes(1)
    expect(tutorial.resetTutorial).not.toHaveBeenCalled()
    expect(state.lastTurnResolution.value).toBeNull()
    expect(state.runOutcome.value).toBeNull()
    expect(state.isIntroSplashOpen.value).toBe(true)
    expect(state.isLoadingBundle.value).toBe(false)
  })

  it('refreshes turn briefing and only triggers turn_start when intro splash is closed', () => {
    const briefing = { turn_number: 3 } as unknown as TurnBriefing
    const engine = makeEngine({ briefing })

    const state = makeState({
      engine: ref(engine),
      gameState: ref({ progress: { current_turn: 3 } } as unknown as GameState),
      isIntroSplashOpen: ref(false),
    })

    const tutorial = {
      isTutorialMode: ref(false),
      initTutorial: vi.fn(async () => undefined),
      resetTutorial: vi.fn(),
      advanceToTrigger: vi.fn(),
    }

    const coordinator = createGameStoreRunLifecycleCoordinator(state, {
      getMergedContentProvider: vi.fn(async () => ({} as ContentProvider)),
      buildScenarioBundle: vi.fn(async () => ({} as ScenarioBundle)),
      initializeEngine: vi.fn(),
      persistRunState: vi.fn(),
      tutorial,
    })

    coordinator.refreshTurnBriefing()
    expect(state.turnBriefing.value).toEqual(briefing)
    expect(tutorial.advanceToTrigger).toHaveBeenCalledWith('turn_start', 3)

    state.isIntroSplashOpen.value = true
    coordinator.refreshTurnBriefing()
    expect(tutorial.advanceToTrigger).toHaveBeenCalledTimes(1)
  })

  it('plays a turn, persists state, and refreshes briefing while run remains active', async () => {
    const nextBriefing = { turn_number: 2 } as unknown as TurnBriefing
    const playResult = {
      game_state: { progress: { current_turn: 2, run_status: 'in_progress' } },
      turn_resolution_context: { selected_action: { id: 'card_a', version: 1 } },
      turn_history_entry: { turn_number: 1 },
    } as unknown as PlayTurnResult

    const engine = makeEngine({ playResult, briefing: nextBriefing })

    const state = makeState({
      engine: ref(engine),
      isRunComplete: ref(false),
      isIntroSplashOpen: ref(false),
    })

    const tutorial = {
      isTutorialMode: ref(false),
      initTutorial: vi.fn(async () => undefined),
      resetTutorial: vi.fn(),
      advanceToTrigger: vi.fn(),
    }

    const persistRunState = vi.fn()

    const coordinator = createGameStoreRunLifecycleCoordinator(state, {
      getMergedContentProvider: vi.fn(async () => ({} as ContentProvider)),
      buildScenarioBundle: vi.fn(async () => ({} as ScenarioBundle)),
      initializeEngine: vi.fn(),
      persistRunState,
      tutorial,
    })

    const result = await coordinator.playTurn('card_a')

    expect(result).toEqual(playResult)
    expect(state.gameState.value).toEqual(playResult.game_state)
    expect(state.lastTurnResolution.value).toEqual(playResult)
    expect(state.turnBriefing.value).toEqual(nextBriefing)
    expect(persistRunState).toHaveBeenCalledTimes(1)
    expect(tutorial.advanceToTrigger).toHaveBeenCalledWith('turn_end', 1)
    expect(tutorial.advanceToTrigger).not.toHaveBeenCalledWith('run_end')
    expect(state.isPlayingTurn.value).toBe(false)
  })

  it('finalizes run outcome and tutorial completion on completed turns', async () => {
    const playResult = {
      game_state: { progress: { current_turn: 3, run_status: 'success' } },
      turn_resolution_context: { selected_action: { id: 'card_b', version: 1 } },
      turn_history_entry: { turn_number: 2 },
    } as unknown as PlayTurnResult
    const outcome = { outcome_tier: 'success' } as unknown as RunOutcome

    const engine = makeEngine({ playResult, outcome })

    const state = makeState({
      engine: ref(engine),
      isRunComplete: ref(true),
    })

    const tutorial = {
      isTutorialMode: ref(true),
      initTutorial: vi.fn(async () => undefined),
      resetTutorial: vi.fn(),
      advanceToTrigger: vi.fn(),
    }

    const coordinator = createGameStoreRunLifecycleCoordinator(state, {
      getMergedContentProvider: vi.fn(async () => ({} as ContentProvider)),
      buildScenarioBundle: vi.fn(async () => ({} as ScenarioBundle)),
      initializeEngine: vi.fn(),
      persistRunState: vi.fn(),
      tutorial,
    })

    await coordinator.playTurn('card_b')

    expect(state.runOutcome.value).toEqual(outcome)
    expect(tutorial.advanceToTrigger).toHaveBeenCalledWith('run_end')
    expect(state.isTutorialCompleteSplashOpen.value).toBe(true)
    expect(state.isPlayingTurn.value).toBe(false)
  })
})
