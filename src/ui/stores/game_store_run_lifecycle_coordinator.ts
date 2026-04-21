import type {
  GameState,
  PlayTurnResult,
  RunOutcome,
  SimulationEngine,
  TurnBriefing,
} from '@/domains/simulation'
import type {
  ChallengeModifier,
  PlayerClass,
  Scenario,
  ScenarioBundle,
  VersionRef,
} from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'

interface ValueRef<T> {
  value: T
}

export interface RunSetupOptionsLike {
  scenario_id: string
  scenario_version: number
  selected_class_ref?: VersionRef
  selected_challenge_modifier_ref?: VersionRef
  character_name?: string
  seed?: string
  is_tutorial?: boolean
}

interface TutorialStateLike {
  isTutorialMode: ValueRef<boolean>
  initTutorial: (scenario: Scenario) => Promise<void>
  resetTutorial: () => void
  advanceToTrigger: (triggerType: 'run_start' | 'turn_start' | 'turn_end' | 'run_end', turn?: number) => void
}

interface RunLifecycleState {
  engine: ValueRef<SimulationEngine | null>
  gameState: ValueRef<GameState | null>
  scenarioBundle: ValueRef<ScenarioBundle | null>
  turnBriefing: ValueRef<TurnBriefing | null>
  lastTurnResolution: ValueRef<PlayTurnResult | null>
  runOutcome: ValueRef<RunOutcome | null>
  isLoadingBundle: ValueRef<boolean>
  isPlayingTurn: ValueRef<boolean>
  isIntroSplashOpen: ValueRef<boolean>
  isTutorialCompleteSplashOpen: ValueRef<boolean>
  isRunComplete: ValueRef<boolean>
}

interface RunLifecycleDependencies {
  getMergedContentProvider: () => Promise<ContentProvider>
  buildScenarioBundle: (
    scenarioId: string,
    scenarioVersion: number,
    provider: ContentProvider,
  ) => Promise<ScenarioBundle>
  initializeEngine: (bundle: ScenarioBundle, seed: string) => void
  persistRunState: () => void
  tutorial: TutorialStateLike
}

/**
 * Coordinates run lifecycle orchestration for the game store.
 *
 * This module is UI-store focused orchestration only. Simulation rules remain
 * in domain simulation services.
 */
export function createGameStoreRunLifecycleCoordinator(
  state: RunLifecycleState,
  deps: RunLifecycleDependencies,
) {
  function refreshTurnBriefing(): void {
    if (!state.engine.value) {
      throw new Error('No active engine')
    }

    state.turnBriefing.value = state.engine.value.get_turn_briefing()

    if (!state.isIntroSplashOpen.value) {
      const turnNow = state.gameState.value?.progress.current_turn ?? 1
      deps.tutorial.advanceToTrigger('turn_start', turnNow)
    }
  }

  async function startNewRun(options: RunSetupOptionsLike): Promise<void> {
    state.isLoadingBundle.value = true

    try {
      const provider = await deps.getMergedContentProvider()
      const bundle = await deps.buildScenarioBundle(
        options.scenario_id,
        options.scenario_version,
        provider,
      )

      const seed = options.seed || `seed-${Date.now()}`
      deps.initializeEngine(bundle, seed)

      if (!state.engine.value) {
        throw new Error('Engine not initialized')
      }

      let challengeModifier: ChallengeModifier | undefined
      if (options.selected_challenge_modifier_ref) {
        try {
          challengeModifier = await provider.loadChallengeModifier(options.selected_challenge_modifier_ref)
        } catch {
          // Challenge modifier is optional — continue without it.
        }
      }

      const initialState = state.engine.value.create_run(
        challengeModifier ? { challenge_modifier: challengeModifier } : undefined,
      )

      if (options.selected_class_ref) {
        initialState.player_profile.selected_class_ref = options.selected_class_ref
        try {
          const playerClass: PlayerClass = await provider.loadPlayerClass(options.selected_class_ref)
          if (playerClass?.score_affinity) {
            initialState.player_profile.class_score_affinity = playerClass.score_affinity
          }
        } catch {
          // Class affinity is optional — continue without it.
        }
      }

      if (options.selected_challenge_modifier_ref) {
        initialState.player_profile.challenge_modifier_ref = {
          id: options.selected_challenge_modifier_ref.id,
          version: options.selected_challenge_modifier_ref.version,
        }
      }

      if (options.character_name) {
        initialState.player_profile.display_name = options.character_name
      }

      state.gameState.value = initialState
      deps.persistRunState()

      if (options.is_tutorial && bundle.scenario) {
        await deps.tutorial.initTutorial(bundle.scenario)
      } else {
        deps.tutorial.resetTutorial()
      }

      state.lastTurnResolution.value = null
      state.runOutcome.value = null
      state.isIntroSplashOpen.value = true

      refreshTurnBriefing()
    } finally {
      state.isLoadingBundle.value = false
    }
  }

  async function playTurn(actionId: string): Promise<PlayTurnResult> {
    if (!state.engine.value) {
      throw new Error('No active engine')
    }

    state.isPlayingTurn.value = true

    try {
      const result = state.engine.value.play_turn(actionId)

      state.gameState.value = result.game_state
      state.lastTurnResolution.value = result
      deps.persistRunState()

      const completedTurn = (state.gameState.value?.progress.current_turn ?? 2) - 1
      deps.tutorial.advanceToTrigger('turn_end', completedTurn > 0 ? completedTurn : 1)

      if (!state.isRunComplete.value) {
        refreshTurnBriefing()
      } else {
        state.runOutcome.value = state.engine.value.get_run_outcome()
        deps.tutorial.advanceToTrigger('run_end')
        if (deps.tutorial.isTutorialMode.value) {
          state.isTutorialCompleteSplashOpen.value = true
        }
      }

      return result
    } finally {
      state.isPlayingTurn.value = false
    }
  }

  return {
    startNewRun,
    refreshTurnBriefing,
    playTurn,
  }
}
