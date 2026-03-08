<template>
  <div class="game-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="game-container">
      <!-- Header -->
      <div class="game-header">
        <div class="header-content">
          <h1 class="scenario-title">{{ scenario?.name || 'DDDnD' }}</h1>
          <div class="turn-info">
            Turn {{ gameStore.currentTurn }} / {{ gameStore.maxTurns }}
          </div>
        </div>
        
        <div class="header-actions">
          <button class="icon-button" @click="gameStore.openRulesModal" title="Rules">
            📖
          </button>
          <button class="icon-button" @click="gameStore.openAboutModal" title="About">
            ℹ️
          </button>
        </div>
      </div>
      
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
          />
        </aside>
        
        <!-- Center: Cards & Actions -->
        <main class="game-center">
          <!-- Aftershocks Warning -->
          <div 
            v-if="gameStore.turnBriefing && gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length > 0"
            class="aftershock-warning"
          >
            <div class="warning-icon">⚡</div>
            <div class="warning-text">
              <strong>{{ gameStore.turnBriefing.pending_delayed_effects_resolving_this_turn.length }} Architectural Aftershock(s)</strong> 
              will resolve this turn
            </div>
          </div>
          
          <!-- Last Turn Resolution -->
          <TurnResolutionPanel 
            v-if="gameStore.lastTurnResolution && gameStore.lastTurnResolution.turn_resolution_context"
            :turnResolution="gameStore.lastTurnResolution.turn_resolution_context"
          />
          
          <!-- Available Actions -->
          <div v-if="!gameStore.isRunComplete" class="actions-section">
            <h2 class="section-title">Choose Your Next Move</h2>
            
            <div class="actions-grid">
              <ActionCard 
                v-for="card in availableCards" 
                :key="card.id + '-v' + card.version"
                :card="card"
                :isSelected="selectedCardId === card.id"
                :isDisabled="gameStore.isPlayingTurn"
                @select="selectCard(card.id)"
              />
            </div>
            
            <div class="play-action">
              <button 
                class="play-button"
                :disabled="!selectedCardId || gameStore.isPlayingTurn"
                @click="playSelectedCard"
              >
                {{ gameStore.isPlayingTurn ? 'Resolving...' : 'Play Card' }}
              </button>
            </div>
          </div>
          
          <!-- Run Complete Message -->
          <div v-else class="run-complete">
            <h2>Run Complete!</h2>
            <p>Your architectural journey has reached its conclusion.</p>
            <button class="primary-button" @click="goToEndScreen">
              View Results
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { Card } from '@/domains/content/model'
import { versionRefKey } from '@/domains/content/model'
import ScorePanel from '@/ui/components/scores/score_panel.vue'
import StakeholderPanel from '@/ui/components/stakeholders/stakeholder_panel.vue'
import ActionCard from '@/ui/components/cards/action_card.vue'
import TurnResolutionPanel from '@/ui/components/turn/turn_resolution_panel.vue'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'

const router = useRouter()
const gameStore = useGameStore()

const selectedCardId = ref<string | null>(null)

const scenario = computed(() => gameStore.scenarioBundle?.scenario)

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

onMounted(() => {
  // If no active run, redirect to setup
  if (!gameStore.hasActiveRun) {
    router.push('/play')
  }
})

function selectCard(cardId: string) {
  selectedCardId.value = cardId
}

async function playSelectedCard() {
  if (!selectedCardId.value) return
  
  await gameStore.play_turn(selectedCardId.value)
  selectedCardId.value = null
  
  // If run just completed, update outcome
  if (gameStore.isRunComplete) {
    gameStore.get_run_outcome()
  }
}

function goToEndScreen() {
  router.push('/end')
}
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #16213e 50%, #1a1a2e 100%);
}

.game-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 2px solid rgba(139, 146, 168, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.scenario-title {
  color: #e94560;
  font-size: 1.5rem;
  margin: 0;
}

.turn-info {
  color: #8b92a8;
  font-size: 1.125rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: rgba(139, 146, 168, 0.2);
  border: 2px solid rgba(139, 146, 168, 0.3);
  color: #e0e0e0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  background: rgba(139, 146, 168, 0.3);
  border-color: rgba(233, 69, 96, 0.5);
}

.game-main {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
}

.game-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.game-center {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.aftershock-warning {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(243, 156, 18, 0.15);
  border: 2px solid #f39c12;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.warning-icon {
  font-size: 2rem;
}

.warning-text {
  color: #e0e0e0;
  font-size: 1rem;
}

.warning-text strong {
  color: #f39c12;
}

.actions-section {
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(139, 146, 168, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
}

.section-title {
  color: #e94560;
  font-size: 1.5rem;
  margin: 0 0 1.25rem 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.play-action {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 2px solid rgba(139, 146, 168, 0.2);
}

.play-button {
  background: #e94560;
  color: white;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.play-button:hover:not(:disabled) {
  background: #d63851;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.4);
}

.play-button:disabled {
  background: #5a5a6e;
  cursor: not-allowed;
  opacity: 0.6;
}

.run-complete {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
}

.run-complete h2 {
  color: #e94560;
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.run-complete p {
  color: #e0e0e0;
  font-size: 1.125rem;
  margin: 0 0 2rem 0;
}

.primary-button {
  background: #e94560;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
}

.primary-button:hover {
  background: #d63851;
  transform: translateY(-2px);
}

@media (max-width: 1024px) {
  .game-main {
    grid-template-columns: 1fr;
  }
  
  .game-sidebar {
    order: 1;
  }
  
  .game-center {
    order: 0;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: 0.75rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .scenario-title {
    font-size: 1.25rem;
  }
  
  .turn-info {
    font-size: 1rem;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .play-button {
    width: 100%;
    max-width: 320px;
  }
}
</style>
