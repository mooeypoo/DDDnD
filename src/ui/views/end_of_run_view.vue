<template>
  <div class="end-of-run-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="end-container">
      <!-- Outcome Hero -->
      <div class="outcome-hero">
        <div class="hero-decoration">
          <!-- Future: Celebratory artwork slot -->
          <div class="celebration-icon">🎊</div>
        </div>
        
        <h1 class="outcome-title">Journey Complete</h1>
        
        <div v-if="outcome" class="outcome-tier-badge" :class="getTierClass(outcome.tier)">
          <span class="tier-label">{{ formatTier(outcome.tier) }}</span>
        </div>
      </div>
      
      <!-- Archetype Display -->
      <div v-if="outcome" class="archetype-card">
        <div class="archetype-visual">
          <!-- Future: Archetype illustration slot -->
          <div class="archetype-icon-wrapper">
            <span class="archetype-icon">{{ getArchetypeIcon(outcome.archetype) }}</span>
          </div>
        </div>
        
        <div class="archetype-content">
          <div class="archetype-label">Your Archetype</div>
          <h2 class="archetype-name">{{ formatArchetype(outcome.archetype) }}</h2>
          <p class="archetype-description">
            {{ getArchetypeDescription(outcome.archetype) }}
          </p>
        </div>
      </div>
      
      <!-- Run Summary Stats -->
      <div class="summary-card">
        <h3 class="card-title">
          <span class="title-icon">📊</span>
          Run Summary
        </h3>
        
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Turns Completed</div>
            <div class="stat-value">{{ outcome?.turns_completed || 0 }}<span class="stat-max">/{{ outcome?.max_turns || 0 }}</span></div>
          </div>
          
          <div class="stat-box">
            <div class="stat-label">Avg. Score</div>
            <div class="stat-value">{{ Math.round(outcome?.score_average || 0) }}</div>
          </div>
          
          <div class="stat-box">
            <div class="stat-label">Completion</div>
            <div class="stat-value stat-completion">{{ formatCompletionReason(outcome?.completion_reason) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Final Scores -->
      <div v-if="gameStore.gameState" class="scores-card">
        <h3 class="card-title">
          <span class="title-icon">📈</span>
          Final System Health
        </h3>
        
        <div class="scores-list">
          <div 
            v-for="(value, scoreId) in gameStore.gameState.scores" 
            :key="scoreId"
            class="score-row"
          >
            <div class="score-header">
              <span class="score-name">{{ formatScoreName(scoreId) }}</span>
              <span class="score-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
            </div>
            <div class="score-bar">
              <div class="score-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stakeholder Final State -->
      <div v-if="gameStore.gameState" class="stakeholders-card">
        <h3 class="card-title">
          <span class="title-icon">👥</span>
          Stakeholder Relations
        </h3>
        
        <div class="stakeholders-list">
          <div 
            v-for="(data, stakeholderId) in gameStore.gameState.stakeholders" 
            :key="stakeholderId"
            class="stakeholder-row"
          >
            <div class="stakeholder-info">
              <span class="stakeholder-name">{{ formatStakeholderName(stakeholderId) }}</span>
              <span class="stakeholder-label" :class="getSatisfactionClass(data.satisfaction)">
                {{ getSatisfactionLabel(data.satisfaction) }}
              </span>
            </div>
            <div class="stakeholder-value" :class="getSatisfactionClass(data.satisfaction)">
              {{ Math.round(data.satisfaction) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Share Placeholder -->
      <div class="share-card">
        <h3 class="card-title">
          <span class="title-icon">📤</span>
          Share Your Journey
        </h3>
        
        <div class="share-placeholder">
          <div class="placeholder-icon">🔗</div>
          <p class="placeholder-text">Sharing functionality coming soon!</p>
          <p class="placeholder-hint">Export and share your architectural journey with others</p>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="actions-area">
        <button class="btn-secondary" @click="goHome">
          <span class="btn-icon">🏠</span>
          <span>Return Home</span>
        </button>
        
        <button class="btn-primary" @click="playAgain">
          <span class="btn-text">Play Again</span>
          <span class="btn-icon">🔄</span>
        </button>
      </div>

      <!-- Footer Links -->
      <footer class="footer-links">
        <button class="link-button" @click="gameStore.openAboutModal">
          <span class="link-icon">ℹ️</span>
          What is this?
        </button>
        <span class="link-separator">•</span>
        <button class="link-button" @click="gameStore.openRulesModal">
          <span class="link-icon">📖</span>
          Rules
        </button>
      </footer>
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
import {
  buildStakeholderNamesMap,
  formatStakeholderName as resolveStakeholderName
} from '@/ui/composables/stakeholder_presentation'

const router = useRouter()
const gameStore = useGameStore()

const outcome = computed(() => gameStore.runOutcome)

onMounted(() => {
  // Scroll to top when end screen loads
  window.scrollTo(0, 0)
  
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

function getTierClass(tier: string): string {
  return `tier-${tier.replace('_', '-')}`
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
    'boundary_builder': 'You focused on establishing clear domain boundaries and architectural structure, laying the foundation for sustainable growth.',
    'firefighter': 'You responded swiftly to immediate crises and kept the system running under pressure, saving the day when it mattered most.',
    'runaway_refactorer': 'You pursued aggressive refactoring and technical excellence, sometimes at the cost of delivery speed.',
    'stakeholder_whisperer': 'You skillfully navigated organizational politics and stakeholder relationships, building consensus for change.',
    'system_stabilizer': 'You brought balance and stability to a chaotic system, carefully managing competing priorities.'
  }
  return descriptions[archetype] || 'Your architectural journey was unique and shaped by the choices you made.'
}

function formatCompletionReason(reason?: string): string {
  if (!reason) return 'Unknown'
  
  const formatted: Record<string, string> = {
    'max_turns': 'Time Limit',
    'success': 'Victory',
    'failure': 'Collapse'
  }
  
  return formatted[reason] || reason
}

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const stakeholderNames = computed((): Record<string, string> => {
  return buildStakeholderNamesMap(gameStore.scenarioBundle)
})

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, stakeholderNames.value)
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
  background: linear-gradient(135deg, 
    var(--color-bg-darkest) 0%, 
    var(--color-bg-dark) 50%, 
    var(--color-bg-medium) 100%
  );
  padding: var(--space-3xl) var(--space-2xl);
}

.end-container {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  animation: fadeInUp 0.6s ease-out;
}

/* Outcome Hero */
.outcome-hero {
  text-align: center;
  padding: var(--space-4xl) var(--space-2xl);
  background: var(--card-bg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.hero-decoration {
  margin-bottom: var(--space-xl);
}

.celebration-icon {
  font-size: 4rem;
  animation: celebrate 1.5s ease-in-out;
}

.outcome-title {
  color: var(--color-text-bright);
  font-size: var(--text-5xl);
  margin: 0 0 var(--space-xl) 0;
  font-weight: var(--font-black);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.outcome-tier-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-lg) var(--space-3xl);
  border-radius: var(--radius-lg);
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: var(--shadow-lg);
}

.tier-success {
  background: linear-gradient(135deg, var(--color-success) 0%, #27ae60 100%);
  color: white;
}

.tier-partial-success {
  background: linear-gradient(135deg, var(--color-info) 0%, #2980b9 100%);
  color: white;
}

.tier-failure {
  background: linear-gradient(135deg, var(--color-danger) 0%, var(--color-primary-dark) 100%);
  color: white;
}

/* Archetype Card */
.archetype-card {
  background: var(--card-bg);
  border: 2px solid var(--color-border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.archetype-visual {
  margin-bottom: var(--space-2xl);
}

.archetype-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  box-shadow: 0 8px 24px var(--color-primary-glow);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.archetype-icon {
  font-size: 4rem;
}

.archetype-label {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-sm);
}

.archetype-name {
  color: var(--color-primary);
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
  margin: 0 0 var(--space-lg) 0;
}

.archetype-description {
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* Card Base Styles */
.summary-card,
.scores-card,
.stakeholders-card,
.share-card {
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

.card-title {
  color: var(--color-text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-xl) 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.title-icon {
  font-size: var(--text-3xl);
}

/* Summary Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-xl);
}

.stat-box {
  text-align: center;
  padding: var(--space-xl);
  background: var(--color-bg-overlay);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-default);
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
  font-weight: var(--font-semibold);
}

.stat-value {
  color: var(--color-text-bright);
  font-size: var(--text-4xl);
  font-weight: var(--font-black);
}

.stat-max {
  color: var(--color-text-secondary);
  font-size: var(--text-2xl);
}

.stat-completion {
  font-size: var(--text-2xl);
}

/* Scores List */
.scores-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.score-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-name {
  color: var(--color-text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

.score-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
}

.score-value.critical {
  color: var(--score-critical);
}

.score-value.low {
  color: var(--score-low);
}

.score-value.medium {
  color: var(--score-medium);
}

.score-value.high {
  color: var(--score-high);
}

.score-bar {
  height: 12px;
  background: var(--color-bg-overlay);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: var(--radius-md);
  transition: width 1s ease-out;
}

.score-fill.critical {
  background: var(--score-critical);
}

.score-fill.low {
  background: var(--score-low);
}

.score-fill.medium {
  background: var(--score-medium);
}

.score-fill.high {
  background: var(--score-high);
}

/* Stakeholders List */
.stakeholders-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.stakeholder-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  background: var(--color-bg-overlay);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-default);
}

.stakeholder-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stakeholder-name {
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
}

.stakeholder-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.stakeholder-label.critical {
  color: var(--satisfaction-critical);
}

.stakeholder-label.concerned {
  color: var(--satisfaction-concerned);
}

.stakeholder-label.neutral {
  color: var(--satisfaction-neutral);
}

.stakeholder-label.supportive {
  color: var(--satisfaction-supportive);
}

.stakeholder-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
}

.stakeholder-value.critical {
  color: var(--satisfaction-critical);
}

.stakeholder-value.concerned {
  color: var(--satisfaction-concerned);
}

.stakeholder-value.neutral {
  color: var(--satisfaction-neutral);
}

.stakeholder-value.supportive {
  color: var(--satisfaction-supportive);
}

/* Share Placeholder */
.share-placeholder {
  text-align: center;
  padding: var(--space-4xl) var(--space-2xl);
  background: var(--color-bg-overlay);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border-default);
}

.placeholder-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-lg);
  opacity: 0.5;
}

.placeholder-text {
  color: var(--color-text-secondary);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-sm) 0;
  font-weight: var(--font-semibold);
}

.placeholder-hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-style: italic;
  margin: 0;
}

/* Actions */
.actions-area {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  padding-top: var(--space-lg);
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: var(--space-lg) var(--space-4xl);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  text-transform: uppercase;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-bright);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.btn-primary:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--color-primary-glow);
}

.btn-secondary {
  background: var(--color-bg-overlay);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border-default);
}

.btn-secondary:hover {
  background: var(--color-bg-surface);
  border-color: var(--color-border-focus);
}

.btn-icon {
  font-size: var(--text-xl);
}

/* Footer Links */
.footer-links {
  text-align: center;
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.link-button {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: color var(--transition-base);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
}

.link-button:hover {
  color: var(--color-primary);
  background: var(--color-bg-overlay);
}

.link-icon {
  font-size: var(--text-base);
}

.link-separator {
  color: var(--color-text-muted);
  user-select: none;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes celebrate {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.2) rotate(-15deg);
  }
  75% {
    transform: scale(1.2) rotate(15deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .end-of-run-view {
    padding: var(--space-xl) var(--space-lg);
  }
  
  .outcome-title {
    font-size: var(--text-4xl);
  }
  
  .outcome-tier-badge {
    font-size: var(--text-xl);
    padding: var(--space-md) var(--space-2xl);
  }
  
  .archetype-name {
    font-size: var(--text-2xl);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-area {
    flex-direction: column-reverse;
    width: 100%;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .archetype-icon-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .archetype-icon {
    font-size: 3rem;
  }
}
</style>
