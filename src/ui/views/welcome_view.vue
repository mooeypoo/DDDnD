<template>
  <div class="welcome-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="welcome-container">
      <div class="hero-section">
        <div class="logo-placeholder">
          <!-- Future: Hero artwork/illustration goes here -->
          <div class="logo-text">DDDnD</div>
        </div>
        
        <h1 class="title">Domain-Driven Design nD</h1>
        
        <p class="tagline">
          A narrative simulation about making architectural decisions in legacy software systems
        </p>
        
        <div class="intro-text">
          <p>
            You inherit a struggling codebase where every change touches everything. 
            As the systems architect, you must balance domain clarity, delivery speed, 
            stakeholder satisfaction, and developer morale—all before time runs out.
          </p>
          <p>
            Every decision involves tradeoffs. Every card has consequences. 
            Can you refactor the monolith before it collapses?
          </p>
        </div>
        
        <div class="cta-section">
          <button class="start-button" @click="goToSetup">
            Start Game
          </button>
          
          <div class="secondary-links">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'

const router = useRouter()
const gameStore = useGameStore()

function goToSetup() {
  router.push('/play')
}
</script>

<style scoped>
.welcome-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #16213e 50%, #1a1a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-container {
  max-width: 800px;
  width: 100%;
}

.hero-section {
  text-align: center;
}

.logo-placeholder {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.logo-text {
  font-size: 5rem;
  font-weight: 900;
  color: #e94560;
  text-shadow: 
    0 0 20px rgba(233, 69, 96, 0.5),
    0 0 40px rgba(233, 69, 96, 0.3);
  letter-spacing: 0.1em;
}

.title {
  font-size: 2.5rem;
  color: #e0e0e0;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.tagline {
  font-size: 1.25rem;
  color: #8b92a8;
  margin: 0 0 2rem 0;
  font-style: italic;
}

.intro-text {
  background: rgba(22, 33, 62, 0.6);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  border: 2px solid rgba(233, 69, 96, 0.2);
}

.intro-text p {
  color: #e0e0e0;
  line-height: 1.7;
  margin: 0 0 1rem 0;
  font-size: 1.05rem;
}

.intro-text p:last-child {
  margin-bottom: 0;
}

.cta-section {
  margin-top: 2.5rem;
}

.start-button {
  background: #e94560;
  color: white;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.start-button:hover {
  background: #d63851;
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(233, 69, 96, 0.6);
}

.start-button:active {
  transform: translateY(0);
}

.secondary-links {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.text-button {
  background: none;
  border: none;
  color: #8b92a8;
  font-size: 1rem;
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
  .welcome-view {
    padding: 1rem;
  }
  
  .logo-text {
    font-size: 3.5rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .tagline {
    font-size: 1.1rem;
  }
  
  .intro-text {
    padding: 1.5rem;
  }
  
  .intro-text p {
    font-size: 1rem;
  }
  
  .start-button {
    font-size: 1.1rem;
    padding: 0.875rem 2.5rem;
  }
}

@media (max-width: 480px) {
  .logo-text {
    font-size: 2.5rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .tagline {
    font-size: 1rem;
  }
  
  .start-button {
    width: 100%;
    max-width: 320px;
  }
}
</style>
