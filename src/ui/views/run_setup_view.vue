<template>
  <div class="run-setup-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />
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
          <!-- Desktop: full AppButton ring/bracket structure -->
          <template v-if="!isMobile">
            <AppButton variant="subtle" @click="gameStore.openAboutModal">
              <span>ℹ️</span> What is this?
            </AppButton>
            <span class="link-separator">•</span>
            <AppButton variant="subtle" @click="gameStore.openRulesModal">
              <span>📖</span> Rules
            </AppButton>
            <span class="link-separator">•</span>
            <AppButton variant="subtle" @click="gameStore.openDungeonMasterModal">
              <span>🧙‍♂️</span> Dungeon Master
            </AppButton>
          </template>
          <!-- Mobile: compact etched chip buttons -->
          <template v-else>
            <CompactButton icon="ℹ️" label="What is this?" variant="subtle" @click="gameStore.openAboutModal" />
            <CompactButton icon="📖" label="Rules" variant="subtle" @click="gameStore.openRulesModal" />
            <CompactButton icon="🧙" label="Dungeon Master" variant="subtle" @click="gameStore.openDungeonMasterModal" />
          </template>
        </nav>
      </header>

      <!-- Dungeon console panel — houses the interactive quest/class selection -->
      <AppFrame class="setup-frame">
      <!-- Tab Toggle -->
      <AppTabs
        :tabs="['🏛️ Quests', '📖 Tutorials']"
        v-model="activeTabIndex"
        class="setup-tabs"
      />
      
      <div class="setup-content">
        <!-- ═══ TUTORIALS TAB ═══ -->
        <template v-if="activeTab === 'tutorials'">
        <!-- Tutorial Section -->
        <section class="setup-section tutorial-section">
          <div class="section-header">
            <h2 class="section-title">
              <!-- Compass: tutorials icon -->
              <svg class="section-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="8" stroke="currentColor" fill="none" stroke-width="1.6"/>
                <line x1="10" y1="2" x2="10" y2="5" stroke="currentColor" stroke-width="1.6"/>
                <line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="1.6"/>
                <line x1="2" y1="10" x2="5" y2="10" stroke="currentColor" stroke-width="1.6"/>
                <line x1="15" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10,5 L12,10 L10,9 L8,10 Z" fill="currentColor"/>
                <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
              </svg>
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

          <div v-else class="quest-grid">
            <QuestCard
              v-for="tutorial in gameStore.availableTutorials"
              :key="`${tutorial.id}-v${tutorial.version}`"
              :quest="tutorial"
              @launch="launchTutorial(tutorial)"
            />
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
              <!-- Domain Gate: quests icon -->
              <svg class="section-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M2,18 L2,9 C2,4 5,2 10,2 C15,2 18,4 18,9 L18,18" stroke="currentColor" fill="none" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M5,18 L5,11 C5,7 7,6 10,6 C13,6 15,7 15,11 L15,18" stroke="currentColor" fill="none" stroke-width="1.3" stroke-linecap="round"/>
                <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" stroke-width="1.6"/>
                <path d="M10,2 L11.8,5.5 L10,7 L8.2,5.5 Z" fill="currentColor"/>
                <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
              </svg>
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
            <QuestCard
              v-for="quest in gameStore.availableQuests"
              :key="`${quest.id}-v${quest.version}`"
              :quest="quest"
              :isSelected="selectedQuest?.id === quest.id && selectedQuest?.version === quest.version"
              @select="selectQuest(quest)"
            />
          </div>
        </section>
        
        <!-- Class Selection -->
        <section class="setup-section class-section">
          <div class="section-header">
            <h2 class="section-title">
              <!-- Crossed swords: class selection icon -->
              <svg class="section-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
                <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="17" y1="3" x2="3" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="3" y1="5" x2="5" y2="3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                <line x1="15" y1="3" x2="17" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                <rect x="8.5" y="8.5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
              </svg>
              Choose Your Class
            </h2>
            <p class="section-hint">Your architectural archetype — each class gives +1 to its affinity score per turn</p>
          </div>
          
          <div v-if="isLoadingClasses" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading classes...</p>
          </div>
          
          <div v-else class="class-grid">
            <ClassCard
              v-for="classOption in gameStore.availableClasses"
              :key="classOption.id"
              :playerClass="classOption"
              :isSelected="selectedClass?.id === classOption.id"
              @select="selectClass(classOption)"
            />
          </div>
        </section>
        
        <!-- Optional Character Name -->
        <section class="setup-section name-section">
          <div class="section-header">
            <h2 class="section-title">
              <!-- Quill pen: name icon -->
              <svg class="section-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M16,2 C16,2 18,8 12,12 L8,16 L4,18 L6,14 C6,14 10,11 12,8 C14,5 16,2 16,2 Z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>
                <line x1="4" y1="18" x2="7" y2="15" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <line x1="8" y1="16" x2="11" y2="13" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
              </svg>
              Character Name
            </h2>
            <p class="section-hint">Optional - Give your architect a name</p>
          </div>
          
          <AppInput
            v-model="characterName"
            placeholder="The Desperate Architect"
            :maxlength="50"
          />
        </section>

        <!-- Challenge Modifier (optional) -->
        <section class="setup-section modifier-section">
          <div class="section-header">
            <h2 class="section-title">
              <svg class="section-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10,2 L12,7 L17,7 L13,11 L15,17 L10,13 L5,17 L7,11 L3,7 L8,7 Z" stroke="currentColor" fill="none" stroke-width="1.4" stroke-linejoin="round"/>
              </svg>
              Challenge Mode
            </h2>
            <p class="section-hint">Optional — add a difficulty modifier for extra challenge</p>
          </div>
          
          <div v-if="isLoadingModifiers" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading modifiers...</p>
          </div>
          
          <div v-else class="modifier-layout">
            <!-- None toggle — always visible, visually separated -->
            <button
              class="modifier-none-btn"
              :class="{ active: selectedModifier === null }"
              @click="selectedModifier = null"
            >
              <svg class="modifier-none-icon" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" fill="none" stroke-width="1.4"/>
                <line x1="4" y1="12" x2="12" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <span class="modifier-none-label">No Modifier</span>
              <span class="modifier-none-hint">Standard difficulty</span>
            </button>

            <!-- Modifier chips -->
            <div class="modifier-grid">
              <button
                v-for="modifier in availableModifiers"
                :key="modifier.id"
                class="modifier-chip"
                :class="{ selected: selectedModifier?.id === modifier.id }"
                @click="selectModifier(modifier)"
              >
                <!-- Fire sparkle SVG — visible when selected -->
                <svg
                  v-if="selectedModifier?.id === modifier.id"
                  class="modifier-fire-svg"
                  viewBox="0 0 40 40"
                  aria-hidden="true"
                >
                  <!-- Central flame -->
                  <path d="M20,6 C20,6 26,14 26,22 C26,28 23,32 20,34 C17,32 14,28 14,22 C14,14 20,6 20,6Z"
                        fill="url(#flame-grad)" opacity="0.85"/>
                  <!-- Inner core -->
                  <path d="M20,16 C20,16 23,20 23,24 C23,27 21.5,29 20,30 C18.5,29 17,27 17,24 C17,20 20,16 20,16Z"
                        fill="url(#flame-core)" opacity="0.9"/>
                  <!-- Spark particles -->
                  <circle cx="12" cy="12" r="1.2" fill="#ffd54f" opacity="0.8" class="spark spark-1"/>
                  <circle cx="28" cy="10" r="1" fill="#ffab40" opacity="0.7" class="spark spark-2"/>
                  <circle cx="10" cy="22" r="0.8" fill="#ffd54f" opacity="0.6" class="spark spark-3"/>
                  <circle cx="30" cy="20" r="1.1" fill="#ff8f00" opacity="0.7" class="spark spark-4"/>
                  <circle cx="16" cy="8" r="0.7" fill="#fff176" opacity="0.9" class="spark spark-5"/>
                  <circle cx="25" cy="15" r="0.9" fill="#ffcc02" opacity="0.8" class="spark spark-6"/>
                  <defs>
                    <linearGradient id="flame-grad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stop-color="#ff6f00"/>
                      <stop offset="50%" stop-color="#ff8f00"/>
                      <stop offset="100%" stop-color="#ffd54f"/>
                    </linearGradient>
                    <radialGradient id="flame-core" cx="50%" cy="70%" r="50%">
                      <stop offset="0%" stop-color="#fff9c4"/>
                      <stop offset="100%" stop-color="#ffab40"/>
                    </radialGradient>
                  </defs>
                </svg>

                <span class="modifier-chip-name">{{ modifier.name }}</span>
                <span class="modifier-chip-desc">{{ modifier.description }}</span>
              </button>
            </div>
          </div>
        </section>
        
        <!-- Action Buttons -->
        <div class="actions-section">
          <AppButton variant="secondary" @click="goBack">
            <span>←</span> Back
          </AppButton>
          <AppButton
            variant="primary"
            :disabled="!selectedClass || !selectedQuest || gameStore.isLoadingBundle"
            @click="startRun"
          >
            {{ gameStore.isLoadingBundle ? 'Loading...' : (selectedQuest?.isTutorial ? 'Start Tutorial' : 'Begin the Journey') }}
            <span v-if="!gameStore.isLoadingBundle">→</span>
          </AppButton>
        </div>
        </template>
      </div>
      </AppFrame>

    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { PlayerClass, ChallengeModifier } from '@/domains/content/model'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'
import GameLogo from '@/ui/components/branding/game_logo.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
import CompactButton from '@/ui/components/common/CompactButton.vue'
import AppTabs from '@/ui/components/common/AppTabs.vue'
import AppFrame from '@/ui/components/surfaces/AppFrame.vue'
import AppInput from '@/ui/components/common/AppInput.vue'
import QuestCard from '@/ui/components/cards/quest_card.vue'
import ClassCard from '@/ui/components/cards/class_card.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const selectedClass = ref<PlayerClass | null>(null)
const selectedQuest = ref<QuestDisplayModel | null>(null)
const selectedModifier = ref<ChallengeModifier | null>(null)
const availableModifiers = ref<ChallengeModifier[]>([])
const characterName = ref('')

const isMobile = ref(false)
let _mql: MediaQueryList | null = null
function _onMqlChange(e: MediaQueryListEvent) { isMobile.value = e.matches }
onMounted(() => {
  _mql = window.matchMedia('(max-width: 768px)')
  isMobile.value = _mql.matches
  _mql.addEventListener('change', _onMqlChange)
})
onUnmounted(() => {
  _mql?.removeEventListener('change', _onMqlChange)
})
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
const activeTabIndex = computed({
  get: () => activeTab.value === 'quests' ? 0 : 1,
  set: (i: number) => { activeTab.value = i === 0 ? 'quests' : 'tutorials' }
})
const isLoadingClasses = ref(false)
const isLoadingQuests = ref(false)
const isLoadingTutorials = ref(false)
const isLoadingModifiers = ref(false)

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

  // Load available challenge modifiers
  isLoadingModifiers.value = true
  try {
    await gameStore.load_available_challenge_modifiers()
    availableModifiers.value = gameStore.availableChallengeModifiers
  } catch {
    // Challenge modifiers are optional
  } finally {
    isLoadingModifiers.value = false
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

function selectModifier(modifier: ChallengeModifier) {
  selectedModifier.value = modifier
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
    selected_challenge_modifier_ref: selectedModifier.value ? {
      id: selectedModifier.value.id,
      version: selectedModifier.value.version
    } : undefined,
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

/* AppFrame wrapper for the interactive selection panel */
.setup-frame :deep(.dungeon-frame__body) {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-xl);
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
  color: var(--dng-title-gold, #d4b860);
  margin: 0 0 var(--space-md) 0;
  font-weight: var(--font-black);
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
  color: var(--dng-title-gold, #d4b860);
  font-family: var(--font-heading, 'Cinzel', serif);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.section-icon-svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: var(--dng-title-gold, #d4b860);
  opacity: 0.85;
}

.section-hint {
  color: var(--dng-subtitle-warm, #7a6c44);
  font-size: var(--text-sm);
  margin: 0;
  font-style: italic;
}

/* Quest Grid */
.quest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}

/* Tutorials note prompt */
.tutorials-note-glow {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--dng-panel-top, #0e2232);
  border: 1px solid var(--dng-divider, rgba(168, 120, 32, 0.35));
  color: var(--dng-subtitle-warm, #7a6c44);
  font-size: var(--text-sm);
  font-style: italic;
  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%,
    100% 4px, 100% calc(100% - 4px),
    calc(100% - 4px) 100%, 4px 100%,
    0% calc(100% - 4px), 0% 4px
  );
}

.note-icon {
  flex-shrink: 0;
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
}

/* Modifier layout */
.modifier-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modifier-none-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  cursor: pointer;
  transition: border-color var(--transition-base), background var(--transition-base);
}

.modifier-none-btn:hover {
  border-color: var(--border-hover);
}

.modifier-none-btn.active {
  border-color: color-mix(in oklab, var(--color-accent, #26d4b9), transparent 30%);
  background: color-mix(in oklab, var(--color-accent, #26d4b9), transparent 92%);
}

.modifier-none-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.modifier-none-btn.active .modifier-none-icon {
  color: var(--color-accent, #26d4b9);
}

.modifier-none-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.modifier-none-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-left: auto;
}

/* Modifier grid */
.modifier-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.modifier-chip {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  min-width: 160px;
  max-width: 240px;
  overflow: hidden;
}

.modifier-chip:hover {
  border-color: var(--border-hover);
}

.modifier-chip.selected {
  border-color: #ff8f00;
  box-shadow:
    0 0 0 1px #ff8f00,
    0 0 12px rgba(255, 143, 0, 0.25),
    0 0 24px rgba(255, 111, 0, 0.12);
  background: linear-gradient(
    170deg,
    rgba(255, 143, 0, 0.08) 0%,
    rgba(255, 111, 0, 0.04) 40%,
    var(--surface-card) 100%
  );
  animation: modifier-glow-pulse 2.5s ease-in-out infinite;
}

/* Fire SVG overlay */
.modifier-fire-svg {
  position: absolute;
  top: -6px;
  right: -4px;
  width: 40px;
  height: 40px;
  pointer-events: none;
  animation: flame-flicker 1.8s ease-in-out infinite;
}

/* Spark particle animations */
.spark { animation-duration: 2s; animation-iteration-count: infinite; }
.spark-1 { animation-name: spark-float-1; }
.spark-2 { animation-name: spark-float-2; }
.spark-3 { animation-name: spark-float-3; }
.spark-4 { animation-name: spark-float-4; }
.spark-5 { animation-name: spark-float-5; }
.spark-6 { animation-name: spark-float-6; }

@keyframes flame-flicker {
  0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.85; }
  25% { transform: scaleY(1.06) translateY(-1px); opacity: 1; }
  50% { transform: scaleY(0.95) translateY(1px); opacity: 0.8; }
  75% { transform: scaleY(1.03) translateY(-0.5px); opacity: 0.92; }
}

@keyframes spark-float-1 {
  0%, 100% { transform: translate(0, 0); opacity: 0.8; }
  50% { transform: translate(-2px, -4px); opacity: 0.3; }
}
@keyframes spark-float-2 {
  0%, 100% { transform: translate(0, 0); opacity: 0.7; }
  50% { transform: translate(3px, -5px); opacity: 0.2; }
}
@keyframes spark-float-3 {
  0%, 100% { transform: translate(0, 0); opacity: 0.6; }
  50% { transform: translate(-3px, -3px); opacity: 0.2; }
}
@keyframes spark-float-4 {
  0%, 100% { transform: translate(0, 0); opacity: 0.7; }
  50% { transform: translate(2px, -4px); opacity: 0.3; }
}
@keyframes spark-float-5 {
  0%, 100% { transform: translate(0, 0); opacity: 0.9; }
  50% { transform: translate(-1px, -5px); opacity: 0.2; }
}
@keyframes spark-float-6 {
  0%, 100% { transform: translate(0, 0); opacity: 0.8; }
  50% { transform: translate(2px, -3px); opacity: 0.3; }
}

@keyframes modifier-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 1px #ff8f00, 0 0 12px rgba(255, 143, 0, 0.25), 0 0 24px rgba(255, 111, 0, 0.12); }
  50% { box-shadow: 0 0 0 1px #ff8f00, 0 0 18px rgba(255, 143, 0, 0.35), 0 0 32px rgba(255, 111, 0, 0.18); }
}

.modifier-chip.selected .modifier-chip-name {
  color: #ffab40;
}

.modifier-chip-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  transition: color 0.2s ease;
}

.modifier-chip-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.3;
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

/* Header utility nav */
.header-utility-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
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
  
  .actions-section :deep(.dungeon-btn) {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .run-setup-view {
    padding: var(--space-lg);
  }

  .setup-loading-overlay {
    padding: 6px;
    align-items: flex-end;
  }

  .setup-loading-panel {
    width: 100%;
    padding: var(--space-lg) var(--space-md);
    gap: var(--space-md);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .setup-loading-title {
    font-size: var(--text-lg);
  }

}
</style>
