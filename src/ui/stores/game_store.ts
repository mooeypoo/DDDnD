/**
 * Game Store
 * 
 * Manages game state in the UI layer using Pinia.
 * 
 * Responsibilities:
 * - Hold current game state
 * - Call simulation engine services
 * - Expose state and actions to Vue components
 * 
 * IMPORTANT: This store must NOT implement game logic.
 * It only calls the simulation engine and stores results.
 * 
 * All game rules belong in src/domains/simulation.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  GameState, 
  SimulationEngine, 
  TurnBriefing, 
  PlayTurnResult,
  RunOutcome
} from '@/domains/simulation'
import type { ScenarioBundle, VersionRef, PlayerClass, ChallengeModifier } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { create_engine } from '@/domains/simulation'
import { createLocalStorageSaveAdapter } from '@/domains/persistence/adapters'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { loadQuestDisplayModels } from '@/ui/services/quest_loader'
import { useTutorialState } from '@/ui/composables/tutorial_state'
import { createGameStoreContentAdapter } from './game_store_content_adapter'
import { createGameStorePersistenceAdapter } from './game_store_persistence_adapter'
import {
  createGameStoreRunLifecycleCoordinator,
  type RunSetupOptionsLike,
} from './game_store_run_lifecycle_coordinator'

export interface RunSetupOptions {
  scenario_id: string
  scenario_version: number
  selected_class_ref?: VersionRef
  selected_challenge_modifier_ref?: VersionRef
  character_name?: string
  seed?: string
  /** When true, loads content from the tutorial namespace */
  is_tutorial?: boolean
}

/**
 * Main UI orchestration store.
 *
 * Coordinates domain service calls, stores UI-facing state, and manages run
 * lifecycle interactions. Game rules remain in simulation domain services.
 */
export const useGameStore = defineStore('game', () => {
  const saveAdapter = createLocalStorageSaveAdapter()
  const persistenceAdapter = createGameStorePersistenceAdapter(saveAdapter)

  // Core state
  const engine = ref<SimulationEngine | null>(null)
  const gameState = ref<GameState | null>(null)
  const scenarioBundle = ref<ScenarioBundle | null>(null)
  const turnBriefing = ref<TurnBriefing | null>(null)
  const lastTurnResolution = ref<PlayTurnResult | null>(null)
  const runOutcome = ref<RunOutcome | null>(null)
  
  // UI Modal state
  const isAboutModalOpen = ref(false)
  const isRulesModalOpen = ref(false)
  const isDungeonMasterModalOpen = ref(false)
  const isIntroSplashOpen = ref(false)
  const isTutorialCompleteSplashOpen = ref(false)

  // Loading state
  const isLoadingBundle = ref(false)
  const isPlayingTurn = ref(false)
  const isLoadingQuests = ref(false)
  
  // Available quests (loaded from config and content)
  const availableQuests = ref<QuestDisplayModel[]>([])
  
  // Available tutorial quests
  const availableTutorials = ref<QuestDisplayModel[]>([])
  const isLoadingTutorials = ref(false)

  // Tutorial state composable
  const tutorial = useTutorialState()
  
  // Available classes (loaded from content)
  const availableClasses = ref<PlayerClass[]>([])
  const availableChallengeModifiers = ref<ChallengeModifier[]>([])
  const contentPackRegistry = ref<ContentPackRegistry | null>(null)
  const externalManifestUrls = ref<string[]>([])
  const contentAdapter = createGameStoreContentAdapter({
    contentPackRegistry,
    externalManifestUrls,
  })
  
  // Computed
  const hasActiveRun = computed(() => gameState.value !== null)
  const isRunComplete = computed(() => {
    if (!gameState.value) return false
    return gameState.value.progress.run_status !== 'in_progress'
  })
  const currentTurn = computed(() => gameState.value?.progress.current_turn ?? 0)
  const maxTurns = computed(() => gameState.value?.progress.max_turns ?? 0)
  const runLifecycleCoordinator = createGameStoreRunLifecycleCoordinator(
    {
      engine,
      gameState,
      scenarioBundle,
      turnBriefing,
      lastTurnResolution,
      runOutcome,
      isLoadingBundle,
      isPlayingTurn,
      isIntroSplashOpen,
      isTutorialCompleteSplashOpen,
      isRunComplete,
    },
    {
      getMergedContentProvider: get_merged_content_provider,
      buildScenarioBundle,
      initializeEngine: initialize_engine,
      persistRunState: persist_run_state,
      tutorial,
    }
  )
  
  /**
   * Initialize the engine with a scenario bundle
   */
  function initialize_engine(bundle: ScenarioBundle, seed: string) {
    scenarioBundle.value = bundle
    engine.value = create_engine({
      scenario_bundle: bundle,
      seed
    })
  }

  function persist_run_state() {
    persistenceAdapter.persistGameState(gameState.value)
  }

  function set_external_manifest_urls(urls: string[]) {
    contentAdapter.setExternalManifestUrls(urls)
  }

  async function load_content_packs() {
    await contentAdapter.loadContentPacks()
  }

  async function get_merged_content_provider(): Promise<ContentProvider> {
    return contentAdapter.getMergedContentProvider()
  }
  
  /**
   * Load available player classes
   */
  async function load_available_classes() {
    const provider = await get_merged_content_provider()
    const classRefs: VersionRef[] = contentPackRegistry.value?.getAvailableClasses() ?? []
    
    const classes = await Promise.all(
      classRefs.map(ref => provider.loadPlayerClass(ref))
    )
    
    availableClasses.value = classes
  }

  /**
   * Load available challenge modifiers
   */
  async function load_available_challenge_modifiers() {
    const provider = await get_merged_content_provider()
    const modRefs: VersionRef[] = contentPackRegistry.value?.getAvailableChallengeModifiers() ?? []
    
    const mods = await Promise.all(
      modRefs.map(ref => provider.loadChallengeModifier(ref))
    )

    availableChallengeModifiers.value = mods
  }

  async function get_available_outcome_archetype_ids(): Promise<string[]> {
    await load_content_packs()
    const refs = contentPackRegistry.value?.getAvailableOutcomeArchetypes() ?? []
    return refs.map((ref) => ref.id)
  }
  
  /**
   * Load available quests from content pack manifest entry points.
   */
  async function load_available_quests() {
    isLoadingQuests.value = true
    try {
      const provider = await get_merged_content_provider()
      const questRefs = contentPackRegistry.value?.getAvailableScenarios() ?? []
      const quests = await loadQuestDisplayModels(questRefs, provider)
      availableQuests.value = quests
    } finally {
      isLoadingQuests.value = false
    }
  }

  /**
   * Load available tutorial quests from the tutorial content namespace
   */
  async function load_available_tutorials() {
    isLoadingTutorials.value = true
    try {
      const provider = await get_merged_content_provider()
      const tutorialRefs = contentPackRegistry.value?.getAvailableTutorials() ?? []
      const tutorials = await loadQuestDisplayModels(tutorialRefs, provider)
      availableTutorials.value = tutorials
    } finally {
      isLoadingTutorials.value = false
    }
  }
  
  /**
   * Start a new run
   */
  async function start_new_run(options: RunSetupOptions) {
    await runLifecycleCoordinator.startNewRun(options as RunSetupOptionsLike)
  }
  
  /**
   * Refresh turn briefing from engine
   */
  function refresh_turn_briefing() {
    runLifecycleCoordinator.refreshTurnBriefing()
  }
  
  /**
   * Play a turn with the selected action
   */
  async function play_turn(action_id: string) {
    return runLifecycleCoordinator.playTurn(action_id)
  }
  
  /**
   * Get run outcome (if complete)
   */
  function get_run_outcome(): RunOutcome | null {
    if (!engine.value) {
      return null
    }
    
    const outcome = engine.value.get_run_outcome()
    runOutcome.value = outcome
    return outcome
  }
  
  /**
   * Reset store (for new game)
   */
  function reset() {
    engine.value = null
    gameState.value = null
    scenarioBundle.value = null
    turnBriefing.value = null
    lastTurnResolution.value = null
    runOutcome.value = null
    isTutorialCompleteSplashOpen.value = false
    contentPackRegistry.value = null
    tutorial.resetTutorial()
    saveAdapter.clear_saved_run()
  }

  async function restore_saved_run(): Promise<boolean> {
    const restoredGameState = persistenceAdapter.loadRestorableGameState()
    if (!restoredGameState) {
      return false
    }

    try {
      const provider = await get_merged_content_provider()
      const bundle = await buildScenarioBundle(
        restoredGameState.scenario_ref.id,
        restoredGameState.scenario_ref.version,
        provider
      )

      initialize_engine(bundle, restoredGameState.meta.seed)

      if (!engine.value) {
        return false
      }

      engine.value.restore_run(restoredGameState)
      gameState.value = restoredGameState
      lastTurnResolution.value = null

      if (isRunComplete.value) {
        turnBriefing.value = null
        runOutcome.value = engine.value.get_run_outcome()
      } else {
        refresh_turn_briefing()
        runOutcome.value = null
      }

      return true
    } catch {
      reset()
      return false
    }
  }
  
  // Modal actions
  function openAboutModal() {
    isAboutModalOpen.value = true
  }
  
  function closeAboutModal() {
    isAboutModalOpen.value = false
  }
  
  function openRulesModal() {
    isRulesModalOpen.value = true
  }
  
  function closeRulesModal() {
    isRulesModalOpen.value = false
  }

  function openDungeonMasterModal() {
    isDungeonMasterModalOpen.value = true
  }
  
  function closeDungeonMasterModal() {
    isDungeonMasterModalOpen.value = false
  }

  function dismissIntroSplash() {
    isIntroSplashOpen.value = false
    // Fire run_start tutorial trigger, then record turn_start so the next
    // step auto-advances when the run_start hint is dismissed
    tutorial.advanceToTrigger('run_start')
    const turnNow = gameState.value?.progress.current_turn ?? 1
    tutorial.advanceToTrigger('turn_start', turnNow)
  }
  
  return {
    // State
    engine,
    gameState,
    scenarioBundle,
    turnBriefing,
    lastTurnResolution,
    runOutcome,
    availableQuests,
    availableTutorials,
    availableClasses,
    availableChallengeModifiers,
    externalManifestUrls,
    isAboutModalOpen,
    isRulesModalOpen,
    isIntroSplashOpen,
    isDungeonMasterModalOpen,
    isTutorialCompleteSplashOpen,
    isLoadingBundle,
    isPlayingTurn,
    isLoadingQuests,
    isLoadingTutorials,
    
    // Computed
    hasActiveRun,
    isRunComplete,
    currentTurn,
    maxTurns,
    
    // Tutorial
    tutorial,
    
    // Actions
    initialize_engine,
    set_external_manifest_urls,
    load_content_packs,
    load_available_quests,
    load_available_tutorials,
    load_available_classes,
    load_available_challenge_modifiers,
    get_available_outcome_archetype_ids,
    start_new_run,
    refresh_turn_briefing,
    play_turn,
    get_run_outcome,
    restore_saved_run,
    reset,
    openAboutModal,
    closeAboutModal,
    openRulesModal,
    closeRulesModal,
    openDungeonMasterModal,
    closeDungeonMasterModal,
    dismissIntroSplash
  }
})
