<template>
  <div class="run-setup-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="setup-container">
      <div class="setup-header">
        <h1>Prepare Your Run</h1>
        <p class="subtitle">Choose your role and prepare to face the architectural chaos</p>
      </div>
      
      <div class="setup-content">
        <!-- Scenario Info (MVP has only one scenario) -->
        <div class="section scenario-section">
          <h2>Scenario</h2>
          <div class="scenario-card">
            <h3>The Monolith of Mild Despair</h3>
            <p class="scenario-description">
              A legacy monolith is slowing delivery and blurring domain boundaries. 
              You inherit a codebase where every change touches everything.
            </p>
            <div class="scenario-meta">
              <span class="meta-item">8 turns</span>
              <span class="meta-separator">·</span>
              <span class="meta-item">4 stakeholders</span>
              <span class="meta-separator">·</span>
              <span class="meta-item">10 action cards</span>
            </div>
          </div>
        </div>
        
        <!-- Class Selection -->
        <div class="section class-section">
          <h2>Choose Your Class</h2>
          <p class="section-hint">Classes are cosmetic for MVP, but shape your identity</p>
          
          <div v-if="isLoadingClasses" class="loading-state">
            Loading classes...
          </div>
          
          <div v-else class="class-grid">
            <button 
              v-for="classOption in gameStore.availableClasses" 
              :key="classOption.id"
              class="class-card"
              :class="{ selected: selectedClass?.id === classOption.id }"
              @click="selectClass(classOption)"
            >
              <div class="class-icon">
                <!-- Future: Class icon/image -->
                {{ classOption.name.charAt(0) }}
              </div>
              <h3>{{ classOption.name }}</h3>
              <p>{{ classOption.description }}</p>
              <p class="class-flavor">{{ classOption.flavor_text }}</p>
            </button>
          </div>
        </div>
        
        <!-- Optional Character Name -->
        <div class="section name-section">
          <h2>Character Name (Optional)</h2>
          <input 
            v-model="characterName"
            type="text"
            class="name-input"
            placeholder="The Desperate Architect"
            maxlength="50"
          />
        </div>
        
        <!-- Action Buttons -->
        <div class="actions-section">
          <button class="secondary-button" @click="goBack">
            Back
          </button>
          
          <button 
            class="primary-button" 
            :disabled="!selectedClass || gameStore.isLoadingBundle"
            @click="startRun"
          >
            {{ gameStore.isLoadingBundle ? 'Loading...' : 'Begin the Journey' }}
          </button>
        </div>
      </div>
      
      <div class="setup-footer">
        <button class="text-button" @click="gameStore.openAboutModal">
          What is this?
        </button>
        <span class="separator">·</span>
        <button class="text-button" @click="gameStore.openRulesModal">
          Rules
        </button>
      </div>
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
  background: linear-gradient(135deg, #0f0c29 0%, #16213e 50%, #1a1a2e 100%);
  padding: 2rem;
}

.setup-container {
  max-width: 900px;
  margin: 0 auto;
}

.setup-header {
  text-align: center;
  margin-bottom: 3rem;
}

.setup-header h1 {
  font-size: 2.5rem;
  color: #e94560;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #8b92a8;
  font-size: 1.1rem;
  margin: 0;
}

.setup-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section h2 {
  color: #e94560;
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
}

.section-hint {
  color: #8b92a8;
  font-size: 0.95rem;
  margin: -0.5rem 0 1rem 0;
}

.scenario-card {
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
}

.scenario-card h3 {
  color: #e0e0e0;
  font-size: 1.5rem;
  margin: 0 0 0.75rem 0;
}

.scenario-description {
  color: #c0c0c0;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.scenario-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: #8b92a8;
  font-size: 0.9rem;
}

.meta-separator {
  user-select: none;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #8b92a8;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.class-card {
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(139, 146, 168, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.class-card:hover {
  border-color: rgba(233, 69, 96, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.2);
}

.class-card.selected {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.3);
}

.class-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(233, 69, 96, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #e94560;
  margin: 0 auto 1rem auto;
}

.class-card h3 {
  color: #e0e0e0;
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
}

.class-card p {
  color: #c0c0c0;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 0.5rem 0;
}

.class-flavor {
  color: #8b92a8 !important;
  font-style: italic;
  font-size: 0.85rem !important;
}

.name-input {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem 1rem;
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(139, 146, 168, 0.3);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.name-input:focus {
  outline: none;
  border-color: #e94560;
}

.name-input::placeholder {
  color: #8b92a8;
}

.actions-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.primary-button,
.secondary-button {
  padding: 0.875rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.primary-button {
  background: #e94560;
  color: white;
}

.primary-button:hover:not(:disabled) {
  background: #d63851;
  transform: translateY(-2px);
}

.primary-button:disabled {
  background: #5a5a6e;
  cursor: not-allowed;
  opacity: 0.6;
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

.setup-footer {
  margin-top: 2rem;
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

@media (max-width: 768px) {
  .run-setup-view {
    padding: 1rem;
  }
  
  .setup-header h1 {
    font-size: 2rem;
  }
  
  .class-grid {
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
