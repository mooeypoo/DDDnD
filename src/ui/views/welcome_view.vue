<template>
  <div class="welcome-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <div class="welcome-container">
      <div class="hero-section">
        <!-- Logo / Hero Visual Area -->
        <div class="hero-visual">
          <GameLogo size="large" />
        </div>
        
        <!-- Hero Content -->
        <div class="hero-content">
          <h1 class="hero-title">Choose Your Quest. Shape the System.</h1>
          
          <p class="hero-tagline">
            A narrative simulation about architectural decisions, technical debt, 
            and the humans who manage both
          </p>
          
          <div class="hero-description">
            <div class="description-card">
              <p>
                Enter a realm of software systems where each quest presents a different architectural challenge.
                As the systems architect, you will wield decision cards to balance domain clarity, delivery pace,
                stakeholder trust, and team resilience before the final turn.
              </p>
              <p class="description-emphasis">
                Every choice has tradeoffs. Every card has consequences.
                Can you guide your system to a worthy ending?
              </p>
            </div>
          </div>
          
          <!-- CTA Section -->
          <div class="cta-section">
            <button class="btn-start-game" @click="goToSetup">
              <span class="btn-icon">🎲</span>
              <span class="btn-text">Start Your Journey</span>
            </button>
            
            <div class="helper-links">
              <button class="link-button" @click="gameStore.openAboutModal">
                <span class="link-icon">ℹ️</span>
                What is this?
              </button>
              <span class="link-separator">•</span>
              <button class="link-button" @click="gameStore.openRulesModal">
                <span class="link-icon">📖</span>
                How to play
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer attribution -->
      <footer class="welcome-footer">
        <p class="footer-text">
          A playful exploration of software architecture patterns and tradeoffs
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import GameLogo from '@/ui/components/branding/game_logo.vue'

const router = useRouter()
const gameStore = useGameStore()

function goToSetup() {
  router.push('/play')
}
</script>

<style scoped>
.welcome-view {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    var(--color-bg-darkest) 0%, 
    var(--color-bg-dark) 50%, 
    var(--color-bg-medium) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  position: relative;
}

.welcome-container {
  max-width: 900px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

.hero-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
  text-align: center;
}

/* Hero Visual / Logo */
.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: var(--space-xl) 0;
  animation: fadeInUp 0.8s ease-out;
}

/* Hero Content */
.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  animation: fadeInUp 1s ease-out 0.2s both;
}

.hero-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  color: var(--color-text-bright);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.hero-tagline {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
  font-style: italic;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-description {
  max-width: 750px;
  margin: 0 auto;
}

.description-card {
  background: var(--card-bg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.description-card p {
  color: var(--color-text-primary);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-lg) 0;
  font-size: var(--text-base);
}

.description-card p:last-child {
  margin-bottom: 0;
}

.description-emphasis {
  color: var(--color-text-bright);
  font-weight: var(--font-semibold);
}

/* CTA Section */
.cta-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  margin-top: var(--space-lg);
}

.btn-start-game {
  background: var(--color-primary);
  color: var(--color-text-bright);
  border: none;
  padding: var(--space-lg) var(--space-4xl);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  box-shadow: 0 4px 16px var(--color-primary-glow);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  position: relative;
  overflow: hidden;
}

.btn-start-game::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-start-game:hover::before {
  width: 300px;
  height: 300px;
}

.btn-start-game:hover {
  background: var(--color-primary-light);
  transform: translateY(-3px);
  box-shadow: 0 6px 24px var(--color-primary-glow);
}

.btn-start-game:active {
  transform: translateY(-1px);
}

.btn-icon {
  font-size: var(--text-2xl);
  position: relative;
  z-index: 1;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.helper-links {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

.link-button {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: color var(--transition-base);
  text-decoration: none;
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
  font-size: var(--text-lg);
}

.link-separator {
  color: var(--color-text-muted);
  user-select: none;
}

/* Footer */
.welcome-footer {
  text-align: center;
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--color-border-default);
  animation: fadeIn 1.2s ease-out 0.4s both;
}

.footer-text {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-style: italic;
  margin: 0;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .welcome-view {
    padding: var(--space-xl);
  }
  
  .hero-visual {
    min-height: 140px;
  }
  
  .description-card {
    padding: var(--space-xl);
  }
  
  .description-card p {
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .welcome-view {
    padding: var(--space-lg);
  }
  
  .hero-section {
    gap: var(--space-2xl);
  }
  
  .hero-content {
    gap: var(--space-xl);
  }
  
  .btn-start-game {
    width: 100%;
    max-width: 340px;
    padding: var(--space-lg) var(--space-2xl);
    font-size: var(--text-lg);
  }
  
  .helper-links {
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .link-separator {
    display: none;
  }
}
</style>
