<template>
  <article class="event-card" :class="`severity-${severity}`">

    <!-- Optional artwork region: accepts future event illustrations via named slot -->
    <div v-if="$slots.artwork" class="event-artwork" aria-hidden="true">
      <slot name="artwork" />
    </div>

    <header class="event-header">
      <p class="event-label">⚠️ System Event</p>
      <span class="event-severity" :class="`severity-badge-${severity}`">{{ severityLabel }}</span>
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
  background: var(--surface-elevated);
  border: 1px solid var(--border-card);
  border-left-width: 4px;
  border-left-color: var(--border-card);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-inset-ridge), var(--shadow-card);
  overflow: hidden;
}

/* Artwork region — collapses when slot is not populated */
.event-artwork {
  width: calc(100% + var(--space-xl) * 2);
  min-height: var(--artwork-min-height-sm);
  margin: calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) 0;
  position: relative;
  overflow: hidden;
  background: var(--artwork-bg);
  border-bottom: 1px solid var(--artwork-border);
  flex-shrink: 0;
}

.event-artwork img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.event-card.severity-low {
  border-left-color: var(--effect-neutral);
}

.event-card.severity-medium {
  border-left-color: var(--effect-warning);
}

.event-card.severity-high {
  border-left-color: var(--effect-negative);
}

.event-card.severity-critical {
  border-left-color: var(--effect-negative);
  background: color-mix(in srgb, var(--surface-elevated) 92%, var(--effect-negative) 8%);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.event-label {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  font-weight: var(--font-semibold);
}

.event-severity {
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  padding: 2px var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.severity-badge-low {
  background: var(--effect-neutral-bg);
  border-color: var(--effect-neutral-border);
  color: var(--effect-neutral);
}

.severity-badge-medium {
  background: var(--effect-warning-bg);
  border-color: var(--effect-warning-border);
  color: var(--effect-warning);
}

.severity-badge-high {
  background: var(--effect-negative-bg);
  border-color: var(--effect-negative-border);
  color: var(--effect-negative);
}

.severity-badge-critical {
  background: var(--effect-negative);
  border-color: var(--effect-negative);
  color: #fff;
}

.event-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.event-description {
  margin: 0;
  color: var(--text-primary);
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
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-inset);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-xs) var(--space-sm);
}
</style>
