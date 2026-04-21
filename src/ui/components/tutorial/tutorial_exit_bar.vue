<template>
  <div v-if="isTutorial" class="tutorial-exit-bar">
    <div class="exit-bar-content">
      <span class="exit-bar-label">
        <span class="exit-bar-icon"><IconScroll :size="14" /></span>
        Tutorial Mode
      </span>
      <button class="exit-bar-btn" @click="$emit('leave')">
        Leave Tutorial &amp; Start a Real Quest →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconScroll from '@/ui/components/icons/IconScroll.vue'

/**
 * Contextual tutorial-mode banner with an explicit exit action.
 */
defineProps<{
  isTutorial: boolean
}>()

defineEmits<{
  leave: []
}>()
</script>

<style scoped>
.tutorial-exit-bar {
  background: rgba(13, 9, 4, 0.5);
  border-bottom: 1px solid var(--dng-divider);
  padding: var(--space-sm, 8px) var(--space-lg, 16px);
}

.exit-bar-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md, 12px);
  flex-wrap: wrap;
}

.exit-bar-label {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-semibold, 600);
  display: flex;
  align-items: center;
  gap: var(--space-xs, 4px);
}

.exit-bar-icon {
  font-size: var(--text-base, 1rem);
}

.exit-bar-btn {
  background: none;
  border: 1px solid var(--dng-subtitle-warm);
  color: var(--dng-subtitle-warm);
  padding: var(--space-xs, 4px) var(--space-lg, 16px);
  font-size: var(--text-sm, 0.875rem);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s);
  white-space: nowrap;
}

.exit-bar-btn:hover {
  color: var(--dng-bronze-hi);
  border-color: var(--dng-bronze-hi);
  background: var(--dng-shell-bg);
}

@media (max-width: 480px) {
  .exit-bar-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
