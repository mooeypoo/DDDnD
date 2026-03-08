<template>
  <div class="end-of-run-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="end-container">
      <div class="outcome-main">
        <!-- Outcome Header -->
        <div class="outcome-header">
          <h1 class="outcome-title">Run Complete</h1>
          <div v-if="outcome" class="outcome-tier" :class="outcome.tier">
            {{ formatTier(outcome.tier) }}
          </div>
        </div>
        
        <!-- Archetype Display -->
        <div v-if="outcome" class="archetype-section">
          <div class="archetype-icon-placeholder">
            <!-- Future: Archetype illustration -->
            <div class="archetype-icon">{{ getArchetypeIcon(outcome.archetype) }}</div>
          </div>
          
          <h2 class="archetype-name">{{ formatArchetype(outcome.archetype) }}</h2>
          <p class="archetype-description">
            {{ getArchetypeDescription(outcome.archetype) }}
          </p>
        </div>
        
        <!-- Run Summary -->
        <div class="summary-section">
          <h3 class="section-title">Run Summary</h3>
          
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Turns Completed</div>
              <div class="summary-value">{{ outcome?.turns_completed || 0 }} / {{ outcome?.max_turns || 0 }}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Average Score</div>
              <div class="summary-value">{{ Math.round(outcome?.score_average || 0) }}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Completion</div>
              <div class="summary-value">{{ formatCompletionReason(outcome?.completion_reason) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Final Scores -->
        <div v-if="gameStore.gameState" class="scores-section">
          <h3 class="section-title">Final Scores</h3>
          <div class="final-scores-grid">
            <div 
              v-for="(value, scoreId) in gameStore.gameState.scores" 
              :key="scoreId"
              class="final-score-item"
            >
              <div class="score-name">{{ formatScoreName(scoreId) }}</div>
              <div class="score-bar">
                <div class="score-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></div>
              </div>
              <div class="score-value">{{ Math.round(value) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Stakeholder Final State -->
        <div v-if="gameStore.gameState" class="stakeholders-section">
          <h3 class="section-title">Stakeholder Relations</h3>
          <div class="stakeholders-grid">
            <div 
              v-for="(data, stakeholderId) in gameStore.gameState.stakeholders" 
              :key="stakeholderId"
              class="stakeholder-final-item"
            >
              <div class="stakeholder-name">{{ formatStakeholderName(stakeholderId) }}</div>
              <div class="stakeholder-satisfaction" :class="getSatisfactionClass(data.satisfaction)">
                {{ Math.round(data.satisfaction) }} - {{ getSatisfactionLabel(data.satisfaction) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Share Placeholder -->
        <div class="share-section">
          <h3 class="section-title">Share Your Journey</h3>
          <div class="share-placeholder">
            <p>Share functionality coming soon!</p>
            <p class="share-hint">Export and sharing features will be added in a future update.</p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="actions-section">
          <button class="secondary-button" @click="goHome">
            Return Home
          </button>
          
          <button class="primary-button" @click="playAgain">
            Play Again
          </button>
        </div>

        <div class="footer-links">
          <button class="text-button" @click="gameStore.openAboutModal">What is this?</button>
          <span class="separator">·</span>
          <button class="text-button" @click="gameStore.openRulesModal">Rules</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { OutcomeArchetypeId } from '@/domains/simulation/rules'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'

const router = useRouter()
const gameStore = useGameStore()

const outcome = computed(() => gameStore.runOutcome)

onMounted(() => {
  if (!gameStore.hasActiveRun || !gameStore.isRunComplete) {
    router.push('/')
    return
  }
  
  if (!gameStore.runOutcome) {
    gameStore.get_run_outcome()
  }
})

function formatTier(tier: string): string {
  if (tier === 'partial_success') return 'Partial Success'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

function formatArchetype(archetype: OutcomeArchetypeId): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getArchetypeIcon(archetype: OutcomeArchetypeId): string {
  const icons: Record<OutcomeArchetypeId, string> = {
    'boundary_builder': '🏗️',
    'firefighter': '🧯',
    'runaway_refactorer': '♻️',
    'stakeholder_whisperer': '🗣️',
    'system_stabilizer': '⚖️'
  }
  return icons[archetype] || '🎯'
}

function getArchetypeDescription(archetype: OutcomeArchetypeId): string {
  const descriptions: Record<OutcomeArchetypeId, string> = {
    'boundary_builder': 'You focused on establishing clear domain boundaries and architectural structure.',
    'firefighter': 'You responded to immediate crises and kept the system running under pressure.',
    'runaway_refactorer': 'You pursued aggressive refactoring, sometimes at the cost of delivery speed.',
    'stakeholder_whisperer': 'You skillfully navigated organizational politics and stakeholder relationships.',
    'system_stabilizer': 'You brought balance and stability to a chaotic system.'
  }
  return descriptions[archetype] || 'Your architectural journey was unique.'
}

function formatCompletionReason(reason?: string): string {
  if (!reason) return 'Unknown'
  
  const formatted: Record<string, string> = {
    'max_turns': 'Max Turns',
    'success': 'Victory',
    'failure': 'System Collapse'
  }
  
  return formatted[reason] || reason
}

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatStakeholderName(stakeholderId: string): string {
  return stakeholderId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getScoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}

function getSatisfactionLabel(value: number): string {
  if (value >= 70) return 'Supportive'
  if (value >= 50) return 'Neutral'
  if (value >= 30) return 'Concerned'
  return 'Critical'
}

function getSatisfactionClass(value: number): string {
  if (value >= 70) return 'supportive'
  if (value >= 50) return 'neutral'
  if (value >= 30) return 'concerned'
  return 'critical'
}

function goHome() {
  gameStore.reset()
  router.push('/')
}

function playAgain() {
  gameStore.reset()
  router.push('/play')
}
</script>

<style scoped>
.end-of-run-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #16213e 50%, #1a1a2e 100%);
  padding: 2rem;
}

.end-container {
  max-width: 900px;
  margin: 0 auto;
}

.outcome-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.outcome-header {
  text-align: center;
  padding: 2rem;
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(233, 69, 96, 0.3);
}

.outcome-title {
  color: #e0e0e0;
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
}

.outcome-tier {
  display: inline-block;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.outcome-tier.success {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 2px solid #2ecc71;
}

.outcome-tier.partial_success {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 2px solid #3498db;
}

.outcome-tier.failure {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  border: 2px solid #e94560;
}

.archetype-section {
  text-align: center;
  padding: 2rem;
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(139, 146, 168, 0.3);
}

.archetype-icon-placeholder {
  margin-bottom: 1.5rem;
}

.archetype-icon {
  font-size: 5rem;
  display: inline-block;
}

.archetype-name {
  color: #e94560;
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.archetype-description {
  color: #c0c0c0;
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.summary-section,
.scores-section,
.stakeholders-section,
.share-section {
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(139, 146, 168, 0.3);
  padding: 1.5rem;
}

.section-title {
  color: #e94560;
  font-size: 1.5rem;
  margin: 0 0 1.25rem 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  text-align: center;
}

.summary-label {
  color: #8b92a8;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.summary-value {
  color: #e0e0e0;
  font-size: 1.75rem;
  font-weight: 700;
}

.final-scores-grid {
  display: grid;
  gap: 1rem;
}

.final-score-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.5rem;
  align-items: center;
}

.score-name {
  color: #e0e0e0;
  font-size: 1rem;
  font-weight: 500;
}

.score-bar {
  grid-column: 1;
  grid-row: 2;
  height: 12px;
  background: rgba(139, 146, 168, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s;
}

.score-fill.critical {
  background: #e94560;
}

.score-fill.low {
  background: #f39c12;
}

.score-fill.medium {
  background: #3498db;
}

.score-fill.high {
  background: #2ecc71;
}

.score-value {
  grid-column: 2;
  grid-row: 1 / 3;
  color: #e0e0e0;
  font-size: 1.75rem;
  font-weight: 700;
  min-width: 3rem;
  text-align: right;
}

.stakeholders-grid {
  display: grid;
  gap: 1rem;
}

.stakeholder-final-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stakeholder-name {
  color: #e0e0e0;
  font-weight: 600;
  font-size: 1rem;
}

.stakeholder-satisfaction {
  font-weight: 600;
  font-size: 1rem;
}

.stakeholder-satisfaction.critical {
  color: #e94560;
}

.stakeholder-satisfaction.concerned {
  color: #f39c12;
}

.stakeholder-satisfaction.neutral {
  color: #3498db;
}

.stakeholder-satisfaction.supportive {
  color: #2ecc71;
}

.share-placeholder {
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 2px dashed rgba(139, 146, 168, 0.3);
}

.share-placeholder p {
  color: #8b92a8;
  margin: 0 0 0.5rem 0;
}

.share-hint {
  font-size: 0.9rem;
  font-style: italic;
}

.actions-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
}

.footer-links {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.text-button {
  background: none;
  border: none;
  color: #8b92a8;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s;
  text-decoration: underline;
}

.text-button:hover {
  color: #e94560;
}

.separator {
  color: #8b92a8;
  user-select: none;
}

.primary-button,
.secondary-button {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-transform: uppercase;
}

.primary-button {
  background: #e94560;
  color: white;
}

.primary-button:hover {
  background: #d63851;
  transform: translateY(-2px);
}

.secondary-button {
  background: rgba(139, 146, 168, 0.2);
  color: #e0e0e0;
  border: 2px solid rgba(139, 146, 168, 0.3);
}

.secondary-button:hover {
  background: rgba(139, 146, 168, 0.3);
  border-color: rgba(139, 146, 168, 0.5);
}

@media (max-width: 768px) {
  .end-of-run-view {
    padding: 1rem;
  }
  
  .outcome-title {
    font-size: 2rem;
  }
  
  .outcome-tier {
    font-size: 1.25rem;
    padding: 0.625rem 1.5rem;
  }
  
  .archetype-name {
    font-size: 1.5rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
