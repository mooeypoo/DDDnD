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
  background: var(--surface-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-card);
  box-shadow: var(--shadow-inset-ridge), var(--shadow-card);
  transition:
    border-color var(--transition-hover),
    box-shadow   var(--transition-hover),
    transform    var(--transition-hover);
}

.action-card:hover:not(.disabled) {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.action-card.disabled {
  opacity: 0.65;
}

.card-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-md);
}

.card-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.effect-type-icons {
  display: flex;
  gap: var(--space-xs);
}

.type-icon {
  font-size: var(--text-base);
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0 var(--space-sm);
}

.card-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  font-family: var(--font-body);
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
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  background: var(--bg-inset);
}

.effect-chip.positive {
  border-color: var(--effect-positive-border);
  background: var(--effect-positive-bg);
  color: var(--effect-positive);
}

.effect-chip.negative {
  border-color: var(--effect-negative-border);
  background: var(--effect-negative-bg);
  color: var(--effect-negative);
}

.effect-chip.more-effects {
  color: var(--text-secondary);
  border-color: var(--border-subtle);
}

.metric-icon {
  display: inline-flex;
}

.metric-maintainability  { color: var(--metric-maintainability);     }
.metric-domain-clarity   { color: var(--metric-domain-clarity);       }
.metric-delivery-confidence { color: var(--metric-delivery-confidence); }
.metric-developer-morale { color: var(--metric-developer-morale);    }
.metric-user-trust       { color: var(--metric-user-trust);           }
.metric-budget           { color: var(--metric-budget);               }
.metric-generic          { color: var(--text-secondary);              }

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
  transition: all var(--transition-hover);
  border: 1px solid var(--border-card);
}

.card-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-button-secondary {
  background: var(--bg-inset);
  color: var(--text-primary);
}

.card-button-secondary:hover:not(:disabled) {
  background: var(--bg-overlay);
  border-color: var(--border-focus);
  color: var(--text-bright);
}

.card-button-primary {
  background: var(--text-accent);
  color: var(--text-inverse);
  border-color: var(--text-accent);
  font-weight: var(--font-bold);
}

.card-button-primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

.aftershock-badge-prominent {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--effect-warning-bg);
  border: 1px solid var(--effect-warning-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  animation: pulseGlow 2.5s var(--ease-standard) infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
  }
  50% {
    box-shadow: 0 2px 20px rgba(251, 191, 36, 0.35);
  }
}

.aftershock-icon {
  font-size: var(--text-2xl);
  line-height: 1;
}

.aftershock-text {
  color: var(--effect-warning);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}
</style>
