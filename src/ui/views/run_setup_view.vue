<template>
  <div class="run-setup-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />

    <div
      v-if="gameStore.isLoadingBundle"
      class="setup-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Preparing your run"
    >
      <div class="setup-loading-panel">
        <p class="setup-loading-eyebrow">Preparing Your Run</p>
        <h2 class="setup-loading-title">Setting up your quest...</h2>
        <p class="setup-loading-description">
          Gathering scenario data, shuffling decisions, and briefing your first turn.
        </p>

        <div class="setup-loading-orbit" aria-hidden="true">
          <span class="orbit-dot dot-1"></span>
          <span class="orbit-dot dot-2"></span>
          <span class="orbit-dot dot-3"></span>
        </div>

        <p class="setup-loading-footnote">This can take a few seconds on mobile.</p>
      </div>
    </div>
    
    <div class="setup-container">
      <!-- Header -->
      <header class="setup-header">
        <div class="header-logo">
          <GameLogo size="medium" />
        </div>
        <h1 class="setup-title">Welcome, Architect</h1>
        <p class="setup-subtitle">
          Choose a quest and lead a beleaguered domain through architectural chaos.
        </p>
        <p v-if="gameStore.availableTutorials.length > 0" class="setup-tutorial-hint">
          First time here? Try a <button class="link-btn" @click="activeTab = 'tutorials'">guided tutorial</button> to learn the ropes.
        </p>
        <nav class="header-utility-nav" aria-label="Utility links">
          <button class="link-button" @click="gameStore.openAboutModal">
            <span class="link-icon">ℹ️</span>
            What is this?
          </button>
          <span class="link-separator">•</span>
          <button class="link-button" @click="gameStore.openRulesModal">
            <span class="link-icon">📖</span>
            Rules
          </button>
        </nav>
      </header>

      <!-- Tab Toggle -->
      <nav class="tab-toggle" role="tablist" aria-label="Setup mode">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'quests' }"
          role="tab"
          :aria-selected="activeTab === 'quests'"
          @click="activeTab = 'quests'"
        >
          <span class="tab-icon">🏛️</span>
          <span class="tab-label">Quests</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'tutorials' }"
          role="tab"
          :aria-selected="activeTab === 'tutorials'"
          @click="activeTab = 'tutorials'"
        >
          <span class="tab-icon">📖</span>
          <span class="tab-label">Tutorials</span>
        </button>
      </nav>
      
      <div class="setup-content">
        <!-- ═══ TUTORIALS TAB ═══ -->
        <template v-if="activeTab === 'tutorials'">
        <!-- Tutorial Section -->
        <section class="setup-section tutorial-section">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">📖</span>
              Guided Tutorials
            </h2>
            <p class="section-hint">Learn the game mechanics step by step — click a tutorial to begin immediately</p>
          </div>

          <div v-if="isLoadingTutorials" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading tutorials...</p>
          </div>

          <div v-else-if="gameStore.availableTutorials.length === 0" class="empty-state">
            <p>No tutorials available.</p>
          </div>

          <div v-else class="quest-grid tutorial-grid">
            <button
              v-for="tutorial in gameStore.availableTutorials"
              :key="`${tutorial.id}-v${tutorial.version}`"
              class="quest-card tutorial-card"
              :class="{ selected: selectedQuest?.id === tutorial.id && selectedQuest?.version === tutorial.version }"
              @click="launchTutorial(tutorial)"
            >
              <div class="quest-badge tutorial-badge">Tutorial {{ tutorial.tutorialOrder ?? '' }}</div>

              <h3 class="quest-name">{{ tutorial.name }}</h3>

              <p v-if="tutorial.shortDescription" class="quest-short-summary">
                {{ tutorial.shortDescription }}
              </p>

              <p class="quest-description">{{ tutorial.description }}</p>

              <div v-if="tutorial.turnCount" class="quest-stats">
                <div class="stat-item">
                  <span class="stat-icon">🎯</span>
                  <span class="stat-label">{{ tutorial.turnCount }} Turns</span>
                </div>
                <div v-if="tutorial.actionCardCount" class="stat-item">
                  <span class="stat-icon">🎴</span>
                  <span class="stat-label">{{ tutorial.actionCardCount }} Actions</span>
                </div>
              </div>

              <div v-if="selectedQuest?.id === tutorial.id && selectedQuest?.version === tutorial.version" class="selected-indicator">
                ✓ Selected
              </div>
            </button>
          </div>
        </section>
        </template>

        <!-- ═══ QUESTS TAB ═══ -->
        <template v-if="activeTab === 'quests'">
        <!-- Prominent note for tutorials -->
        <div v-if="gameStore.availableTutorials.length > 0 && !getTutorialsComplete()" class="tutorials-note-glow">
          <span class="note-icon">✨</span>
          Need a hand? Try the <button class="link-btn" @click="activeTab = 'tutorials'">guided tutorials</button> for a step-by-step intro!
        </div>
        <!-- Quest Selection (data-driven from scenario content) -->
        <section class="setup-section quest-section">
          <div class="section-header">
            <h2 class="section-title">
              <span class="section-icon">🏛️</span>
              Choose a Quest
            </h2>
          </div>
          
          <div v-if="isLoadingQuests" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading quests...</p>
          </div>
          
          <div v-else-if="gameStore.availableQuests.length === 0" class="empty-state">
            <p>No quests available. Please check your content directory.</p>
          </div>
          
          <div v-else class="quest-grid">
            <button 
              v-for="quest in gameStore.availableQuests" 
              :key="`${quest.id}-v${quest.version}`"
              class="quest-card"
              :class="{ selected: selectedQuest?.id === quest.id && selectedQuest?.version === quest.version }"
              @click="selectQuest(quest)"
            >
              <div class="quest-badge">Official Campaign</div>
              
              <h3 class="quest-name">{{ quest.name }}</h3>
              
              <p v-if="quest.shortDescription" class="quest-short-summary">
                {{ quest.shortDescription }}
              </p>
              
              <p class="quest-description">
                {{ quest.description }}
              </p>
              
              <p v-if="quest.flavorText" class="quest-flavor">
                {{ quest.flavorText }}
              </p>
              
              <div v-if="quest.turnCount || quest.stakeholderCount || quest.actionCardCount" class="quest-stats">
                <div v-if="quest.turnCount" class="stat-item">
                  <span class="stat-icon">🎯</span>
                  <span class="stat-label">{{ quest.turnCount }} Turns</span>
                </div>
                <div v-if="quest.stakeholderCount" class="stat-item">
                  <span class="stat-icon">👥</span>
                  <span class="stat-label">{{ quest.stakeholderCount }} Stakeholders</span>
                </div>
                <div v-if="quest.actionCardCount" class="stat-item">
                  <span class="stat-icon">🎴</span>
                  <span class="stat-label">{{ quest.actionCardCount }} Action Cards</span>
                </div>
              </div>
              
              <div v-if="selectedQuest?.id === quest.id && selectedQuest?.version === quest.version" class="selected-indicator">
                ✓ Selected
              </div>
            </button>
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
                <ClassPortrait
                  :classId="classOption.id"
                  :className="classOption.name"
                  size="lg"
                />
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
            :disabled="!selectedClass || !selectedQuest || gameStore.isLoadingBundle"
            @click="startRun"
          >
            <span class="btn-text">
              {{ gameStore.isLoadingBundle ? 'Loading...' : (selectedQuest?.isTutorial ? 'Start Tutorial' : 'Begin the Journey') }}
            </span>
            <span v-if="!gameStore.isLoadingBundle" class="btn-icon">→</span>
          </button>
        </div>
        </template>
      </div>
      

    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { PlayerClass } from '@/domains/content/model'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import GameLogo from '@/ui/components/branding/game_logo.vue'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const selectedClass = ref<PlayerClass | null>(null)
const selectedQuest = ref<QuestDisplayModel | null>(null)
const characterName = ref('')
// Default to 'tutorials' unless tutorialsComplete is set in localStorage
const TUTORIALS_COMPLETE_KEY = 'dddnd.tutorialsComplete'
const getTutorialsComplete = () => {
  try {
    return localStorage.getItem(TUTORIALS_COMPLETE_KEY) === 'true'
  } catch { return false }
}
const setTutorialsComplete = () => {
  try { localStorage.setItem(TUTORIALS_COMPLETE_KEY, 'true') } catch {}
}
const activeTab = ref<'tutorials' | 'quests'>(getTutorialsComplete() ? 'quests' : 'tutorials')
const isLoadingClasses = ref(false)
const isLoadingQuests = ref(false)
const isLoadingTutorials = ref(false)

onMounted(async () => {
  // Load available classes if not already loaded
  if (gameStore.availableClasses.length === 0) {
    isLoadingClasses.value = true
    try {
      await gameStore.load_available_classes()
    } finally {
      isLoadingClasses.value = false
    }
  }

  // Load tutorials
  if (gameStore.availableTutorials.length === 0) {
    isLoadingTutorials.value = true
    try {
      await gameStore.load_available_tutorials()
    } finally {
      isLoadingTutorials.value = false
    }
  }
  
  // Load available quests if not already loaded
  if (gameStore.availableQuests.length === 0) {
    isLoadingQuests.value = true
    try {
      await gameStore.load_available_quests()
    } finally {
      isLoadingQuests.value = false
    }
  }

  // Handle tutorial query param from welcome page
  const tutorialParam = route.query.tutorial as string | undefined
  if (tutorialParam && gameStore.availableTutorials.length > 0) {
    const targetOrder = tutorialParam === 'basics' ? 1 : tutorialParam === 'advanced' ? 2 : null
    if (targetOrder !== null) {
      const match = gameStore.availableTutorials.find(t => t.tutorialOrder === targetOrder)
      if (match) {
        await launchTutorial(match)
        return
      }
    }
  }

  // Switch to tutorials tab if navigated with ?tab=tutorials
  const tabParam = route.query.tab as string | undefined
  if (tabParam === 'tutorials' && gameStore.availableTutorials.length > 0) {
    activeTab.value = 'tutorials'
  }

  // Auto-select first quest if no tutorial was pre-selected
  if (!selectedQuest.value && gameStore.availableQuests.length > 0) {
    selectedQuest.value = gameStore.availableQuests[0]
  }
})

// If user switches to quests tab after being in tutorials, mark tutorials as complete
watch(activeTab, (tab, prev) => {
  if (tab === 'quests' && prev === 'tutorials' && !getTutorialsComplete()) {
    setTutorialsComplete()
  }
})

function selectClass(classOption: PlayerClass) {
  selectedClass.value = classOption
}

function selectQuest(quest: QuestDisplayModel) {
  selectedQuest.value = quest
}

function goBack() {
  router.push('/')
}

async function startRun() {
  if (!selectedClass.value || !selectedQuest.value) return
  
  await gameStore.start_new_run({
    scenario_id: selectedQuest.value.id,
    scenario_version: selectedQuest.value.version,
    selected_class_ref: {
      id: selectedClass.value.id,
      version: selectedClass.value.version
    },
    character_name: characterName.value || undefined,
    is_tutorial: selectedQuest.value.isTutorial ?? false
  })
  
  router.push('/game')
}

/**
 * Launch a tutorial directly — skips class selection, picks the first class,
 * and starts the run immediately.
 */
async function launchTutorial(quest: QuestDisplayModel) {
  const fallbackClass = gameStore.availableClasses[0]
  if (!fallbackClass) return

  await gameStore.start_new_run({
    scenario_id: quest.id,
    scenario_version: quest.version,
    selected_class_ref: {
      id: fallbackClass.id,
      version: fallbackClass.version
    },
    is_tutorial: true
  })

  router.push('/game')
  // Mark tutorials as complete when a tutorial is finished and user returns to quests
  setTutorialsComplete()
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

.setup-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--surface-overlay);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.setup-loading-panel {
  width: min(560px, 100%);
  background: var(--surface-modal);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-lg);
}

.setup-loading-eyebrow {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--font-semibold);
}

.setup-loading-title {
  margin: 0;
  color: var(--color-text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}

.setup-loading-description {
  margin: 0;
  color: var(--color-text-primary);
  line-height: var(--leading-relaxed);
  max-width: 42ch;
}

.setup-loading-orbit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
}

.orbit-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: orbitPulse 1.1s ease-in-out infinite;
}

.dot-2 {
  animation-delay: 0.15s;
}

.dot-3 {
  animation-delay: 0.3s;
}

.setup-loading-footnote {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

@keyframes orbitPulse {
  0%,
  100% {
    transform: translateY(0) scale(0.8);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-6px) scale(1);
    opacity: 1;
  }
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

.setup-tutorial-hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin: var(--space-xs) 0 0;
}

.link-btn {
  all: unset;
  cursor: pointer;
  color: var(--text-accent);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.link-btn:hover {
  color: var(--color-text-primary);
}

/* Tab Toggle */
.tab-toggle {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  background: var(--color-bg-overlay);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xs);
  max-width: 400px;
  margin: 0 auto;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.tab-btn:hover:not(.active) {
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
}

.tab-btn.active {
  background: var(--color-primary-dark);
  border-color: var(--color-primary);
  color: var(--color-text-bright);
  box-shadow: 0 2px 8px var(--color-primary-glow);
}

.tab-icon {
  font-size: var(--text-lg);
}

.tab-label {
  letter-spacing: 0.03em;
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

/* Quest Grid and Cards */
.quest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}

.quest-card {
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-align: left;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  font-family: var(--font-sans);
}

.quest-card::before {
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

.quest-card:hover {
  border-color: var(--card-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.quest-card.selected {
  border-color: var(--color-primary);
  background: var(--color-danger-bg);
  box-shadow: 0 4px 20px var(--color-primary-glow);
}

.quest-badge {
  display: inline-block;
  background: var(--color-primary-dark);
  color: var(--color-text-bright);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  align-self: flex-start;
}

.quest-name {
  color: var(--color-text-bright);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0;
}

.quest-description {
  color: var(--color-text-primary);
  line-height: var(--leading-relaxed);
  margin: 0;
  font-size: var(--text-base);
}

.quest-short-summary {
  color: var(--color-text-secondary);
  line-height: var(--leading-snug);
  margin: 0;
  font-size: var(--text-sm);
  font-style: italic;
  padding: var(--space-md);
  background: var(--color-bg-overlay);
  border-left: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.quest-flavor {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: var(--text-sm);
  margin: 0;
  line-height: var(--leading-snug);
}

.quest-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-default);
  margin-top: auto;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-4xl);
  color: var(--color-text-secondary);
  background: var(--card-bg);
  border: 2px dashed var(--card-border);
  border-radius: var(--radius-xl);
}

.empty-state p {
  margin: 0;
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

.class-visual {
  display: flex;
  justify-content: center;
  transition: transform var(--transition-slow);
}

.class-card:hover .class-visual {
  transform: scale(1.08);
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

/* Header utility nav */
.header-utility-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
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

/* Tutorial badge and card accent */
.tutorial-badge {
  background: var(--color-bg-overlay, rgba(0, 0, 0, 0.3));
  border: 1px solid var(--color-primary, #e94560);
}

.tutorial-card.selected {
  border-color: var(--color-primary);
}

.tutorial-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* Responsive Design */
@media (max-width: 768px) {
  .run-setup-view {
    padding: var(--space-xl);
  }

  .setup-loading-panel {
    padding: var(--space-xl);
    gap: var(--space-md);
  }

  .setup-loading-title {
    font-size: var(--text-xl);
  }
  
  .setup-title {
    font-size: var(--text-3xl);
  }
  
  .class-grid {
    grid-template-columns: 1fr;
  }
  
  .quest-grid {
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

  .setup-loading-overlay {
    padding: var(--space-lg);
  }

  .setup-loading-panel {
    border-radius: var(--radius-lg);
  }
  
  .quest-stats {
    flex-direction: column;
    gap: var(--space-md);
  }

  .tab-toggle {
    max-width: 100%;
  }

  .tab-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
  }
}
</style>
