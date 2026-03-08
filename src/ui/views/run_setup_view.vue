<template>
  <div class="run-setup-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="setup-container">
      <!-- Header -->
      <header class="setup-header">
        <div class="header-logo">
          <GameLogo size="medium" />
        </div>
        <h1 class="setup-title">Prepare Your Run</h1>
        <p class="setup-subtitle">Choose your role and prepare to face the architectural chaos</p>
      </header>
      
      <div class="setup-content">
        <!-- Scenario Info (MVP has only one scenario) -->
        <section class="setup-section scenario-section">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">🏛️</span>
              Choose a Quest
            </h2>
          </div>
          
          <div class="scenario-card">
            <div class="scenario-badge">Single Player Campaign</div>
            <h3 class="scenario-name">The Monolith of Mild Despair</h3>
            <p class="scenario-short-summary">
              Stabilize a tangled legacy monolith before delivery confidence collapses.
            </p>
            <p class="scenario-description">
              A legacy monolith is slowing delivery and blurring domain boundaries. 
              You inherit a codebase where every change touches everything. 
              Can you bring order to the chaos before time runs out?
            </p>
            
            <div class="scenario-stats">
              <div class="stat-item">
                <span class="stat-icon">🎯</span>
                <span class="stat-label">8 Turns</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">👥</span>
                <span class="stat-label">4 Stakeholders</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🎴</span>
                <span class="stat-label">10 Action Cards</span>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Class Selection -->
        <section class="setup-section class-section">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">⚔️</span>
              Choose Your Class
            </h2>
            <p class="section-hint">Your architectural archetype (cosmetic for MVP)</p>
          </div>
          
          <div v-if="isLoadingClasses" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading classes...</p>
          </div>
          
          <div v-else class="class-grid">
            <button 
              v-for="classOption in gameStore.availableClasses" 
              :key="classOption.id"
              class="class-card"
              :class="{ selected: selectedClass?.id === classOption.id }"
              @click="selectClass(classOption)"
            >
              <div class="class-visual">
                <!-- Future: Class icon/illustration slot -->
                <div class="class-icon-placeholder">
                  <span class="class-initial">{{ classOption.name.charAt(0) }}</span>
                </div>
              </div>
              
              <div class="class-info">
                <h3 class="class-name">{{ classOption.name }}</h3>
                <p class="class-description">{{ classOption.description }}</p>
                <p class="class-flavor">{{ classOption.flavor_text }}</p>
              </div>
              
              <div v-if="selectedClass?.id === classOption.id" class="selected-indicator">
                ✓ Selected
              </div>
            </button>
          </div>
        </section>
        
        <!-- Optional Character Name -->
        <section class="setup-section name-section">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">✏️</span>
              Character Name
            </h2>
            <p class="section-hint">Optional - Give your architect a name</p>
          </div>
          
          <input 
            v-model="characterName"
            type="text"
            class="name-input"
            placeholder="The Desperate Architect"
            maxlength="50"
          />
        </section>
        
        <!-- Action Buttons -->
        <div class="actions-section">
          <button class="btn-secondary" @click="goBack">
            <span class="btn-icon">←</span>
            <span>Back</span>
          </button>
          
          <button 
            class="btn-primary" 
            :disabled="!selectedClass || gameStore.isLoadingBundle"
            @click="startRun"
          >
            <span class="btn-text">
              {{ gameStore.isLoadingBundle ? 'Loading...' : 'Begin the Journey' }}
            </span>
            <span v-if="!gameStore.isLoadingBundle" class="btn-icon">→</span>
          </button>
        </div>
      </div>
      
      <!-- Footer Links -->
      <footer class="setup-footer">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { PlayerClass } from '@/domains/content/model'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import GameLogo from '@/ui/components/branding/game_logo.vue'

const router = useRouter()
const gameStore = useGameStore()

const selectedClass = ref<PlayerClass | null>(null)
const characterName = ref('')
const isLoadingClasses = ref(false)

onMounted(async () => {
  if (gameStore.availableClasses.length === 0) {
    isLoadingClasses.value = true
    try {
      await gameStore.load_available_classes()
    } finally {
      isLoadingClasses.value = false
    }
  }
})

function selectClass(classOption: PlayerClass) {
  selectedClass.value = classOption
}

function goBack() {
  router.push('/')
}

async function startRun() {
  if (!selectedClass.value) return
  
  await gameStore.start_new_run({
    scenario_id: 'monolith_of_mild_despair',
    scenario_version: 1,
    selected_class_ref: {
      id: selectedClass.value.id,
      version: selectedClass.value.version
    },
    character_name: characterName.value || undefined
  })
  
  router.push('/game')
}
</script>

<style scoped>
.run-setup-view {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    var(--color-bg-darkest) 0%, 
    var(--color-bg-dark) 50%, 
    var(--color-bg-medium) 100%
  );
  padding: var(--space-2xl);
}

.setup-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

/* Header */
.setup-header {
  text-align: center;
  animation: fadeInUp 0.6s ease-out;
}

.header-logo {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-xl);
}

.setup-title {
  font-size: var(--text-4xl);
  color: var(--color-primary);
  margin: 0 0 var(--space-md) 0;
  font-weight: var(--font-black);
  text-shadow: var(--shadow-glow-subtle);
}

.setup-subtitle {
  color: var(--color-text-secondary);
  font-size: var(--text-lg);
  margin: 0;
  font-style: italic;
}

/* Content */
.setup-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.section-title {
  color: var(--color-text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.section-icon {
  font-size: var(--text-3xl);
}

.section-hint {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin: 0;
  font-style: italic;
}

/* Scenario Card */
.scenario-card {
  background: var(--card-bg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.scenario-badge {
  display: inline-block;
  background: var(--color-primary-dark);
  color: var(--color-text-bright);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-lg);
}

.scenario-name {
  color: var(--color-text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-lg) 0;
}

.scenario-description {
  color: var(--color-text-primary);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-lg) 0;
  font-size: var(--text-base);
}

.scenario-short-summary {
  color: var(--color-text-secondary);
  line-height: var(--leading-snug);
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-sm);
  font-style: italic;
  padding: var(--space-md);
  background: var(--color-bg-overlay);
  border-left: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.scenario-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border-default);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.stat-icon {
  font-size: var(--text-lg);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: var(--space-4xl);
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-default);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Class Grid */
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-lg);
}

.class-card {
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.class-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: var(--radius-xl);
  opacity: 0;
  transition: opacity var(--transition-slow);
  z-index: -1;
}

.class-card:hover {
  border-color: var(--card-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.class-card.selected {
  border-color: var(--color-primary);
  background: var(--color-danger-bg);
  box-shadow: 0 4px 20px var(--color-primary-glow);
}

.class-visual {
  margin-bottom: var(--space-lg);
}

.class-icon-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
  transition: transform var(--transition-slow);
}

.class-card:hover .class-icon-placeholder {
  transform: scale(1.1);
}

.class-initial {
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
  color: var(--color-text-bright);
}

.class-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.class-name {
  color: var(--color-text-bright);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  margin: 0;
}

.class-description {
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  margin: 0;
}

.class-flavor {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: var(--text-xs);
  margin: 0;
  line-height: var(--leading-snug);
}

.selected-indicator {
  margin-top: var(--space-md);
  padding: var(--space-sm);
  background: var(--color-primary);
  color: var(--color-text-bright);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

/* Name Input */
.name-input {
  width: 100%;
  max-width: 500px;
  padding: var(--space-lg) var(--space-xl);
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  transition: all var(--transition-base);
  font-family: var(--font-sans);
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-danger-bg);
}

.name-input::placeholder {
  color: var(--color-text-secondary);
}

/* Action Buttons */
.actions-section {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  align-items: center;
  margin-top: var(--space-lg);
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: var(--space-lg) var(--space-3xl);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-bright);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--color-primary-glow);
}

.btn-primary:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
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

/* Footer */
.setup-footer {
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

/* Responsive Design */
@media (max-width: 768px) {
  .run-setup-view {
    padding: var(--space-xl);
  }
  
  .setup-title {
    font-size: var(--text-3xl);
  }
  
  .class-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
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
  .run-setup-view {
    padding: var(--space-lg);
  }
  
  .scenario-stats {
    flex-direction: column;
    gap: var(--space-md);
  }
}
</style>
