<template>
  <Transition name="hint-slide">
    <div
      v-if="isVisible && step"
      class="tutorial-hint-panel"
      role="status"
      aria-live="polite"
      aria-label="Tutorial hint"
    >
      <div class="hint-badge">
        <span class="hint-badge-icon">📖</span>
        <span class="hint-badge-label">Tutorial</span>
        <span v-if="totalSteps > 0" class="hint-badge-step">
          Step {{ stepNumber }} / {{ totalSteps }}
        </span>
      </div>

      <div class="hint-content">
        <h3 class="hint-title">{{ step.title }}</h3>
        <p class="hint-message">{{ step.message }}</p>
      </div>

      <button
        class="hint-dismiss-btn"
        @click="$emit('dismiss')"
        aria-label="Dismiss hint"
      >
        Got it
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { TutorialStep } from '@/domains/content/model/tutorial_types'

defineProps<{
  isVisible: boolean
  step: TutorialStep | null
  stepNumber: number
  totalSteps: number
}>()

defineEmits<{
  dismiss: []
}>()
</script>

<style scoped>
.tutorial-hint-panel {
  background: linear-gradient(135deg, var(--color-bg-surface, #1a1a2e) 0%, var(--color-bg-dark, #16213e) 100%);
  border: 2px solid var(--color-primary, #e94560);
  border-radius: var(--radius-xl, 16px);
  padding: var(--space-lg, 16px) var(--space-xl, 20px);
  margin-bottom: var(--space-lg, 16px);
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.15);
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 12px);
}

.hint-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  font-size: var(--text-xs, 0.75rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary, #e94560);
  font-weight: var(--font-bold, 700);
}

.hint-badge-icon {
  font-size: var(--text-base, 1rem);
}

.hint-badge-step {
  margin-left: auto;
  color: var(--color-text-secondary, #a0a0b0);
  font-weight: var(--font-medium, 500);
}

.hint-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
}

.hint-title {
  color: var(--color-text-bright, #ffffff);
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-bold, 700);
  margin: 0;
}

.hint-message {
  color: var(--color-text-primary, #d0d0e0);
  font-size: var(--text-base, 1rem);
  line-height: var(--leading-relaxed, 1.65);
  margin: 0;
}

.hint-dismiss-btn {
  align-self: flex-end;
  background: var(--color-primary, #e94560);
  color: var(--color-text-bright, #ffffff);
  border: none;
  padding: var(--space-sm, 8px) var(--space-xl, 20px);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-bold, 700);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s);
}

.hint-dismiss-btn:hover {
  background: var(--color-primary-light, #ff6b81);
  transform: translateY(-1px);
}

/* Transition */
.hint-slide-enter-active,
.hint-slide-leave-active {
  transition: all 0.3s ease;
}

.hint-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.hint-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .tutorial-hint-panel {
    padding: var(--space-md, 12px) var(--space-lg, 16px);
  }

  .hint-title {
    font-size: var(--text-base, 1rem);
  }

  .hint-message {
    font-size: var(--text-sm, 0.875rem);
  }
}
</style>
