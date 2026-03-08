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
import type { ScenarioBundle, VersionRef, PlayerClass } from '@/domains/content/model'
import { createContentProvider, buildScenarioBundle } from '@/domains/content'
import { create_engine } from '@/domains/simulation'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { loadQuestDisplayModels } from '@/ui/services/quest_loader'
import { AVAILABLE_QUESTS } from '@/ui/config/available_quests'

export interface RunSetupOptions {
  scenario_id: string
  scenario_version: number
  selected_class_ref?: VersionRef
  character_name?: string
  seed?: string
}

export const useGameStore = defineStore('game', () => {
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
  
  // Loading state
  const isLoadingBundle = ref(false)
  const isPlayingTurn = ref(false)
  const isLoadingQuests = ref(false)
  
  // Available quests (loaded from config and content)
  const availableQuests = ref<QuestDisplayModel[]>([])
  
  // Available classes (loaded from content)
  const availableClasses = ref<PlayerClass[]>([])
  
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
  
  /**
   * Load available player classes
   */
  async function load_available_classes() {
    const provider = createContentProvider()
    
    const classRefs: VersionRef[] = [
      { id: 'boundary_mage', version: 1 },
      { id: 'stakeholder_bard', version: 1 },
      { id: 'reliability_cleric', version: 1 },
      { id: 'legacy_ranger', version: 1 },
      { id: 'delivery_rogue', version: 1 }
    ]
    
    const classes = await Promise.all(
      classRefs.map(ref => provider.loadPlayerClass(ref))
    )
    
    availableClasses.value = classes
  }
  
  /**
   * Load available quests from the UI config and scenario content
   */
  async function load_available_quests() {
    isLoadingQuests.value = true
    try {
      const quests = await loadQuestDisplayModels(AVAILABLE_QUESTS)
      availableQuests.value = quests
    } finally {
      isLoadingQuests.value = false
    }
  }
  
  /**
   * Start a new run
   */
  async function start_new_run(options: RunSetupOptions) {
    isLoadingBundle.value = true
    
    try {
      // Load scenario bundle
      const provider = createContentProvider()
      const bundle = await buildScenarioBundle(
        options.scenario_id,
        options.scenario_version,
        provider
      )
      
      // Initialize engine with seed
      const seed = options.seed || `seed-${Date.now()}`
      initialize_engine(bundle, seed)
      
      // Create the run
      if (!engine.value) {
        throw new Error('Engine not initialized')
      }
      
      const initialState = engine.value.create_run()
      
      // Apply optional profile settings
      if (options.selected_class_ref) {
        initialState.player_profile.selected_class_ref = options.selected_class_ref
      }
      if (options.character_name) {
        initialState.player_profile.display_name = options.character_name
      }
      
      gameState.value = initialState
      
      // Get initial turn briefing
      refresh_turn_briefing()
      
      // Reset resolution and outcome
      lastTurnResolution.value = null
      runOutcome.value = null
      
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
      
      // Refresh briefing for next turn
      if (!isRunComplete.value) {
        refresh_turn_briefing()
      } else {
        // Get final outcome
        runOutcome.value = engine.value.get_run_outcome()
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
  
  return {
    // State
    engine,
    gameState,
    scenarioBundle,
    turnBriefing,
    lastTurnResolution,
    runOutcome,
    availableQuests,
    availableClasses,
    isAboutModalOpen,
    isRulesModalOpen,
    isLoadingBundle,
    isPlayingTurn,
    isLoadingQuests,
    
    // Computed
    hasActiveRun,
    isRunComplete,
    currentTurn,
    maxTurns,
    
    // Actions
    initialize_engine,
    load_available_quests,
    load_available_classes,
    start_new_run,
    refresh_turn_briefing,
    play_turn,
    get_run_outcome,
    reset,
    openAboutModal,
    closeAboutModal,
    openRulesModal,
    closeRulesModal
  }
})
