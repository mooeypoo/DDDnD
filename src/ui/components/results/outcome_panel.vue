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
  background: var(--card-bg);
  border: 2px solid var(--color-border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  box-shadow: var(--shadow-md);
}

.outcome-panel.mood-calm {
  border-color: var(--color-info);
}

.outcome-panel.mood-tense {
  border-color: var(--color-warning);
}

.outcome-panel.mood-victorious {
  border-color: var(--color-success);
}

.outcome-label {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-semibold);
}

.outcome-title {
  margin: 0;
  color: var(--color-text-bright);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xl);
}

.outcome-icon {
  font-size: var(--text-2xl);
}

.outcome-summary {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
</style>
