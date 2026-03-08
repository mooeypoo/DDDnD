<template>
  <article class="event-card" :class="`severity-${severity}`">
    <header class="event-header">
      <p class="event-label">System Event</p>
      <span class="event-severity">{{ severityLabel }}</span>
    </header>

    <h3 class="event-title">{{ title }}</h3>
    <p class="event-description">{{ description }}</p>

    <ul v-if="highlights.length" class="event-highlights">
      <li v-for="(highlight, index) in highlights" :key="index" class="highlight-item">
        {{ highlight }}
      </li>
    </ul>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    highlights?: string[]
  }>(),
  {
    severity: 'medium',
    highlights: () => []
  }
)

const severityLabel = computed(() => {
  return props.severity.charAt(0).toUpperCase() + props.severity.slice(1)
})
</script>

<style scoped>
.event-card {
  background: linear-gradient(180deg, rgba(22, 33, 62, 0.9) 0%, rgba(26, 26, 46, 0.95) 100%);
  border: 2px solid var(--color-border-default);
  border-left-width: 6px;
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-lg);
}

.event-card.severity-low {
  border-left-color: var(--color-info);
}

.event-card.severity-medium {
  border-left-color: var(--color-warning);
}

.event-card.severity-high,
.event-card.severity-critical {
  border-left-color: var(--color-danger);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.event-label {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-semibold);
}

.event-severity {
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-overlay);
  color: var(--color-text-primary);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.event-title {
  margin: 0;
  color: var(--color-text-bright);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.event-description {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.event-highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.highlight-item {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background: var(--color-bg-overlay);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-xs) var(--space-sm);
}
</style>
