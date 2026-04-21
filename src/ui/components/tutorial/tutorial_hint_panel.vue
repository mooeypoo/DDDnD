<template>
  <Transition name="hint-slide">
    <div
      v-if="step"
      class="tutorial-hint-inline"
      role="note"
      aria-label="Tutorial hint"
    >
      <button
        class="hint-inline-header"
        type="button"
        :aria-expanded="isExpanded"
        @click="isExpanded = !isExpanded"
      >
        <span class="hint-inline-icon" aria-hidden="true">📖</span>
        <span class="hint-inline-title">{{ step.title }}</span>
        <span v-if="totalSteps > 0" class="hint-inline-counter" aria-label="Step counter">
          {{ stepNumber }}&thinsp;/&thinsp;{{ totalSteps }}
        </span>
        <span class="hint-inline-toggle" aria-hidden="true">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>

      <Transition name="hint-expand">
        <div v-if="isExpanded" class="hint-inline-body">
          <p class="hint-inline-message">{{ step.message }}</p>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TutorialStep } from '@/domains/content/model/tutorial_types'

/**
 * Inline tutorial hint panel that reveals the current authored tutorial step.
 */
defineProps<{
  step: TutorialStep | null
  stepNumber: number
  totalSteps: number
}>()

const isExpanded = ref(true)
</script>

<style scoped>
.tutorial-hint-inline {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(8, 11, 19, 0.52);
  border-color: color-mix(in oklab, var(--dng-bronze-mid, #b8860b), transparent 55%);
}

.hint-inline-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
  transition: background var(--transition-fast, 120ms ease);
}

.hint-inline-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.hint-inline-icon {
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.hint-inline-title {
  flex: 1;
  color: var(--dng-title-gold, #c8981e);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.hint-inline-counter {
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.hint-inline-toggle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

.hint-inline-body {
  border-top: 1px solid color-mix(in oklab, var(--dng-bronze-mid, #b8860b), transparent 70%);
  padding: 0.65rem 0.85rem;
}

.hint-inline-message {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  font-style: italic;
}

/* Slide-in entrance for the whole panel */
.hint-slide-enter-active,
.hint-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.hint-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.hint-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Expand/collapse for the body */
.hint-expand-enter-active {
  transition: opacity var(--duration-fast, 150ms) var(--ease-decelerate, ease),
              transform var(--duration-fast, 150ms) var(--ease-decelerate, ease);
}
.hint-expand-leave-active {
  transition: opacity var(--duration-instant, 80ms) var(--ease-accelerate, ease),
              transform var(--duration-instant, 80ms) var(--ease-accelerate, ease);
}
.hint-expand-enter-from,
.hint-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
