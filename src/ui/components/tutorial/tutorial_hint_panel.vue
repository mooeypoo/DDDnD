<template>
  <Transition name="hint-slide">
    <div
      v-if="isVisible && step"
      class="tutorial-hint-panel"
      role="status"
      aria-live="polite"
      aria-label="Tutorial hint"
    >
      <AppCard title="📖 Tutorial">
        <template #header-actions>
          <AppBadge
            v-if="totalSteps > 0"
            variant="info"
            :label="`Step ${stepNumber} / ${totalSteps}`"
            size="sm"
          />
        </template>

        <div class="hint-content">
          <h3 class="hint-title">{{ step.title }}</h3>
          <p class="hint-message">{{ step.message }}</p>
        </div>

        <template #footer>
          <div class="hint-footer">
            <AppButton label="Got it" variant="primary" @click="$emit('dismiss')" />
          </div>
        </template>
      </AppCard>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { TutorialStep } from '@/domains/content/model/tutorial_types'
import AppCard from '@/ui/components/cards/AppCard.vue'
import AppBadge from '@/ui/components/common/AppBadge.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

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
/* Outer wrapper: accessibility + spacing only. AppCard owns the visual shell. */
.tutorial-hint-panel {
  margin-bottom: var(--space-lg);
}

.hint-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hint-title {
  color: var(--text-bright);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  margin: 0;
}

.hint-message {
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* Right-align the dismiss button in the card footer */
.hint-footer {
  display: flex;
  justify-content: flex-end;
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

@media (max-width: 768px) {
  .hint-title {
    font-size: var(--text-sm);
  }

  .hint-message {
    font-size: var(--text-xs);
  }
}
</style>
