<template>
  <div class="game-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <CardDetailsModal 
      v-if="modalCardId && modalCard" 
      :isOpen="!!modalCardId" 
      :card="modalCard" 
      :isDisabled="gameStore.isPlayingTurn"
      :availability="modalCardAvailability"
      :stakeholderNames="stakeholderNames"
      @close="modalCardId = null" 
      @play="handlePlayCard"
    />

    <RunIntroSplash
      :isOpen="gameStore.isIntroSplashOpen"
      :playerName="playerDisplayName"
      :playerClassName="playerClassName"
      :scenarioName="scenario?.name"
      :scores="gameStore.gameState?.scores ?? {}"
      :stakeholders="gameStore.gameState?.stakeholders ?? {}"
      :stakeholderNames="stakeholderNames"
      :maxTurns="gameStore.maxTurns"
      @start="gameStore.dismissIntroSplash"
    />
    
    <!-- Game Masthead -->
    <GameMasthead 
      @show-rules="gameStore.openRulesModal"
      @show-about="gameStore.openAboutModal"
    />

    <!-- Sticky HUD Bar: scores, stakeholders, turn counter (narrow screens only) -->
    <GameHudBar
      v-if="!isWideScreen"
      :current-turn="gameStore.currentTurn"
      :max-turns="gameStore.maxTurns"
      :scores="gameStore.turnBriefing?.current_scores"
      :stakeholders="gameStore.gameState?.stakeholders"
      :stakeholder-names="stakeholderNames"
    />

    <div class="game-layout" :class="{ 'layout-wide': isWideScreen }">
      <!-- Desktop Sidebar HUD (wide screens only) -->
      <GameHudSidebar
        v-if="isWideScreen"
        :current-turn="gameStore.currentTurn"
        :max-turns="gameStore.maxTurns"
        :scores="gameStore.turnBriefing?.current_scores"
        :stakeholders="gameStore.gameState?.stakeholders"
        :stakeholder-names="stakeholderNames"
      />
    
    <div class="game-container" :class="{ 'drawer-open': isSatchelOpen }">
      <!-- Compact Scenario Banner -->
      <ScenarioBanner
        v-if="scenario"
        :title="scenario.name"
        :short-description="resolveScenarioShortDescription(scenario)"
        :description="scenario.description"
        :current-turn="gameStore.currentTurn"
        :max-turns="gameStore.maxTurns"
      />

      <!-- Main Content Area (full-width, no sidebar) -->
      <main class="game-main">
        <!-- Run Complete Message (shown at top when run ends) -->
        <div v-if="gameStore.isRunComplete" class="run-complete-card">
          <div class="complete-icon">🏁</div>
          <h2 class="complete-title">Run Complete!</h2>
          <p class="complete-message">Your architectural journey has reached its conclusion.</p>
          <button class="btn-view-results" @click="goToEndScreen">
            <span class="btn-text">View Results</span>
            <span class="btn-icon">→</span>
          </button>
        </div>

        <!-- Turn Briefing (hidden when run complete) -->
        <TurnBriefingPanel
          v-if="gameStore.turnBriefing && !gameStore.isRunComplete"
          :event-title="currentEventTitle"
          :narrative-description="currentEventDescription"
          :available-actions="gameStore.turnBriefing.available_action_card_ids.length"
          :pending-aftershocks="gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length"
          :current-turn="gameStore.currentTurn"
          :total-turns="gameStore.maxTurns"
        />

        <!-- Aftershocks Warning (hidden when run complete) -->
        <div 
          v-if="gameStore.turnBriefing && !gameStore.isRunComplete && gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length > 0"
          ref="aftershockAlertRef"
          class="aftershock-alert"
        >
          <div class="alert-icon">⚡</div>
          <div class="alert-content">
            <div class="alert-title">Architectural Aftershocks Incoming</div>
            <div class="alert-message">
              {{ gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length }} delayed effect{{ gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length > 1 ? 's' : '' }} will resolve this turn
            </div>
          </div>
        </div>
        
        <!-- Last Turn Resolution -->
        <div
          v-if="gameStore.lastTurnResolution && gameStore.lastTurnResolution.turn_resolution_context"
          ref="turnResolutionPanelRef"
        >
          <TurnResolutionPanel 
            :turnResolution="gameStore.lastTurnResolution.turn_resolution_context"
            :stakeholderNames="stakeholderNames"
          />
        </div>
      </main>
    </div>
    </div>

    <!-- Bottom Drawer: Card Satchel -->
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
        @showDetails="handleShowDetails(entry.card.id)"
        @play="handlePlayCard"
      />
    </CardSatchelDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { Card } from '@/domains/content/model'
import { versionRefKey } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import { resolveScenarioShortDescription } from '@/ui/composables/scenario_presentation'
import { buildStakeholderNamesMap } from '@/ui/composables/stakeholder_presentation'
import ActionCard from '@/ui/components/cards/action_card.vue'
import CardSatchelDrawer from '@/ui/components/cards/card_satchel_drawer.vue'
import SatchelToolbar from '@/ui/components/cards/satchel_toolbar.vue'
import TurnResolutionPanel from '@/ui/components/turn/turn_resolution_panel.vue'
import ScenarioBanner from '@/ui/components/scenario/scenario_banner.vue'
import TurnBriefingPanel from '@/ui/components/turn/turn_briefing_panel.vue'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import GameHudBar from '@/ui/components/common/game_hud_bar.vue'
import GameHudSidebar from '@/ui/components/common/game_hud_sidebar.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import GameMasthead from '@/ui/components/branding/game_masthead.vue'
import RunIntroSplash from '@/ui/components/common/run_intro_splash.vue'
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
const satchelCategory = ref<CategoryFilter>('all')
const satchelSort = ref<SortOption>('default')
const isWideScreen = ref(false)

const SMALL_MOBILE_BREAKPOINT_PX = 480
const MOBILE_BREAKPOINT_PX = 768
const WIDE_SCREEN_BREAKPOINT_PX = 1100
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

const currentEventTitle = computed(() => {
  return 'The Realm Awaits Your Command'
})

const currentEventDescription = computed(() => {
  return 'Your party looks to you for guidance. Open your Action Satchel below and choose an architectural scroll to shape the fate of this system.'
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
        availability: availabilitySummaryByKey.value.get(versionRefKey(actionRef))
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

// -- Satchel filter & sort --
const availableCategories = computed(() => getAvailableCategories(availableCardEntries.value))
const affectedMetrics = computed(() => getAffectedMetrics(availableCardEntries.value))

const filteredSortedCards = computed(() => {
  const filtered = filterByCategory(availableCardEntries.value, satchelCategory.value)
  return sortCards(filtered, satchelSort.value)
})

const modalCard = computed(() => {
  if (!modalCardId.value || !gameStore.scenarioBundle) {
    return null
  }
  
  return availableCardEntries.value.find((entry) => entry.card.id === modalCardId.value)?.card || null
})

const modalCardAvailability = computed(() => {
  if (!modalCardId.value) {
    return undefined
  }

  return availableCardEntries.value.find((entry) => entry.card.id === modalCardId.value)?.availability
})

const stakeholderNames = computed((): Record<string, string> => {
  return buildStakeholderNamesMap(gameStore.scenarioBundle)
})

let wideScreenQuery: MediaQueryList | null = null

function handleWideScreenChange(e: MediaQueryListEvent | MediaQueryList) {
  isWideScreen.value = e.matches
}

onMounted(() => {
  // If no active run, redirect to setup
  if (!gameStore.hasActiveRun) {
    router.push('/play')
  }
  
  // Listen for reset event from masthead
  window.addEventListener('reset-run', handleResetRun)

  // Track wide-screen breakpoint for sidebar layout
  wideScreenQuery = window.matchMedia(`(min-width: ${WIDE_SCREEN_BREAKPOINT_PX}px)`)
  isWideScreen.value = wideScreenQuery.matches
  wideScreenQuery.addEventListener('change', handleWideScreenChange)
})

onUnmounted(() => {
  window.removeEventListener('reset-run', handleResetRun)
  wideScreenQuery?.removeEventListener('change', handleWideScreenChange)
})

function handleResetRun() {
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
  
  // If run just completed, update outcome and scroll to top
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
    behavior: 'smooth'
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
  background: linear-gradient(135deg, 
    var(--color-bg-darkest) 0%, 
    var(--color-bg-dark) 50%, 
    var(--color-bg-medium) 100%
  );
  /* Reserve space at bottom for the drawer handle */
  padding-bottom: calc(var(--drawer-handle-height) + var(--space-lg));
}

/* ─── Two-column layout wrapper ─── */
.game-layout {
  display: flex;
  flex-direction: column;
}

.game-layout.layout-wide {
  flex-direction: row;
  min-height: calc(100vh - 60px); /* subtract approximate masthead height */
}

.game-container {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  flex: 1;
  min-width: 0;
}

/* When sidebar is present, center content within remaining space */
.layout-wide .game-container {
  margin: 0 auto;
}

/* Main game area — single column, full width */
.game-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  min-width: 0;
}

/* Aftershock Alert */
.aftershock-alert {
  background: linear-gradient(135deg, var(--effect-warning-bg) 0%, var(--surface-panel) 100%);
  border: 1px solid var(--effect-warning-border);
  border-radius: var(--radius-xl);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  box-shadow: var(--shadow-panel);
}

.alert-icon {
  font-size: var(--text-2xl);
  line-height: 1;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  color: var(--effect-warning);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-xs);
}

.alert-message {
  color: var(--text-primary);
  font-size: var(--text-sm);
}

/* Run Complete Card */
.run-complete-card {
  background: var(--card-bg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4xl) var(--space-2xl);
  text-align: center;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: var(--space-lg);
  animation: celebrate 1s ease-in-out;
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-10deg); }
  75% { transform: scale(1.2) rotate(10deg); }
}

.complete-title {
  color: var(--color-primary);
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
  margin: 0 0 var(--space-md) 0;
}

.complete-message {
  color: var(--color-text-primary);
  font-size: var(--text-base);
  margin: 0 0 var(--space-2xl) 0;
  line-height: var(--leading-relaxed);
}

.btn-view-results {
  background: var(--color-primary);
  color: var(--color-text-bright);
  border: none;
  padding: var(--space-md) var(--space-3xl);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

.btn-view-results:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--color-primary-glow);
}

/* Responsive */
@media (max-width: 768px) {
  .game-container {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .aftershock-alert {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: var(--space-sm);
    gap: var(--space-sm);
  }

  .aftershock-alert {
    flex-direction: column;
    text-align: center;
  }

  .complete-title {
    font-size: var(--text-2xl);
  }
}
</style>
