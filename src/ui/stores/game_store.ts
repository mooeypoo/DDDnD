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
import type { ScenarioBundle, VersionRef, PlayerClass, ChallengeModifier, PackSnapshot } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content'
import { setActiveScoreOrder } from '@/ui/composables/metric_presentation'
import { setActiveCouplingRules } from '@/ui/composables/system_coupling'
import { couplingRulesOf } from '@/domains/simulation'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { create_engine } from '@/domains/simulation'
import { createLocalStorageSaveAdapter, openCommunityPackStore } from '@/domains/persistence/adapters'
import type { RunContentPack } from '@/domains/simulation/model'
import { isCommunityPacksEnabled } from '@/ui/config/feature_flags'

/** Why a saved community-pack run can't be continued right now (M2.6). */
export interface SavedRunPackNotice {
  /**
   * - `missing`: no pack with that key is added.
   * - `different_version`: the same pack is added, but not the exact content played.
   * - `different_source`: a different pack with the same name is added (ADR 0012).
   */
  reason: 'missing' | 'different_version' | 'different_source'
  pack: RunContentPack
}
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { loadQuestDisplayModels } from '@/ui/services/quest_loader'
import { describePackPublisher } from '@/ui/play/community_pack_review'
import type { PackScenarioRef } from '@/domains/content/services/content_pack_registry'
import { sortQuestsByDifficulty } from '@/ui/play/quest_difficulty'
import {
  hasCompletedTutorial,
  isBriefingDismissed,
  markTutorialCompleted,
  setBriefingDismissed,
} from '@/ui/services/player_preferences'
import { useTutorialState } from '@/ui/composables/tutorial_state'
import { createGameStoreContentAdapter } from './game_store_content_adapter'
import { createGameStorePersistenceAdapter } from './game_store_persistence_adapter'
import {
  createGameStoreRunLifecycleCoordinator,
  type RunSetupOptionsLike,
} from './game_store_run_lifecycle_coordinator'

export interface RunSetupOptions {
  /** Pack the scenario comes from (ADR 0014): `dddnd:base`, `github:…`. */
  pack_key: string
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

  // Onboarding: offer the tutorial until the player has finished one.
  const shouldRecommendTutorial = ref(!hasCompletedTutorial())

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
  /** Community packs the player added this session (ADR 0001, gated by ADR 0009 in the UI). */
  const communityPacks = ref<PackSnapshot[]>([])
  /** In-flight or finished bundle loads, keyed by pack key and scenario id+version. */
  const scenarioBundleLoads = new Map<string, Promise<ScenarioBundle>>()
  const contentAdapter = createGameStoreContentAdapter(
    {
      contentPackRegistry,
      externalManifestUrls,
      communityPacks,
    },
    // ADR 0009: with community packs off, nothing is read from or written to the pack store.
    isCommunityPacksEnabled() ? { openPackStore: () => openCommunityPackStore() } : {},
  )
  /**
   * Set when a saved run can't be continued because the community pack it
   * was played with isn't loaded (or a different version is). The save is
   * kept, not deleted, so the player can add the pack back.
   */
  const savedRunPackNotice = ref<SavedRunPackNotice | null>(null)
  
  // Computed
  const hasActiveRun = computed(() => gameState.value !== null)
  const isRunComplete = computed(() => {
    if (!gameState.value) return false
    return gameState.value.progress.run_status !== 'in_progress'
  })
  const currentTurn = computed(() => gameState.value?.progress.current_turn ?? 0)
  const maxTurns = computed(() => gameState.value?.progress.max_turns ?? 0)
  /** The community pack the current run was played with, if any (by its recorded pack key). */
  const activeCommunityPack = computed(() => {
    if (communityPacks.value.length === 0) return null
    return contentAdapter.findCommunityPack(gameState.value?.meta.content_pack?.key)
  })
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
      getGameWideContentProvider: get_game_wide_content_provider,
      buildScenarioBundle: resolveScenarioBundle,
      initializeEngine: initialize_engine,
      persistRunState: persist_run_state,
      tutorial,
      shouldOpenIntroBriefing: () => !isBriefingDismissed(),
      describePack: (packKey) => contentAdapter.describePack(packKey),
      onTutorialCompleted: () => {
        markTutorialCompleted()
        shouldRecommendTutorial.value = false
      },
    }
  )
  
  /**
   * Initialize the engine with a scenario bundle
   */
  function initialize_engine(bundle: ScenarioBundle, seed: string) {
    scenarioBundle.value = bundle
    setActiveScoreOrder(bundle.scenario.score_refs.map((ref) => ref.id))
    setActiveCouplingRules(couplingRulesOf(bundle))
    engine.value = create_engine({
      scenario_bundle: bundle,
      seed
    })
  }

  function persist_run_state() {
    persistenceAdapter.persistGameState(gameState.value)
  }

  function scenarioBundleKey(packKey: string, scenarioId: string, scenarioVersion: number): string {
    return `${packKey}|${scenarioId}-v${scenarioVersion}`
  }

  /**
   * Builds a scenario bundle with the provider scoped to the scenario's own
   * pack and its dependencies (ADR 0001, ADR 0014).
   */
  async function buildScopedScenarioBundle(packKey: string, scenarioId: string, scenarioVersion: number): Promise<ScenarioBundle> {
    const provider = await contentAdapter.getPackContentProvider(packKey)
    return buildScenarioBundle(scenarioId, scenarioVersion, provider)
  }

  /**
   * Returns a shared bundle load for this scenario.
   *
   * The lobby starts this while the player is still choosing, so sitting down
   * waits on work already in flight instead of starting it from scratch.
   */
  function resolveScenarioBundle(
    packKey: string,
    scenarioId: string,
    scenarioVersion: number,
  ): Promise<ScenarioBundle> {
    const key = scenarioBundleKey(packKey, scenarioId, scenarioVersion)
    const existing = scenarioBundleLoads.get(key)
    if (existing) {
      return existing
    }

    const pending = buildScopedScenarioBundle(packKey, scenarioId, scenarioVersion).catch((error: unknown) => {
      scenarioBundleLoads.delete(key)
      throw error
    })
    scenarioBundleLoads.set(key, pending)
    return pending
  }

  function warm_scenario_bundle(packKey: string, scenarioId: string, scenarioVersion: number): Promise<void> {
    const key = scenarioBundleKey(packKey, scenarioId, scenarioVersion)
    const existing = scenarioBundleLoads.get(key)
    if (existing) {
      return existing.then(() => undefined, () => undefined)
    }

    const pending = buildScopedScenarioBundle(packKey, scenarioId, scenarioVersion)
    scenarioBundleLoads.set(key, pending)
    // The lobby does not await this. Drop a failed warm so the next sit can retry,
    // and attach a handler so a miss does not surface as an unhandled rejection.
    void pending.catch(() => {
      if (scenarioBundleLoads.get(key) === pending) {
        scenarioBundleLoads.delete(key)
      }
    })
    return pending.then(() => undefined, () => undefined)
  }

  function set_external_manifest_urls(urls: string[]) {
    scenarioBundleLoads.clear()
    contentAdapter.setExternalManifestUrls(urls)
  }

  async function load_content_packs() {
    await contentAdapter.loadContentPacks()
  }

  /** Provider for game-wide choices (classes, challenge modifiers). First-party only. */
  async function get_game_wide_content_provider(): Promise<ContentProvider> {
    return contentAdapter.getGameWideContentProvider()
  }
  
  /**
   * Load available player classes
   */
  async function load_available_classes() {
    const provider = await get_game_wide_content_provider()
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
    const provider = await get_game_wide_content_provider()
    const modRefs: VersionRef[] = contentPackRegistry.value?.getAvailableChallengeModifiers() ?? []
    
    const mods = await Promise.all(
      modRefs.map(ref => provider.loadChallengeModifier(ref))
    )

    availableChallengeModifiers.value = mods
  }

  
  /**
   * Marks quests that come from a community pack, with the pack's name and
   * its publisher, so the lobby can label them and tell same-named packs apart.
   */
  function labelCommunityQuests(quests: QuestDisplayModel[]): QuestDisplayModel[] {
    if (communityPacks.value.length === 0) return quests
    return quests.map((quest) => {
      const pack = contentAdapter.findCommunityPack(quest.packKey)
      return pack
        ? { ...quest, communityPack: { name: pack.manifest.name, publisher: describePackPublisher(pack).label } }
        : quest
    })
  }

  /**
   * Loads quest cards for scenario entry points, each through its own pack's
   * scoped provider. A pack that fails to load is skipped, like a failed quest.
   */
  async function loadPackQuests(entries: PackScenarioRef[]): Promise<QuestDisplayModel[]> {
    const byPack = new Map<string, VersionRef[]>()
    for (const entry of entries) {
      byPack.set(entry.pack_key, [...(byPack.get(entry.pack_key) ?? []), entry.ref])
    }
    const loaded = await Promise.all([...byPack].map(async ([packKey, refs]) => {
      try {
        return await loadQuestDisplayModels(refs, await contentAdapter.getPackContentProvider(packKey), packKey)
      } catch (error) {
        console.error(`Failed to load quests from pack ${packKey}:`, error)
        return []
      }
    }))
    return labelCommunityQuests(loaded.flat())
  }

  /**
   * Community packs (M2.5). Checking changes nothing; adding and removing
   * rebuild the registry and the quest list.
   */
  async function check_community_pack(snapshot: PackSnapshot) {
    return contentAdapter.checkCommunityPack(snapshot)
  }

  /** The added pack this one would replace (same key), and same-named packs from elsewhere (shown in the review). */
  /** An added community pack by its pack key, or null. */
  function find_community_pack(packKey: string): PackSnapshot | null {
    return contentAdapter.findCommunityPack(packKey) ?? null
  }

  function find_community_pack_relations(snapshot: PackSnapshot) {
    return contentAdapter.findPackRelations(snapshot)
  }

  /** Stored packs that no longer pass today's checks (restored once per visit). */
  function community_pack_restore_issues() {
    return contentAdapter.ensurePacksRestored()
  }

  /** Whether added packs are kept after a reload in this browser. */
  function is_pack_store_persistent() {
    return contentAdapter.isPackStorePersistent()
  }

  async function add_community_pack(snapshot: PackSnapshot) {
    const result = await contentAdapter.addCommunityPack(snapshot)
    scenarioBundleLoads.clear()
    await Promise.all([load_available_quests(), load_available_tutorials()])
    return result
  }

  async function remove_community_pack(packKey: string) {
    await contentAdapter.removeCommunityPack(packKey)
    scenarioBundleLoads.clear()
    await Promise.all([load_available_quests(), load_available_tutorials()])
  }

  /**
   * Load available quests from content pack manifest entry points.
   */
  async function load_available_quests() {
    isLoadingQuests.value = true
    try {
      await load_content_packs()
      const quests = await loadPackQuests(contentPackRegistry.value?.getAvailableScenarios() ?? [])
      // Gentlest first: the lobby fans these in order and opens the first one.
      availableQuests.value = sortQuestsByDifficulty(quests)
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
      await load_content_packs()
      const tutorials = await loadPackQuests(contentPackRegistry.value?.getAvailableTutorials() ?? [])
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
    // A new run replaces the saved one, so a notice about the old save no longer applies.
    savedRunPackNotice.value = null
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

  async function consult_archives(discard_ids: string[], draw_id?: string) {
    return runLifecycleCoordinator.consultArchives(discard_ids, draw_id)
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
    setActiveScoreOrder([])
    setActiveCouplingRules([])
    turnBriefing.value = null
    lastTurnResolution.value = null
    runOutcome.value = null
    isTutorialCompleteSplashOpen.value = false
    contentPackRegistry.value = null
    tutorial.resetTutorial()
    saveAdapter.clear_saved_run()
  }

  /**
   * For a saved run from a community pack: is that exact pack loaded?
   * Returns a notice when it isn't (the save is then kept, not deleted).
   */
  async function checkSavedRunPack(pack: RunContentPack | undefined): Promise<SavedRunPackNotice | null> {
    if (!pack || pack.origin === 'first_party') return null
    await contentAdapter.loadContentPacks()
    const reason = contentAdapter.whyRunPackUnavailable(pack)
    return reason ? { reason, pack } : null
  }

  /**
   * Looks at the saved run (without restoring it) and sets the notice when
   * the community pack it needs isn't loaded. Used by the lobby, so a player
   * learns why their run can't continue even on a fresh page load.
   */
  async function refresh_saved_run_pack_notice(): Promise<void> {
    if (hasActiveRun.value) {
      savedRunPackNotice.value = null
      return
    }
    const saved = persistenceAdapter.loadRestorableGameState()
    savedRunPackNotice.value = saved ? await checkSavedRunPack(saved.meta.content_pack).catch(() => null) : null
  }

  async function restore_saved_run(): Promise<boolean> {
    const restoredGameState = persistenceAdapter.loadRestorableGameState()
    if (!restoredGameState) {
      return false
    }

    const packNotice = await checkSavedRunPack(restoredGameState.meta.content_pack).catch(() => null)
    if (packNotice) {
      savedRunPackNotice.value = packNotice
      return false
    }
    savedRunPackNotice.value = null

    try {
      const packKey = await contentAdapter.resolveRunPackKey(restoredGameState.scenario_ref, restoredGameState.meta.content_pack?.key)
      if (!packKey) {
        throw new Error(`No loaded pack has scenario ${restoredGameState.scenario_ref.id}-v${restoredGameState.scenario_ref.version}`)
      }
      const bundle = await resolveScenarioBundle(
        packKey,
        restoredGameState.scenario_ref.id,
        restoredGameState.scenario_ref.version,
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

  /**
   * Records whether future runs should skip the opening briefing.
   */
  function setIntroBriefingMuted(muted: boolean) {
    setBriefingDismissed(muted)
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
    shouldRecommendTutorial,
    isLoadingBundle,
    isPlayingTurn,
    isLoadingQuests,
    isLoadingTutorials,
    communityPacks,
    savedRunPackNotice,
    
    // Computed
    hasActiveRun,
    isRunComplete,
    currentTurn,
    maxTurns,
    activeCommunityPack,
    
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
    check_community_pack,
    find_community_pack,
    find_community_pack_relations,
    add_community_pack,
    remove_community_pack,
    is_pack_store_persistent,
    refresh_saved_run_pack_notice,
    community_pack_restore_issues,
    start_new_run,
    warm_scenario_bundle,
    refresh_turn_briefing,
    play_turn,
    consult_archives,
    get_run_outcome,
    restore_saved_run,
    reset,
    openAboutModal,
    closeAboutModal,
    openRulesModal,
    closeRulesModal,
    openDungeonMasterModal,
    closeDungeonMasterModal,
    setIntroBriefingMuted,
    dismissIntroSplash
  }
})
