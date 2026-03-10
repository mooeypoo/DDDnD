<template>
  <Transition name="splash">
    <div v-if="isOpen" class="splash-overlay" role="dialog" aria-modal="true" aria-label="Tutorial Complete">
      <div class="splash-scroll-area">
        <div class="splash-content" @click.stop>

          <!-- Victory crest -->
          <div class="splash-crest" aria-hidden="true">
            <div class="crest-glow"></div>
            <span class="crest-icon">🏆</span>
          </div>

          <!-- Header -->
          <header class="splash-header">
            <p class="splash-eyebrow">Tutorial Complete</p>
            <h2 class="splash-title">Well Fought, Architect!</h2>
            <p class="splash-flavor">
              You have conquered the trial and earned your first taste of Domain Architecture.
              The real quests await — or sharpen your skills with another lesson.
            </p>
          </header>

          <!-- Divider -->
          <div class="splash-divider" aria-hidden="true">
            <svg viewBox="0 0 200 12" class="divider-svg" xmlns="http://www.w3.org/2000/svg">
              <line x1="10" y1="6" x2="90" y2="6" stroke="var(--border-accent)" stroke-width="1" stroke-dasharray="4 4"/>
              <circle cx="100" cy="6" r="3" fill="var(--text-accent)" opacity="0.5"/>
              <line x1="110" y1="6" x2="190" y2="6" stroke="var(--border-accent)" stroke-width="1" stroke-dasharray="4 4"/>
            </svg>
          </div>

          <!-- Other tutorials section -->
          <section v-if="otherTutorials.length > 0" class="splash-section">
            <h3 class="section-title">Continue Your Training</h3>
            <div class="tutorial-options">
              <button
                v-for="tutorial in otherTutorials"
                :key="`${tutorial.id}-v${tutorial.version}`"
                class="tutorial-option-card"
                @click="emit('launchTutorial', tutorial)"
              >
                <span class="option-badge">Tutorial {{ tutorial.tutorialOrder ?? '' }}</span>
                <h4 class="option-name">{{ tutorial.name }}</h4>
                <p v-if="tutorial.shortDescription" class="option-description">
                  {{ tutorial.shortDescription }}
                </p>
                <p v-else class="option-description">{{ tutorial.description }}</p>
                <div class="option-stats">
                  <span class="option-stat">🎯 {{ tutorial.turnCount }} Turns</span>
                  <span v-if="tutorial.actionCardCount" class="option-stat">🎴 {{ tutorial.actionCardCount }} Scrolls</span>
                </div>
              </button>
            </div>
          </section>

          <!-- Real game CTA -->
          <section class="splash-action-section">
            <div class="splash-divider" aria-hidden="true">
              <svg viewBox="0 0 200 12" class="divider-svg" xmlns="http://www.w3.org/2000/svg">
                <line x1="10" y1="6" x2="90" y2="6" stroke="var(--border-accent)" stroke-width="1" stroke-dasharray="4 4"/>
                <circle cx="100" cy="6" r="3" fill="var(--text-accent)" opacity="0.5"/>
                <line x1="110" y1="6" x2="190" y2="6" stroke="var(--border-accent)" stroke-width="1" stroke-dasharray="4 4"/>
              </svg>
            </div>

            <h3 class="section-title">Face a Real Quest</h3>
            <p class="action-description">
              No more training wheels. Choose a realm besieged by real architectural chaos
              and put your skills to the test.
            </p>

            <button class="btn-start-real" type="button" @click="emit('startRealGame')">
              <span class="btn-icon" aria-hidden="true">⚔️</span>
              <span class="btn-label">Choose a Quest</span>
            </button>
          </section>

        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'

const props = defineProps<{
  isOpen: boolean
  currentScenarioId: string
  availableTutorials: QuestDisplayModel[]
}>()

const emit = defineEmits<{
  launchTutorial: [tutorial: QuestDisplayModel]
  startRealGame: []
}>()

const otherTutorials = computed(() => {
  return props.availableTutorials.filter(t => t.id !== props.currentScenarioId)
})
</script>

<style scoped>
/* ─── Overlay ─── */
.splash-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--surface-overlay);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-xl);
  overflow-y: auto;
}

.splash-scroll-area {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100%;
  width: 100%;
  padding: var(--space-xl) 0;
}

.splash-content {
  background: linear-gradient(
    180deg,
    var(--surface-card) 0%,
    var(--color-bg-darkest) 100%
  );
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl) var(--space-2xl);
  max-width: 520px;
  width: 100%;
  text-align: center;
  box-shadow:
    0 0 60px rgba(124, 58, 237, 0.12),
    0 0 30px rgba(124, 58, 237, 0.06);
}

/* ─── Crest ─── */
.splash-crest {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg);
  width: 80px;
  height: 80px;
}

.crest-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%);
  animation: crest-pulse 3s ease-in-out infinite;
}

.crest-icon {
  position: relative;
  font-size: 3rem;
  z-index: 1;
}

@keyframes crest-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

/* ─── Header ─── */
.splash-header {
  margin-bottom: var(--space-lg);
}

.splash-eyebrow {
  color: var(--text-accent);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin: 0 0 var(--space-xs) 0;
  font-weight: var(--font-semibold);
}

.splash-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--color-text-bright);
  margin: 0 0 var(--space-sm) 0;
  line-height: var(--leading-tight);
}

.splash-flavor {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin: 0;
  line-height: var(--leading-relaxed);
}

/* ─── Divider ─── */
.splash-divider {
  margin: var(--space-xl) 0;
}

.divider-svg {
  width: 100%;
  max-width: 200px;
  height: 12px;
  display: block;
  margin: 0 auto;
}

/* ─── Section ─── */
.splash-section {
  margin-bottom: var(--space-lg);
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--color-text-bright);
  margin: 0 0 var(--space-md) 0;
}

/* ─── Tutorial option cards ─── */
.tutorial-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.tutorial-option-card {
  background: var(--surface-card-hover);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
}

.tutorial-option-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);
}

.option-badge {
  display: inline-block;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-accent);
  background: var(--surface-card);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-xs);
  font-weight: var(--font-semibold);
}

.option-name {
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--color-text-bright);
  margin: 0 0 var(--space-xs) 0;
}

.option-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-sm) 0;
  line-height: var(--leading-relaxed);
}

.option-stats {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.option-stat {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}

/* ─── Real game CTA ─── */
.splash-action-section {
  margin-top: var(--space-md);
}

.action-description {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin: 0 0 var(--space-lg) 0;
  line-height: var(--leading-relaxed);
}

.btn-start-real {
  background: var(--color-primary);
  color: var(--color-text-bright);
  border: none;
  padding: var(--space-md) var(--space-2xl);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--button-radius);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

.btn-start-real:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--color-primary-glow);
}

/* ─── Transition ─── */
.splash-enter-active {
  transition: opacity 0.4s ease;
}

.splash-enter-active .splash-content {
  transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s;
}

.splash-leave-active {
  transition: opacity 0.3s ease;
}

.splash-leave-active .splash-content {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.splash-enter-from {
  opacity: 0;
}

.splash-enter-from .splash-content {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

.splash-leave-to {
  opacity: 0;
}

.splash-leave-to .splash-content {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .splash-overlay {
    padding: var(--space-md);
  }

  .splash-content {
    padding: var(--space-2xl) var(--space-lg);
  }

  .splash-title {
    font-size: var(--text-xl);
  }
}
</style>
