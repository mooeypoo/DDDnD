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
  background: var(--surface-panel);
  border: 1px solid var(--border-panel);
  border-left: 3px solid var(--border-accent);
  border-radius: var(--radius-xl);
  padding: var(--panel-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-panel);
}

.briefing-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.briefing-label {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  font-weight: var(--font-semibold);
}

.briefing-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.briefing-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.briefing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.meta-badge {
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
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
