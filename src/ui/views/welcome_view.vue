<template>
  <div class="welcome-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />
    
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
            <AppCard variant="aged">
              <p>
                Enter a realm of software systems where each quest presents a different architectural challenge.
                As the systems architect, you will wield action cards to balance domain clarity, delivery pace,
                stakeholder trust, and team resilience before the final turn.
              </p>
              <p class="description-emphasis">
                Every choice has tradeoffs. Every action has consequences.
                Can you guide your system to a worthy ending?
              </p>
            </AppCard>
          </div>
          
          <!-- CTA Section -->
          <div class="cta-section">
            <AppButton size="hero" variant="primary" @click="goToSetup()">
              <span>🎲</span>
              Start Your Journey
            </AppButton>

            <div class="tutorial-links">
              <span class="tutorial-links-label">New here?</span>
              <AppButton variant="subtle" @click="goToSetup('basics')">
                <span>📖</span> Basics Tutorial
              </AppButton>
              <span class="link-separator">•</span>
              <AppButton variant="subtle" @click="goToSetup('advanced')">
                <span>⚙️</span> Advanced Tutorial
              </AppButton>
            </div>
            
            <div class="helper-links">
              <AppButton variant="subtle" @click="gameStore.openAboutModal">
                <span>ℹ️</span> What is this?
              </AppButton>
              <span class="link-separator">•</span>
              <AppButton variant="subtle" @click="gameStore.openRulesModal">
                <span>📖</span> How to play
              </AppButton>
              <span class="link-separator">•</span>
              <AppButton variant="subtle" @click="gameStore.openDungeonMasterModal">
                <span>🧙‍♂️</span> Dungeon Master
              </AppButton>
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
import AppButton from '@/ui/components/common/AppButton.vue'
import AppCard from '@/ui/components/cards/AppCard.vue'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import GameLogo from '@/ui/components/branding/game_logo.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'
const router = useRouter()
const gameStore = useGameStore()

function goToSetup(tutorialType?: string) {
  if (tutorialType) {
    router.push({ path: '/play', query: { tutorial: tutorialType } })
  } else {
    router.push('/play')
  }
}
</script>

<style scoped>
.welcome-view {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    var(--dng-shell-bg) 0%, 
    var(--dng-shell-bg) 50%, 
    rgba(16, 11, 5, 0.9) 100%
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
  color: var(--dng-title-gold);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.hero-tagline {
  font-size: var(--text-lg);
  color: var(--dng-subtitle-warm);
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

.description-emphasis {
  color: var(--dng-title-gold);
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

.btn-icon {
  font-size: var(--text-2xl);
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

.link-separator {
  color: var(--dng-footer-muted);
  user-select: none;
}

/* Tutorial Links */
.tutorial-links {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.tutorial-links-label {
  color: var(--dng-footer-muted);
  font-size: var(--text-sm);
  font-style: italic;
}

/* Footer */
.welcome-footer {
  text-align: center;
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--dng-divider);
  animation: fadeIn 1.2s ease-out 0.4s both;
}

.footer-text {
  color: var(--dng-footer-muted);
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
  
  .helper-links {
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .link-separator {
    display: none;
  }
}
</style>
