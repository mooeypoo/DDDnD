<template>
  <section class="turn-briefing-panel">
    <header class="briefing-header">
      <div class="briefing-meta-row">
        <span class="briefing-label">📜 Situation Briefing</span>
        <span v-if="currentTurn && totalTurns" class="turn-counter">
          Turn {{ currentTurn }} / {{ totalTurns }}
        </span>
      </div>
      <h2 class="briefing-title">{{ eventTitle }}</h2>
    </header>

    <p class="briefing-description">{{ narrativeDescription }}</p>

    <div class="briefing-status">
      <span class="status-badge actions-badge">
        <span class="badge-icon">⚔️</span>
        {{ availableActions }} action{{ availableActions === 1 ? '' : 's' }} available
      </span>
      <span class="status-badge" :class="pendingAftershocks ? 'aftershocks-badge' : 'quiet-badge'">
        <span class="badge-icon">⚡</span>
        {{ pendingAftershocks || 'No' }} aftershock{{ pendingAftershocks === 1 ? '' : 's' }} pending
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    eventTitle: string
    narrativeDescription: string
    availableActions: number
    pendingAftershocks: number
    currentTurn?: number
    totalTurns?: number
  }>(),
  {}
)
</script>

<style scoped>
.turn-briefing-panel {
  background: var(--surface-elevated);
  border: 1px solid var(--border-panel);
  border-left: 3px solid var(--text-accent);
  border-radius: var(--radius-xl);
  padding: var(--panel-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  box-shadow: var(--shadow-panel);
  position: relative;
}

.briefing-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.briefing-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.briefing-label {
  margin: 0;
  color: var(--text-accent);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  font-weight: var(--font-semibold);
}

.turn-counter {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
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
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  font-style: italic;
  border-left: 2px solid var(--border-subtle);
  padding-left: var(--space-md);
}

.briefing-status {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border: 1px solid var(--border-subtle);
  background: var(--bg-inset);
  color: var(--text-secondary);
}

.actions-badge {
  border-color: var(--border-accent);
  color: var(--text-accent);
  background: rgba(169, 137, 250, 0.08);
}

.aftershocks-badge {
  border-color: var(--effect-warning-border);
  color: var(--effect-warning);
  background: var(--effect-warning-bg);
}

.quiet-badge {
  color: var(--text-muted);
}

.badge-icon {
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .turn-briefing-panel {
    padding: var(--space-lg);
  }
}
</style>
