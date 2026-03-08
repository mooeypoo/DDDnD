<template>
  <div class="game-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <CardDetailsModal 
      v-if="modalCardId && modalCard" 
      :isOpen="!!modalCardId" 
      :card="modalCard" 
      :isDisabled="gameStore.isPlayingTurn"
      :stakeholderNames="stakeholderNames"
      @close="modalCardId = null" 
      @play="handlePlayCard"
    />
    
    <!-- Game Masthead -->
    <GameMasthead 
      @show-rules="gameStore.openRulesModal"
      @show-about="gameStore.openAboutModal"
    />
    
    <div class="game-container">
      <!-- Scenario Banner -->
      <ScenarioBanner
        v-if="scenario"
        :title="scenario.name"
        :short-description="resolveScenarioShortDescription(scenario)"
        :description="scenario.description"
        :current-turn="gameStore.currentTurn"
        :max-turns="gameStore.maxTurns"
      />
      
      <!-- Main Game Area -->
      <div class="game-main">
        <!-- Left Sidebar: Scores & Stakeholders -->
        <aside class="game-sidebar">
          <ScorePanel 
            v-if="gameStore.turnBriefing"
            :scores="gameStore.turnBriefing.current_scores"
          />
          
          <StakeholderPanel 
            v-if="gameStore.gameState"
            :stakeholders="gameStore.gameState.stakeholders"
            :stakeholderNames="stakeholderNames"
          />
        </aside>
        
        <!-- Center: Cards & Actions -->
        <main class="game-center">
          <!-- Turn Briefing -->
          <TurnBriefingPanel
            v-if="gameStore.turnBriefing"
            :event-title="currentEventTitle"
            :narrative-description="currentEventDescription"
            :available-actions="gameStore.turnBriefing.available_action_card_ids.length"
            :pending-aftershocks="gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length"
          />

          <!-- Aftershocks Warning -->
          <div 
            v-if="gameStore.turnBriefing && gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length > 0"
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
          
          <!-- Available Actions -->
          <div v-if="!gameStore.isRunComplete" class="play-area">
            <div class="play-area-header">
              <h2 class="play-area-title">
                <span class="title-icon">🎴</span>
                Choose Your Next Move
              </h2>
              <p class="play-area-hint">Select a card to play this turn</p>
            </div>
            
            <div class="actions-grid">
              <ActionCard 
                v-for="card in availableCards" 
                :key="card.id + '-v' + card.version"
                :card="card"
                :isDisabled="gameStore.isPlayingTurn"
                @showDetails="handleShowDetails(card.id)"
                @play="handlePlayCard"
              />
            </div>
          </div>
          
          <!-- Run Complete Message -->
          <div v-else class="run-complete-card">
            <div class="complete-icon">🏁</div>
            <h2 class="complete-title">Run Complete!</h2>
            <p class="complete-message">Your architectural journey has reached its conclusion.</p>
            <button class="btn-view-results" @click="goToEndScreen">
              <span class="btn-text">View Results</span>
              <span class="btn-icon">→</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { Card } from '@/domains/content/model'
import { versionRefKey } from '@/domains/content/model'
import { resolveScenarioShortDescription } from '@/ui/composables/scenario_presentation'
import { buildStakeholderNamesMap } from '@/ui/composables/stakeholder_presentation'
import ScorePanel from '@/ui/components/scores/score_panel.vue'
import StakeholderPanel from '@/ui/components/stakeholders/stakeholder_panel.vue'
import ActionCard from '@/ui/components/cards/action_card.vue'
import TurnResolutionPanel from '@/ui/components/turn/turn_resolution_panel.vue'
import ScenarioBanner from '@/ui/components/scenario/scenario_banner.vue'
import TurnBriefingPanel from '@/ui/components/turn/turn_briefing_panel.vue'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import GameMasthead from '@/ui/components/branding/game_masthead.vue'

const router = useRouter()
const gameStore = useGameStore()

const modalCardId = ref<string | null>(null)
const aftershockAlertRef = ref<HTMLElement | null>(null)
const turnResolutionPanelRef = ref<HTMLElement | null>(null)

const SMALL_MOBILE_BREAKPOINT_PX = 480
const MOBILE_BREAKPOINT_PX = 768
const SCROLL_OFFSET_DESKTOP_PX = 80
const SCROLL_OFFSET_MOBILE_PX = 100
const SCROLL_OFFSET_SMALL_MOBILE_PX = 125

const scenario = computed(() => gameStore.scenarioBundle?.scenario)

const currentEventTitle = computed(() => {
  return 'Choose Your Architectural Move'
})

const currentEventDescription = computed(() => {
  return 'The system awaits your decision. Select a card to take your next action.'
})

const availableCards = computed(() => {
  if (!gameStore.turnBriefing || !gameStore.scenarioBundle) {
    return []
  }
  
  const cards: Card[] = []
  for (const actionRef of gameStore.gameState?.action_state.available_action_refs || []) {
    const card = gameStore.scenarioBundle.cards.get(versionRefKey(actionRef))
    if (card) {
      cards.push(card)
    }
  }
  
  return cards
})

const modalCard = computed(() => {
  if (!modalCardId.value || !gameStore.scenarioBundle) {
    return null
  }
  
  return availableCards.value.find(card => card.id === modalCardId.value) || null
})

const stakeholderNames = computed((): Record<string, string> => {
  return buildStakeholderNamesMap(gameStore.scenarioBundle)
})

onMounted(() => {
  // If no active run, redirect to setup
  if (!gameStore.hasActiveRun) {
    router.push('/play')
  }
  
  // Listen for reset event from masthead
  window.addEventListener('reset-run', handleResetRun)
})

onUnmounted(() => {
  window.removeEventListener('reset-run', handleResetRun)
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
  await gameStore.play_turn(cardId)
  await scrollToResolutionContext()
  
  // If run just completed, update outcome
  if (gameStore.isRunComplete) {
    gameStore.get_run_outcome()
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
  padding-bottom: var(--space-2xl);
}

.game-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Main Game Layout */
.game-main {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: var(--space-xl);
  align-items: start;
}

.game-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  position: sticky;
  top: var(--space-lg);
}

.game-center {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  min-width: 0;
}

/* Aftershock Alert */
.aftershock-alert {
  background: linear-gradient(135deg, var(--color-warning-bg) 0%, rgba(243, 156, 18, 0.05) 100%);
  border: 2px solid var(--color-warning);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  box-shadow: 0 4px 16px rgba(243, 156, 18, 0.2);
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(243, 156, 18, 0.2);
  }
  50% {
    box-shadow: 0 4px 24px rgba(243, 156, 18, 0.4);
  }
}

.alert-icon {
  font-size: var(--text-5xl);
  line-height: 1;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.alert-content {
  flex: 1;
}

.alert-title {
  color: var(--color-warning);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-xs);
}

.alert-message {
  color: var(--color-text-primary);
  font-size: var(--text-base);
}

/* Play Area */
.play-area {
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.play-area-header {
  margin-bottom: var(--space-xl);
}

.play-area-title {
  color: var(--color-text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-sm) 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.title-icon {
  font-size: var(--text-3xl);
}

.play-area-hint {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin: 0;
  font-style: italic;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.play-controls {
  display: flex;
  justify-content: center;
  padding-top: var(--space-xl);
  border-top: 2px solid var(--color-border-default);
}

.btn-play-card {
  background: var(--color-primary);
  color: var(--color-text-bright);
  border: none;
  padding: var(--space-lg) var(--space-4xl);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  box-shadow: 0 4px 16px var(--color-primary-glow);
  min-width: 280px;
  justify-content: center;
}

.btn-play-card:hover:not(:disabled) {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--color-primary-glow);
}

.btn-play-card:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-text-bright);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Run Complete Card */
.run-complete-card {
  background: var(--card-bg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-5xl) var(--space-3xl);
  text-align: center;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
}

.complete-icon {
  font-size: 5rem;
  margin-bottom: var(--space-xl);
  animation: celebrate 1s ease-in-out;
}

@keyframes celebrate {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.2) rotate(-10deg);
  }
  75% {
    transform: scale(1.2) rotate(10deg);
  }
}

.complete-title {
  color: var(--color-primary);
  font-size: var(--text-4xl);
  font-weight: var(--font-black);
  margin: 0 0 var(--space-lg) 0;
}

.complete-message {
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-3xl) 0;
  line-height: var(--leading-relaxed);
}

.btn-view-results {
  background: var(--color-primary);
  color: var(--color-text-bright);
  border: none;
  padding: var(--space-lg) var(--space-4xl);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

.btn-view-results:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--color-primary-glow);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .game-main {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 1024px) {
  .game-main {
    grid-template-columns: 1fr;
  }
  
  .game-sidebar {
    position: static;
    order: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-lg);
  }
  
  .game-center {
    order: 0;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: var(--space-md);
  }
  
  .game-header {
    flex-direction: column;
    gap: var(--space-lg);
    align-items: stretch;
  }
  
  .scenario-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .scenario-title {
    font-size: var(--text-xl);
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .play-area {
    padding: var(--space-xl);
  }
  
  .btn-play-card {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: var(--space-sm);
  }
  
  .game-header {
    padding: var(--space-lg);
  }
  
  .play-area {
    padding: var(--space-lg);
  }
  
  .aftershock-alert {
    flex-direction: column;
    text-align: center;
  }
  
  .alert-icon {
    font-size: var(--text-4xl);
  }
}
</style>
