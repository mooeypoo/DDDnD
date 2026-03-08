<template>
  <section class="turn-briefing-panel">
    <header class="briefing-header">
      <p class="briefing-label">Current Turn Briefing</p>
      <h2 class="briefing-title">{{ eventTitle }}</h2>
    </header>

    <p class="briefing-description">{{ narrativeDescription }}</p>

    <div class="briefing-meta">
      <span class="meta-badge">{{ availableActions }} action{{ availableActions === 1 ? '' : 's' }} available</span>
      <span class="meta-badge">{{ pendingAftershocks }} aftershock{{ pendingAftershocks === 1 ? '' : 's' }} pending</span>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  eventTitle: string
  narrativeDescription: string
  availableActions: number
  pendingAftershocks: number
}>()
</script>

<style scoped>
.turn-briefing-panel {
  background: var(--panel-bg);
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-xl);
  padding: var(--panel-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-md);
}

.briefing-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.briefing-label {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-semibold);
}

.briefing-title {
  margin: 0;
  color: var(--color-text-bright);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.briefing-description {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.briefing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.meta-badge {
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

@media (max-width: 768px) {
  .turn-briefing-panel {
    padding: var(--space-lg);
  }
}
</style>
