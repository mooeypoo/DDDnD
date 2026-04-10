<template>
  <div class="game-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />
    <CardDetailsModal
      v-if="modalCardId && modalCard"
      :isOpen="!!modalCardId"
      :card="modalCard"
      :isDisabled="gameStore.isPlayingTurn"
      :isTutorialLocked="isTutorialCardLocked(modalCardId)"
      :availability="modalCardAvailability"
      :stakeholderNames="stakeholderNames"
      :scores="gameStore.turnBriefing?.current_scores"
      @close="modalCardId = null"
      @play="handlePlayCard"
    />

    <RunIntroSplash
      :isOpen="gameStore.isIntroSplashOpen"
      :playerName="playerDisplayName"
      :playerClassName="playerClassName"
      :playerClassId="playerClassId"
      :scenarioName="scenario?.name"
      :scores="gameStore.gameState?.scores ?? {}"
      :stakeholders="gameStore.gameState?.stakeholders ?? {}"
      :stakeholderNames="stakeholderNames"
      :maxTurns="gameStore.maxTurns"
      :isTutorial="gameStore.tutorial.isTutorialMode"
      @start="gameStore.dismissIntroSplash"
    />

    <TutorialCompleteSplash
      :isOpen="gameStore.isTutorialCompleteSplashOpen"
      :currentScenarioId="scenario?.id ?? ''"
      :availableTutorials="gameStore.availableTutorials"
      @launchTutorial="handleLaunchAnotherTutorial"
      @startRealGame="handleStartRealGame"
    />

    <GameMasthead
      @show-rules="gameStore.openRulesModal"
      @show-about="gameStore.openAboutModal"
      @show-dungeon-master="gameStore.openDungeonMasterModal"
      @reset-run="handleResetRun"
    />

    <TutorialExitBar
      :isTutorial="gameStore.tutorial.isTutorialMode"
      @leave="handleLeaveTutorial"
    />

    <div class="game-shell" :class="{ 'drawer-open': isSatchelOpen }">
      <header class="play-header">
        <div class="header-row">
          <p class="turn-pill">Turn {{ gameStore.currentTurn }} / {{ gameStore.maxTurns }}</p>
          <div class="score-strip" v-if="scoreEntries.length > 0">
            <span v-for="score in scoreEntries" :key="score.id" class="score-chip">
              <span class="score-chip-label">{{ score.label }}</span>
              <span class="score-chip-value">{{ score.value }}</span>
            </span>
          </div>
          <StakeholderHud
            v-if="gameStore.gameState?.stakeholders"
            :stakeholders="gameStore.gameState.stakeholders"
            :stakeholderNames="stakeholderNames"
          />
        </div>
      </header>

      <main class="play-main">
        <section class="stage-section">
          <SceneStage :scene-id="gameplaySceneId" :actors="stageActors" />
        </section>

        <section class="narrative-section">
          <TutorialHintPanel
            v-if="gameStore.tutorial.isTutorialMode"
            :isVisible="gameStore.tutorial.isHintVisible"
            :step="gameStore.tutorial.currentStep"
            :stepNumber="gameStore.tutorial.currentStepNumber"
            :totalSteps="gameStore.tutorial.totalSteps"
            @dismiss="gameStore.tutorial.dismissCurrentHint"
          />

          <div v-if="gameStore.isRunComplete" class="run-complete-card">
            <div class="complete-icon">🏁</div>
            <h2 class="complete-title">Run Complete!</h2>
            <p class="complete-message">Your architectural journey has reached its conclusion.</p>
            <button
              class="btn-view-results"
              :disabled="gameStore.tutorial.isTutorialMode"
              @click="goToEndScreen"
            >
              <span class="btn-text">View Results</span>
              <span class="btn-icon">→</span>
            </button>
          </div>

          <TurnBriefingPanel
            v-if="gameStore.turnBriefing && !gameStore.isRunComplete"
            :event-title="currentEventTitle"
            :narrative-description="currentEventDescription"
            :available-actions="currentAvailableActions"
            :pending-aftershocks="pendingAftershockCount"
            :current-turn="gameStore.currentTurn"
            :total-turns="gameStore.maxTurns"
            :isTutorial="gameStore.tutorial.isTutorialMode"
          />

          <div
            v-if="gameStore.turnBriefing && !gameStore.isRunComplete && pendingAftershockCount > 0"
            ref="aftershockAlertRef"
            class="aftershock-alert"
          >
            <div class="alert-icon">⚡</div>
            <div class="alert-content">
              <div class="alert-title">Architectural Aftershocks Incoming</div>
              <div class="alert-message">
                {{ pendingAftershockCount }} delayed effect{{ pendingAftershockCount > 1 ? 's' : '' }} will resolve this turn
              </div>
            </div>
          </div>

          <div
            v-if="gameStore.lastTurnResolution && gameStore.lastTurnResolution.turn_resolution_context"
            ref="turnResolutionPanelRef"
          >
            <TurnResolutionPanel
              :turnResolution="gameStore.lastTurnResolution.turn_resolution_context"
              :stakeholderNames="stakeholderNames"
            />
          </div>
        </section>
      </main>
    </div>

    <SatchelToggleButton
      v-if="!gameStore.isRunComplete && !isSatchelOpen"
      :totalCards="availableCardEntries.length"
      :playableCards="playableCardCount"
      @open="isSatchelOpen = true"
    />

    <CardSatchelDrawer
      v-if="!gameStore.isRunComplete"
      v-model:isOpen="isSatchelOpen"
      :totalCards="availableCardEntries.length"
      :playableCards="playableCardCount"
    >
      <template #toolbar>
        <SatchelToolbar
          v-if="availableCardEntries.length > 0"
          :availableCategories="availableCategories"
          :affectedMetrics="affectedMetrics"
          v-model:activeCategory="satchelCategory"
          v-model:activeSort="satchelSort"
        />
      </template>

      <ActionCard
        v-for="entry in filteredSortedCards"
        :key="entry.card.id + '-v' + entry.card.version"
        :card="entry.card"
        :availability="entry.availability"
        :isDisabled="gameStore.isPlayingTurn"
        :isTutorialLocked="isTutorialCardLocked(entry.card.id)"
        :isTutorialHighlighted="isTutorialCardHighlighted(entry.card.id)"
        :scores="gameStore.turnBriefing?.current_scores"
        @showDetails="handleShowDetails(entry.card.id)"
        @play="handlePlayCard"
      />
    </CardSatchelDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { Card } from '@/domains/content/model'
import { versionRefKey } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { buildStakeholderNamesMap } from '@/ui/composables/stakeholder_presentation'
import {
  buildGameplayStageActors,
  pickRandomSceneId,
  shuffleAvatarRoles,
} from '@/ui/composables/gameplay_stage_presentation'
import type { AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import ActionCard from '@/ui/components/cards/action_card.vue'
import CardSatchelDrawer from '@/ui/components/cards/card_satchel_drawer.vue'
import SatchelToolbar from '@/ui/components/cards/satchel_toolbar.vue'
import TurnResolutionPanel from '@/ui/components/turn/turn_resolution_panel.vue'
import TurnBriefingPanel from '@/ui/components/turn/turn_briefing_panel.vue'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import GameMasthead from '@/ui/components/branding/game_masthead.vue'
import RunIntroSplash from '@/ui/components/common/run_intro_splash.vue'
import TutorialHintPanel from '@/ui/components/tutorial/tutorial_hint_panel.vue'
import TutorialExitBar from '@/ui/components/tutorial/tutorial_exit_bar.vue'
import TutorialCompleteSplash from '@/ui/components/tutorial/tutorial_complete_splash.vue'
import StakeholderHud from '@/ui/components/stakeholders/stakeholder_hud.vue'
import SceneStage from '@/ui/components/gameplay/scene_stage.vue'
import SatchelToggleButton from '@/ui/components/cards/satchel_toggle_button.vue'
import {
  filterByCategory,
  sortCards,
  getAvailableCategories,
  getAffectedMetrics,
} from '@/ui/composables/card_filter_sort'
import type { CategoryFilter, SortOption } from '@/ui/composables/card_filter_sort'

const router = useRouter()
const gameStore = useGameStore()

const modalCardId = ref<string | null>(null)
const aftershockAlertRef = ref<HTMLElement | null>(null)
const turnResolutionPanelRef = ref<HTMLElement | null>(null)
const isSatchelOpen = ref(false)
const randomSceneId = ref<SceneBackgroundId>(pickRandomSceneId())
const randomAvatarRoles = ref<AvatarRoleId[]>(shuffleAvatarRoles())
const satchelCategory = ref<CategoryFilter>('all')
const satchelSort = ref<SortOption>('default')

const SMALL_MOBILE_BREAKPOINT_PX = 480
const MOBILE_BREAKPOINT_PX = 768
const SCROLL_OFFSET_DESKTOP_PX = 120
const SCROLL_OFFSET_MOBILE_PX = 140
const SCROLL_OFFSET_SMALL_MOBILE_PX = 160

const scenario = computed(() => gameStore.scenarioBundle?.scenario)

const playerDisplayName = computed(() => gameStore.gameState?.player_profile.display_name)

const playerClassName = computed(() => {
  const classRef = gameStore.gameState?.player_profile.selected_class_ref
  if (!classRef) return undefined
  const found = gameStore.availableClasses.find(
    c => c.id === classRef.id && c.version === classRef.version
  )
  return found?.name
})

const playerClassId = computed(() => {
  return gameStore.gameState?.player_profile.selected_class_ref?.id
})

const currentEventTitle = computed(() => {
  return 'The Realm Awaits Your Command'
})

const currentEventDescription = computed(() => {
  return 'Your party looks to you for guidance. Open your Action Satchel below and choose an architectural scroll to shape the fate of this system.'
})

const gameplaySceneId = computed(() => randomSceneId.value)

const scoreEntries = computed(() => {
  const scores = gameStore.turnBriefing?.current_scores
  if (!scores) {
    return []
  }

  return Object.entries(scores).map(([id, value]) => ({
    id,
    label: id
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    value: Math.round(value),
  }))
})

const currentAvailableActions = computed(() => {
  return gameStore.turnBriefing?.available_action_card_ids.length ?? 0
})

const pendingAftershockCount = computed(() => {
  return gameStore.turnBriefing?.pending_delayed_effects_resolving_this_turn.length ?? 0
})

const availabilitySummaryByKey = computed(() => {
  const entries = new Map<string, TurnBriefingActionSummary>()

  for (const summary of gameStore.turnBriefing?.available_action_summaries ?? []) {
    entries.set(versionRefKey({ id: summary.card_id, version: summary.card_version }), summary)
  }

  return entries
})

const availableCardEntries = computed(() => {
  if (!gameStore.turnBriefing || !gameStore.scenarioBundle) {
    return []
  }

  const cards: Array<{ card: Card; availability: TurnBriefingActionSummary | undefined }> = []
  for (const actionRef of gameStore.gameState?.action_state.available_action_refs || []) {
    const card = gameStore.scenarioBundle.cards.get(versionRefKey(actionRef))
    if (card) {
      cards.push({
        card,
        availability: availabilitySummaryByKey.value.get(versionRefKey(actionRef)),
      })
    }
  }

  return cards
})

const playableCardCount = computed(() => {
  return availableCardEntries.value.filter(
    entry => !entry.availability || entry.availability.is_playable
  ).length
})

const availableCategories = computed(() => getAvailableCategories(availableCardEntries.value))
const affectedMetrics = computed(() => getAffectedMetrics(availableCardEntries.value))

const filteredSortedCards = computed(() => {
  const filtered = filterByCategory(availableCardEntries.value, satchelCategory.value)
  return sortCards(filtered, satchelSort.value)
})

const tutorialRequiredCardId = computed(() => gameStore.tutorial.requiredCardId ?? null)

function isTutorialCardLocked(cardId: string): boolean {
  return tutorialRequiredCardId.value !== null && cardId !== tutorialRequiredCardId.value
}

function isTutorialCardHighlighted(cardId: string): boolean {
  return tutorialRequiredCardId.value !== null && cardId === tutorialRequiredCardId.value
}

const modalCard = computed(() => {
  if (!modalCardId.value || !gameStore.scenarioBundle) {
    return null
  }

  return availableCardEntries.value.find(entry => entry.card.id === modalCardId.value)?.card || null
})

const modalCardAvailability = computed(() => {
  if (!modalCardId.value) {
    return undefined
  }

  return availableCardEntries.value.find(entry => entry.card.id === modalCardId.value)?.availability
})

const stakeholderNames = computed((): Record<string, string> => {
  return buildStakeholderNamesMap(gameStore.scenarioBundle)
})

const stageActors = computed(() => {
  return buildGameplayStageActors(gameStore.gameState?.stakeholders, stakeholderNames.value, randomAvatarRoles.value)
})

watch(scenario, (newScenario, oldScenario) => {
  if (newScenario?.id !== oldScenario?.id) {
    randomSceneId.value = pickRandomSceneId()
    randomAvatarRoles.value = shuffleAvatarRoles()
  }
}, { immediate: false })

onMounted(() => {
  if (!gameStore.hasActiveRun) {
    router.push('/play')
  }
})

function handleResetRun() {
  gameStore.reset()
  router.push('/play')
}

function handleLeaveTutorial() {
  gameStore.reset()
  router.push('/play')
}

async function handleLaunchAnotherTutorial(tutorial: QuestDisplayModel) {
  gameStore.isTutorialCompleteSplashOpen = false
  gameStore.reset()

  const fallbackClass = gameStore.availableClasses[0]
  if (!fallbackClass) {
    router.push('/play')
    return
  }

  await gameStore.start_new_run({
    scenario_id: tutorial.id,
    scenario_version: tutorial.version,
    selected_class_ref: {
      id: fallbackClass.id,
      version: fallbackClass.version,
    },
    is_tutorial: true,
  })
}

function handleStartRealGame() {
  gameStore.isTutorialCompleteSplashOpen = false
  gameStore.reset()
  router.push('/play')
}

function handleShowDetails(cardId: string) {
  modalCardId.value = cardId
}

async function handlePlayCard(cardId: string) {
  modalCardId.value = null
  isSatchelOpen.value = false
  await gameStore.play_turn(cardId)
  await scrollToResolutionContext()

  if (gameStore.isRunComplete) {
    gameStore.get_run_outcome()
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function scrollToResolutionContext() {
  await nextTick()

  const targetElement = aftershockAlertRef.value ?? turnResolutionPanelRef.value
  if (!targetElement) {
    return
  }

  const topOffset = getScrollTopOffset()
  const elementTop = targetElement.getBoundingClientRect().top + window.scrollY
  const scrollTop = Math.max(0, elementTop - topOffset)

  window.scrollTo({
    top: scrollTop,
    behavior: 'smooth',
  })
}

function getScrollTopOffset() {
  if (window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT_PX}px)`).matches) {
    return SCROLL_OFFSET_SMALL_MOBILE_PX
  }

  if (window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches) {
    return SCROLL_OFFSET_MOBILE_PX
  }

  return SCROLL_OFFSET_DESKTOP_PX
}

function goToEndScreen() {
  router.push('/end')
}
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 12%, rgba(101, 123, 181, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 84% 16%, rgba(77, 111, 92, 0.2) 0%, transparent 40%),
    linear-gradient(180deg, #0d1019 0%, #121827 48%, #111420 100%);
  padding-bottom: calc(var(--drawer-handle-height) + var(--space-lg));
}

.game-shell {
  width: min(1280px, 100% - 2rem);
  margin: 0 auto;
  padding: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.play-header {
  position: relative;
  z-index: 10;
  background: rgba(9, 11, 20, 0.68);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-panel);
  padding: 0.65rem 0.8rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.turn-pill {
  margin: 0;
  color: var(--text-bright);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: var(--font-semibold);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  background: rgba(255, 255, 255, 0.04);
}

.score-strip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.score-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.04);
}

.score-chip-label {
  color: var(--text-secondary);
  font-size: 10px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.score-chip-value {
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.play-main {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  align-items: start;
  gap: var(--space-md);
}

.stage-section,
.narrative-section {
  min-width: 0;
}

.narrative-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  background: rgba(8, 11, 19, 0.52);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 0.8rem;
  box-shadow: var(--shadow-panel);
}

.aftershock-alert {
  background: linear-gradient(135deg, var(--effect-warning-bg) 0%, rgba(255, 166, 0, 0.08) 100%);
  border: 1px solid var(--effect-warning-border);
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.alert-icon {
  font-size: var(--text-xl);
  line-height: 1;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  color: var(--effect-warning);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  margin-bottom: 2px;
}

.alert-message {
  color: var(--text-primary);
  font-size: var(--text-xs);
}

.run-complete-card {
  background: rgba(11, 15, 25, 0.9);
  border: 1px solid var(--border-accent);
  border-radius: 14px;
  padding: 2rem 1.25rem;
  text-align: center;
  box-shadow: var(--shadow-panel);
}

.complete-icon {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.complete-title {
  color: var(--text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0 0 0.4rem;
}

.complete-message {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0 0 1rem;
}

.btn-view-results {
  background: color-mix(in oklab, var(--text-accent), #fff 8%);
  color: var(--text-bright);
  border: none;
  padding: 0.55rem 1rem;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  border-radius: 10px;
  cursor: pointer;
  transition: transform var(--transition-fast), filter var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-view-results:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.btn-view-results:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
}

@media (max-width: 1120px) {
  .play-main {
    grid-template-columns: 1fr;
  }

  .narrative-section {
    padding: 0.7rem;
  }
}

@media (max-width: 768px) {
  .game-shell {
    width: min(1280px, 100% - 1rem);
  }

  .aftershock-alert {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
  }

  .complete-title {
    font-size: var(--text-2xl);
  }
}
</style>
