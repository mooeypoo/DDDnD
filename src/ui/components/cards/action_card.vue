<template>
  <article class="action-card" :class="{ disabled: isDisabled }" tabindex="0">

    <!-- Style tags -->
    <div v-if="card.style_tags?.length" class="card-tags">
      <span v-for="tag in card.style_tags" :key="tag" class="card-tag">{{ tag }}</span>
    </div>

    <header class="card-header">
      <h3 class="card-title">{{ card.name }}</h3>
    </header>

    <p class="card-description">{{ summaryText }}</p>

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
        {{ metricPresentation(change.score_id).label }}
        <span class="chip-delta">{{ change.delta > 0 ? '+' : '' }}{{ change.delta }}</span>
      </span>
      <span v-if="remainingEffects > 0" class="effect-chip more-effects">
        +{{ remainingEffects }} more
      </span>
    </div>

    <!-- Compact indicators: aftershocks · stakeholders -->
    <div class="card-indicators" v-if="hasIndicators">
      <span v-if="card.delayed_effect_refs.length" class="indicator-badge indicator-aftershock">
        <span class="indicator-icon">⚡</span>
        {{ card.delayed_effect_refs.length }} Aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}
      </span>
      <span v-if="card.stakeholder_changes?.length" class="indicator-badge indicator-stakeholders">
        <span class="indicator-icon">👥</span>
        {{ card.stakeholder_changes.length }} Stakeholder{{ card.stakeholder_changes.length > 1 ? 's' : '' }}
      </span>
    </div>

    <footer class="card-controls">
      <button
        class="card-button card-button-inspect"
        type="button"
        :disabled="isDisabled"
        @click="$emit('showDetails')"
        aria-label="Inspect card details"
      >
        Inspect
      </button>
      <button
        class="card-button card-button-primary"
        type="button"
        :disabled="isDisabled"
        @click="$emit('play', card.id)"
      >
        {{ isDisabled ? 'Resolving…' : 'Play' }}
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
const hasIndicators = computed(() =>
  props.card.delayed_effect_refs.length > 0 || (props.card.stakeholder_changes?.length ?? 0) > 0
)
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
  font-weight: var(--font-medium);
  color: var(--text-primary);
  background: var(--bg-inset);
}

.chip-delta {
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
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

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.card-tag {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 1px var(--space-sm);
}

.card-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.indicator-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid transparent;
}

.indicator-aftershock {
  background: var(--effect-warning-bg);
  border-color: var(--effect-warning-border);
  color: var(--effect-warning);
}

.indicator-stakeholders {
  background: var(--effect-neutral-bg);
  border-color: var(--effect-neutral-border);
  color: var(--effect-neutral);
}

.indicator-icon {
  font-size: var(--text-base);
  line-height: 1;
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
  transition: all var(--transition-hover);
  border: 1px solid var(--border-card);
}

.card-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-button-inspect {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-subtle);
  flex: 0 0 auto;
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}

.card-button-inspect:hover:not(:disabled) {
  background: var(--bg-inset);
  border-color: var(--border-card);
  color: var(--text-primary);
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

.action-card:focus-visible {
  outline: none;
  box-shadow: var(--shadow-card-hover), var(--focus-ring);
}
</style>
