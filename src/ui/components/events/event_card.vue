<template>
  <AppCard title="⚠️ System Event" :variant="severityCardVariant">
    <template #header-actions>
      <AppBadge :variant="severityBadgeVariant" :label="`${severity} severity`" size="sm" />
    </template>

    <div class="event-body">
      <!-- Artwork region: contained inside card inset (no full-bleed in this migration pass) -->
      <div v-if="illustrationUrl || $slots.artwork" class="event-artwork" aria-hidden="true">
        <img v-if="illustrationUrl" :src="illustrationUrl" alt="" />
        <slot v-else name="artwork" />
      </div>

      <h3 class="event-title">{{ title }}</h3>
      <p class="event-description">{{ description }}</p>

      <ul v-if="highlights.length" class="event-highlights">
        <li v-for="(highlight, index) in highlights" :key="index" class="highlight-item">
          {{ highlight }}
        </li>
      </ul>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/ui/components/common/AppBadge.vue'
import AppCard from '@/ui/components/cards/AppCard.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    highlights?: string[]
    /** Optional scene illustration URL. Rendered above the event title when provided. */
    illustrationUrl?: string
  }>(),
  {
    severity: 'medium',
    highlights: () => []
  }
)

const severityBadgeVariant = computed((): 'info' | 'warning' | 'alert' => {
  if (props.severity === 'low') return 'info'
  if (props.severity === 'high' || props.severity === 'critical') return 'alert'
  return 'warning'
})

const severityCardVariant = computed((): 'neutral' | 'warning' | 'danger' => {
  if (props.severity === 'low') return 'neutral'
  if (props.severity === 'high' || props.severity === 'critical') return 'danger'
  return 'warning'
})
</script>

<style scoped>
/* Flex column wrapper — replicates the gap spacing that .event-card
   previously provided as the outer shell's flex layout. */
.event-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Artwork region — contained inside card inset (no full-bleed in this migration pass).
   The inset's clip-path naturally corners the image. */
.event-artwork {
  min-height: var(--artwork-min-height-sm);
  position: relative;
  overflow: hidden;
  background: var(--artwork-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--artwork-border);
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
