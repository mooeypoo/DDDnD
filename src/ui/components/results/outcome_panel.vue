<template>
  <section class="outcome-panel" :class="`mood-${mood}`">
    <p class="outcome-label">Outcome Archetype</p>
    <h3 class="outcome-title">
      <span class="outcome-icon">{{ archetypeIcon }}</span>
      {{ title }}
    </h3>
    <p class="outcome-summary">{{ summary }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OutcomeArchetypeId } from '@/domains/simulation/rules/classify_outcome_archetype'

const props = withDefaults(
  defineProps<{
    archetype: OutcomeArchetypeId
    title: string
    summary: string
    mood?: 'calm' | 'tense' | 'victorious'
  }>(),
  {
    mood: 'calm'
  }
)

const archetypeIcon = computed(() => {
  const icons: Record<OutcomeArchetypeId, string> = {
    boundary_builder: '🏗️',
    firefighter: '🧯',
    runaway_refactorer: '♻️',
    stakeholder_whisperer: '🗣️',
    system_stabilizer: '⚖️'
  }

  return icons[props.archetype]
})
</script>

<style scoped>
.outcome-panel {
  background: var(--surface-elevated);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  box-shadow: var(--shadow-card);
}

.outcome-panel.mood-calm {
  border-color: var(--border-neutral, rgba(96, 165, 250, 0.35));
}

.outcome-panel.mood-tense {
  border-color: var(--border-warning, rgba(251, 191, 36, 0.40));
}

.outcome-panel.mood-victorious {
  border-color: var(--border-positive, rgba(52, 211, 153, 0.40));
  box-shadow: var(--shadow-card), var(--shadow-glow-positive);
}

.outcome-label {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  font-weight: var(--font-semibold);
}

.outcome-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
}

.outcome-icon {
  font-size: var(--text-2xl);
}

.outcome-summary {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
</style>
