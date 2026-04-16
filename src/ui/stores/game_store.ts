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
import { resolveContentPackManifestUrls } from '@/domains/content/services/content_pack_manifest_urls'
import { loadManifest } from '@/domains/content/services/manifest_loader'
import { create_engine } from '@/domains/simulation'
import { createLocalStorageSaveAdapter } from '@/domains/persistence/adapters'
import { serializeSaveFile, deserializeSaveFile } from '@/domains/persistence/services'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { loadQuestDisplayModels } from '@/ui/services/quest_loader'
import { useTutorialState } from '@/ui/composables/tutorial_state'

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

export const useGameStore = defineStore('game', () => {
  const saveAdapter = createLocalStorageSaveAdapter()

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
  
  // Computed
  const hasActiveRun = computed(() => gameState.value !== null)
  const isRunComplete = computed(() => {
    if (!gameState.value) return false
    return gameState.value.progress.run_status !== 'in_progress'
  })
  const currentTurn = computed(() => gameState.value?.progress.current_turn ?? 0)
  const maxTurns = computed(() => gameState.value?.progress.max_turns ?? 0)
  
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
    if (!gameState.value) {
      return
    }

    const payload = serializeSaveFile(gameState.value)
    const serializedPayload = JSON.stringify(payload)
    saveAdapter.save_serialized_save_file(serializedPayload)
  }

  function set_external_manifest_urls(urls: string[]) {
    externalManifestUrls.value = urls
    contentPackRegistry.value = null
  }

  async function load_content_packs() {
    if (contentPackRegistry.value) {
      return
    }

    const manifestUrls = resolveContentPackManifestUrls(externalManifestUrls.value)
    const manifests = await Promise.all(manifestUrls.map((manifestUrl) => loadManifest(manifestUrl)))

    const registry = new ContentPackRegistry()
    manifests.forEach((manifest) => {
      registry.registerPack(manifest)
    })
    contentPackRegistry.value = registry
  }

  async function get_merged_content_provider(): Promise<ContentProvider> {
    await load_content_packs()
    if (!contentPackRegistry.value) {
      throw new Error('Content pack registry is unavailable after manifest loading')
    }

    return contentPackRegistry.value.createMergedProvider()
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
  
  /**
   * Load available quests from the UI config and scenario content
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
    isLoadingBundle.value = true
    
    try {
      const provider = await get_merged_content_provider()
      const bundle = await buildScenarioBundle(
        options.scenario_id,
        options.scenario_version,
        provider
      )
      
      // Initialize engine with seed
      const seed = options.seed || `seed-${Date.now()}`
      initialize_engine(bundle, seed)
      
      // Create the run (with optional challenge modifier)
      if (!engine.value) {
        throw new Error('Engine not initialized')
      }

      let challengeModifier
      if (options.selected_challenge_modifier_ref) {
        try {
          challengeModifier = await provider.loadChallengeModifier(options.selected_challenge_modifier_ref)
        } catch {
          // Challenge modifier is optional — continue without it
        }
      }
      
      const initialState = engine.value.create_run(
        challengeModifier ? { challenge_modifier: challengeModifier } : undefined
      )
      
      // Apply optional profile settings
      if (options.selected_class_ref) {
        initialState.player_profile.selected_class_ref = options.selected_class_ref
        // Resolve class score_affinity for gameplay bonus
        try {
          const playerClass = await provider.loadPlayerClass(options.selected_class_ref)
          if (playerClass?.score_affinity) {
            initialState.player_profile.class_score_affinity = playerClass.score_affinity
          }
        } catch {
          // Class affinity is optional — continue without it
        }
      }
      if (options.selected_challenge_modifier_ref) {
        initialState.player_profile.challenge_modifier_ref = {
          id: options.selected_challenge_modifier_ref.id,
          version: options.selected_challenge_modifier_ref.version
        }
      }
      if (options.character_name) {
        initialState.player_profile.display_name = options.character_name
      }
      
      gameState.value = initialState
      persist_run_state()

      // Initialize tutorial mode BEFORE first turn briefing so triggers work
      if (options.is_tutorial && bundle.scenario) {
        await tutorial.initTutorial(bundle.scenario)
      } else {
        tutorial.resetTutorial()
      }
      
      // Reset resolution and outcome
      lastTurnResolution.value = null
      runOutcome.value = null

      // Show intro splash BEFORE turn briefing so tutorial triggers
      // don't fire prematurely (turn_start is gated on splash being closed)
      isIntroSplashOpen.value = true

      // Get initial turn briefing (turn_start trigger is deferred while splash is open)
      refresh_turn_briefing()
      
    } finally {
      isLoadingBundle.value = false
    }
  }
  
  /**
   * Refresh turn briefing from engine
   */
  function refresh_turn_briefing() {
    if (!engine.value) {
      throw new Error('No active engine')
    }
    
    turnBriefing.value = engine.value.get_turn_briefing()

    // Advance tutorial to turn_start trigger (skip during initial setup
    // when intro splash is still showing — dismissIntroSplash handles that)
    if (!isIntroSplashOpen.value) {
      const turnNow = gameState.value?.progress.current_turn ?? 1
      tutorial.advanceToTrigger('turn_start', turnNow)
    }
  }
  
  /**
   * Play a turn with the selected action
   */
  async function play_turn(action_id: string) {
    if (!engine.value) {
      throw new Error('No active engine')
    }
    
    isPlayingTurn.value = true
    
    try {
      // Execute turn through engine
      const result = engine.value.play_turn(action_id)
      
      // Update state
      gameState.value = result.game_state
      lastTurnResolution.value = result
      persist_run_state()
      
      // Advance tutorial to turn_end trigger for the just-completed turn
      const completedTurn = (gameState.value?.progress.current_turn ?? 2) - 1
      tutorial.advanceToTrigger('turn_end', completedTurn > 0 ? completedTurn : 1)

      // Refresh briefing for next turn
      if (!isRunComplete.value) {
        refresh_turn_briefing()
      } else {
        // Get final outcome
        runOutcome.value = engine.value.get_run_outcome()
        // Advance tutorial to run_end trigger
        tutorial.advanceToTrigger('run_end')
        // Show tutorial completion splash if in tutorial mode
        if (tutorial.isTutorialMode.value) {
          isTutorialCompleteSplashOpen.value = true
        }
      }
      
      return result
      
    } finally {
      isPlayingTurn.value = false
    }
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
    const loaded = saveAdapter.load_serialized_save_file()
    if (!loaded.ok || !loaded.value) {
      return false
    }

    let parsedPayload: unknown
    try {
      parsedPayload = JSON.parse(loaded.value)
    } catch {
      saveAdapter.clear_saved_run()
      return false
    }

    const restored = deserializeSaveFile(parsedPayload)
    if (!restored.ok) {
      saveAdapter.clear_saved_run()
      return false
    }

    try {
      const provider = await get_merged_content_provider()
      const bundle = await buildScenarioBundle(
        restored.value.game_state.scenario_ref.id,
        restored.value.game_state.scenario_ref.version,
        provider
      )

      initialize_engine(bundle, restored.value.game_state.meta.seed)

      if (!engine.value) {
        return false
      }

      engine.value.restore_run(restored.value.game_state)
      gameState.value = restored.value.game_state
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
