<template>
  <div v-if="isTutorial" class="tutorial-exit-bar">
    <div class="exit-bar-content">
      <span class="exit-bar-label">
        <span class="exit-bar-icon">📖</span>
        Tutorial Mode
      </span>
      <button class="exit-bar-btn" @click="$emit('leave')">
        Leave Tutorial &amp; Start a Real Quest →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isTutorial: boolean
}>()

defineEmits<{
  leave: []
}>()
</script>

<style scoped>
.tutorial-exit-bar {
  background: var(--color-bg-overlay, rgba(0, 0, 0, 0.3));
  border-bottom: 1px solid var(--color-border-default, #333);
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
  color: var(--color-text-secondary, #a0a0b0);
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
  border: 1px solid var(--color-text-secondary, #a0a0b0);
  color: var(--color-text-secondary, #a0a0b0);
  padding: var(--space-xs, 4px) var(--space-lg, 16px);
  font-size: var(--text-sm, 0.875rem);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s);
  white-space: nowrap;
}

.exit-bar-btn:hover {
  color: var(--color-primary, #e94560);
  border-color: var(--color-primary, #e94560);
  background: var(--color-bg-surface, #1a1a2e);
}

@media (max-width: 480px) {
  .exit-bar-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
