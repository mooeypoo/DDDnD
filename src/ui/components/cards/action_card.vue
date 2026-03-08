<template>
  <article class="action-card" :class="{ disabled: isDisabled }">
    <header class="card-header">
      <h3 class="card-title">{{ card.name }}</h3>
    </header>

    <p class="card-description">{{ summaryText }}</p>

    <!-- Delayed Effects Badge (Prominent) -->
    <div v-if="card.delayed_effect_refs.length" class="aftershock-badge-prominent">
      <span class="aftershock-icon">⚡</span>
      <span class="aftershock-text">
        {{ card.delayed_effect_refs.length }} Aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Primary Effects -->
    <div class="primary-effects" v-if="card.score_changes.length">
      <span
        v-for="change in primaryEffects"
        :key="`${change.score_id}-${change.delta}`"
        class="effect-chip"
        :class="change.delta > 0 ? 'positive' : 'negative'"
      >
        <span class="metric-icon" :class="metricPresentation(change.score_id).colorClass">
          {{ metricPresentation(change.score_id).icon }}
        </span>
        {{ metricPresentation(change.score_id).label }} {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
      </span>
      <span v-if="remainingEffects > 0" class="effect-chip more-effects">
        +{{ remainingEffects }} more
      </span>
    </div>

    <footer class="card-controls">
      <button class="card-button card-button-secondary" type="button" :disabled="isDisabled" @click="$emit('showDetails')">
        View Details
      </button>
      <button class="card-button card-button-primary" type="button" :disabled="isDisabled" @click="$emit('play', card.id)">
        {{ isDisabled ? 'Resolving...' : 'Play This Card' }}
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/domains/content/model'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'

const props = defineProps<{
  card: Card
  isDisabled?: boolean
}>()

defineEmits<{
  play: [cardId: string]
  showDetails: []
}>()

const primaryEffects = computed(() => props.card.score_changes.slice(0, 3))
const remainingEffects = computed(() => Math.max(props.card.score_changes.length - primaryEffects.value.length, 0))
const summaryText = computed(() => {
  const compact = props.card.flavor_text?.trim() || props.card.description
  if (compact.length <= 120) {
    return compact
  }

  return `${compact.slice(0, 117).trimEnd()}...`
})

function metricPresentation(scoreId: string) {
  return getMetricPresentation(scoreId)
}
</script>

<style scoped>
.action-card {
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition: all var(--transition-base);
}

.action-card:hover:not(.disabled) {
  border-color: var(--card-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.action-card.disabled {
  opacity: 0.7;
}

.card-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-md);
}

.card-title {
  margin: 0;
  color: var(--color-text-bright);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

.effect-type-icons {
  display: flex;
  gap: var(--space-xs);
}

.type-icon {
  font-size: var(--text-base);
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-sm);
}

.card-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.primary-effects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.effect-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-default);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  background: var(--color-bg-overlay);
}

.effect-chip.positive {
  border-color: var(--color-success);
}

.effect-chip.negative {
  border-color: var(--color-danger);
}

.effect-chip.more-effects {
  color: var(--color-text-secondary);
}

.metric-icon {
  display: inline-flex;
}

.metric-maintainability,
.metric-domain-clarity {
  color: var(--color-success);
}

.metric-delivery-confidence {
  color: var(--color-info);
}

.metric-developer-morale {
  color: var(--color-warning);
}

.metric-user-trust {
  color: var(--color-primary);
}

.metric-budget,
.metric-generic {
  color: var(--color-text-secondary);
}

.card-controls {
  display: flex;
  gap: var(--space-sm);
  margin-top: auto;
}

.card-button {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid var(--color-border-default);
}

.card-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-button-secondary {
  background: var(--color-bg-overlay);
  color: var(--color-text-primary);
}

.card-button-secondary:hover:not(:disabled) {
  background: var(--color-bg-surface);
  border-color: var(--color-border-focus);
}

.card-button-primary {
  background: var(--color-primary);
  color: var(--color-text-bright);
  border-color: var(--color-primary);
}

.card-button-primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.aftershock-badge-prominent {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: linear-gradient(135deg, var(--color-warning-bg) 0%, rgba(243, 156, 18, 0.1) 100%);
  border: 2px solid var(--color-warning);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(243, 156, 18, 0.2);
  }
  50% {
    box-shadow: 0 2px 16px rgba(243, 156, 18, 0.4);
  }
}

.aftershock-icon {
  font-size: var(--text-2xl);
  line-height: 1;
}

.aftershock-text {
  color: var(--color-warning);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}
</style>
