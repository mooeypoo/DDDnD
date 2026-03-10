<template>
  <article class="action-card" :class="[`category-${categoryId}`, { disabled: isCardDisabled }]" tabindex="0">

    <!-- Category accent strip — 3 px color bar clipped by card border-radius -->
    <div class="card-accent-strip" aria-hidden="true"></div>

    <!-- Style tags -->
    <div v-if="card.style_tags?.length" class="card-tags">
      <span v-for="tag in card.style_tags" :key="tag" class="card-tag">{{ tag }}</span>
    </div>

    <header class="card-header">
      <h3 class="card-title">{{ card.name }}</h3>

      <!-- Optional artwork thumbnail — shown when illustration_url is supplied -->
      <div v-if="artwork?.illustration_url" class="card-artwork-thumb" aria-hidden="true">
        <img :src="artwork.illustration_url" :alt="artwork.alt ?? ''" />
      </div>
    </header>

    <p class="card-description">{{ summaryText }}</p>

    <!-- Primary Effects -->
    <div class="primary-effects" v-if="card.score_changes.length">
      <span
        v-for="(change, idx) in primaryEffects"
        :key="`${change.score_id}-${change.delta}`"
        class="effect-chip"
        :class="[
          change.delta > 0 ? 'positive' : 'negative',
          { 'chip-modified': showAdjusted && adjustedPrimaryEffects[idx]?.is_modified }
        ]"
      >
        <span class="metric-icon" :class="metricPresentation(change.score_id).colorClass">
          {{ metricPresentation(change.score_id).icon }}
        </span>
        {{ metricPresentation(change.score_id).label }}
        <template v-if="showAdjusted && adjustedPrimaryEffects[idx]?.is_modified">
          <span class="chip-delta">{{ adjustedPrimaryEffects[idx].adjusted_delta > 0 ? '+' : '' }}{{ adjustedPrimaryEffects[idx].adjusted_delta }}</span>
          <span class="chip-base-delta">{{ change.delta > 0 ? '+' : '' }}{{ change.delta }}</span>
        </template>
        <template v-else>
          <span class="chip-delta">{{ change.delta > 0 ? '+' : '' }}{{ change.delta }}</span>
        </template>
      </span>
      <span v-if="remainingEffects > 0" class="more-effects-wrapper">
        <button
          ref="moreChipRef"
          type="button"
          class="effect-chip more-effects"
          :aria-label="`${remainingEffects} more effect${remainingEffects > 1 ? 's' : ''} — click to inspect`"
          @click.stop="$emit('showDetails')"
          @mouseenter="openPreview"
          @mouseleave="closePreview"
          @focus="openPreview"
          @blur="closePreview"
        >
          +{{ remainingEffects }} more
        </button>
        <Teleport to="body">
          <Transition name="tooltip">
            <div
              v-if="showMorePreview"
              class="more-effects-tooltip"
              role="tooltip"
              :style="{ top: tooltipPos.top + 'px', left: tooltipPos.left + 'px' }"
              @mouseenter="showMorePreview = true"
              @mouseleave="closePreview"
            >
              <span class="tooltip-title">Hidden Effects</span>
              <ul class="tooltip-effect-list">
                <li v-for="change in hiddenEffects" :key="`hidden-${change.score_id}-${change.delta}`" class="tooltip-effect-item">
                  <span class="metric-icon" :class="metricPresentation(change.score_id).colorClass">
                    {{ metricPresentation(change.score_id).icon }}
                  </span>
                  <span class="tooltip-effect-label">{{ metricPresentation(change.score_id).label }}</span>
                  <span class="tooltip-effect-delta" :class="change.delta > 0 ? 'positive' : 'negative'">
                    {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
                  </span>
                </li>
              </ul>
            </div>
          </Transition>
        </Teleport>
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

    <div v-if="availability" class="availability-section">
      <div class="availability-badges">
        <span v-if="isOneTimeCard" class="indicator-badge indicator-availability">One-time</span>
        <span v-if="hasCooldown" class="indicator-badge indicator-availability">
          Cooldown: {{ availability.cooldown_turns }} turn{{ availability.cooldown_turns === 1 ? '' : 's' }}
        </span>
        <span
          v-if="availability.usage_limit !== null && availability.usage_limit > 1"
          class="indicator-badge indicator-availability"
        >
          Uses: {{ availability.uses_remaining ?? 0 }}/{{ availability.usage_limit }}
        </span>
      </div>
      <p v-if="availabilityStatusText" class="availability-status">{{ availabilityStatusText }}</p>
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
        :disabled="isCardDisabled"
        :title="playButtonHint"
        :aria-label="playButtonHint"
        @click="$emit('play', card.id)"
      >
        {{ primaryButtonLabel }}
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import type { ArtworkMeta } from '@/ui/types/artwork'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { resolveCategory } from '@/ui/composables/card_filter_sort'
import { getAdjustedScoreChanges, hasActiveCoupling } from '@/ui/composables/system_coupling'

const props = defineProps<{
  card: Card
  isDisabled?: boolean
  availability?: TurnBriefingActionSummary
  /** Current game scores — used to show adjusted effects under coupling rules. */
  scores?: Record<string, number>
  /** Optional artwork metadata. Renders a thumbnail in the card header when illustration_url is present. */
  artwork?: ArtworkMeta
}>()

defineEmits<{
  play: [cardId: string]
  showDetails: []
}>()

/**
 * Map card style_tags to a visual category identifier.
 * Uses the shared resolveCategory helper from card_filter_sort.
 */
const categoryId = computed(() => resolveCategory(props.card.style_tags ?? []))

const primaryEffects = computed(() => props.card.score_changes.slice(0, 3))
const hiddenEffects = computed(() => props.card.score_changes.slice(3))
const remainingEffects = computed(() => hiddenEffects.value.length)

const showMorePreview = ref(false)
const moreChipRef = ref<HTMLElement | null>(null)
const tooltipPos = ref({ top: 0, left: 0 })

function updateTooltipPosition() {
  if (!moreChipRef.value) return
  const rect = moreChipRef.value.getBoundingClientRect()
  tooltipPos.value = {
    top: rect.top,
    left: rect.left + rect.width / 2
  }
}

function openPreview() {
  updateTooltipPosition()
  showMorePreview.value = true
  // Re-position after render in case layout shifted
  nextTick(updateTooltipPosition)
}

function closePreview() {
  showMorePreview.value = false
}

const adjustedPrimaryEffects = computed(() => {
  if (!props.scores || !hasActiveCoupling(props.scores)) return []
  return getAdjustedScoreChanges(primaryEffects.value, props.scores)
})

const showAdjusted = computed(() =>
  adjustedPrimaryEffects.value.some(e => e.is_modified)
)
const hasIndicators = computed(() =>
  props.card.delayed_effect_refs.length > 0 || (props.card.stakeholder_changes?.length ?? 0) > 0
)
const availability = computed(() => props.availability)
const isOneTimeCard = computed(() => availability.value?.usage_limit === 1)
const hasCooldown = computed(() => (availability.value?.cooldown_turns ?? 0) > 0)
const isCardDisabled = computed(() => props.isDisabled || (availability.value ? !availability.value.is_playable : false))
const playButtonHint = computed(() => {
  if (props.isDisabled) {
    return 'Turn is resolving.'
  }

  if (!availability.value || availability.value.is_playable) {
    return `Play ${props.card.name}`
  }

  if (availability.value.unavailable_reason === 'usage_limit_reached') {
    return 'Unavailable: usage limit reached for this run.'
  }

  if (availability.value.unavailable_reason === 'cooldown_active') {
    const turns = availability.value.turns_until_available
    return `Unavailable: on cooldown for ${turns} more turn${turns === 1 ? '' : 's'}.`
  }

  return 'Unavailable: requirements are not currently met.'
})
const primaryButtonLabel = computed(() => {
  if (props.isDisabled) {
    return 'Resolving…'
  }

  if (!availability.value || availability.value.is_playable) {
    return 'Play'
  }

  if (availability.value.unavailable_reason === 'usage_limit_reached') {
    return 'Used Up'
  }

  if (availability.value.unavailable_reason === 'cooldown_active') {
    return 'On Cooldown'
  }

  return 'Unavailable'
})
const availabilityStatusText = computed(() => {
  if (!availability.value || availability.value.is_playable) {
    if (availability.value?.usage_limit !== null && availability.value?.usage_limit !== undefined) {
      return `Uses remaining: ${availability.value.uses_remaining ?? 0}`
    }

    return ''
  }

  if (availability.value.unavailable_reason === 'usage_limit_reached') {
    return 'Unavailable: used up for this run.'
  }

  if (availability.value.unavailable_reason === 'cooldown_active') {
    const turns = availability.value.turns_until_available
    return `Unavailable: on cooldown for ${turns} turn${turns === 1 ? '' : 's'}`
  }

  return 'Unavailable: requirements not met'
})
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
  padding-top: calc(var(--space-lg) + 3px); /* compensation for accent strip */
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-inset-ridge), var(--shadow-card);
  position: relative;
  overflow: hidden;
  transition:
    border-color var(--transition-hover),
    box-shadow   var(--transition-hover),
    transform    var(--transition-hover);
}

/* Per-category accent color via CSS custom property */
.action-card.category-refactor      { --category-accent: var(--category-refactor);      }
.action-card.category-infrastructure { --category-accent: var(--category-infrastructure); }
.action-card.category-team          { --category-accent: var(--category-team);          }
.action-card.category-process       { --category-accent: var(--category-process);       }
.action-card.category-fix           { --category-accent: var(--category-fix);           }
.action-card.category-default       { --category-accent: var(--border-subtle);          }

/* Top accent strip — clipped inside border-radius by overflow:hidden */
.card-accent-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--category-accent, var(--border-subtle));
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.action-card:hover:not(.disabled) {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-inset-ridge), var(--shadow-card-hover);
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

/* Small artwork thumbnail — shown in the card header when illustration_url is provided */
.card-artwork-thumb {
  flex-shrink: 0;
  width: 52px;
  height: 40px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--artwork-bg);
  border: 1px solid var(--artwork-border);
  position: relative;
}

.card-artwork-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.85;
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

.more-effects-wrapper {
  position: relative;
  display: inline-flex;
}

.effect-chip.more-effects {
  color: var(--text-secondary);
  border-color: var(--border-subtle);
  cursor: pointer;
  transition:
    border-color var(--transition-hover),
    background   var(--transition-hover),
    color        var(--transition-hover);
}

.effect-chip.more-effects:hover,
.effect-chip.more-effects:focus-visible {
  border-color: var(--border-focus);
  background: var(--bg-inset);
  color: var(--text-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Hidden-effects tooltip styles are in the non-scoped block below (teleported to body) */

.chip-modified {
  border-color: rgba(255, 100, 50, 0.3);
  background: rgba(255, 100, 50, 0.06);
}

.chip-base-delta {
  font-size: var(--text-2xs);
  color: var(--text-muted);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
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
  color: var(--category-accent, var(--text-muted));
  background: var(--bg-inset);
  border: 1px solid var(--category-accent, var(--border-subtle));
  border-radius: var(--radius-full);
  padding: 1px var(--space-sm);
  opacity: 0.75;
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

.indicator-availability {
  background: var(--bg-inset);
  border-color: var(--border-subtle);
  color: var(--text-secondary);
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

.availability-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.availability-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.availability-status {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
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

<!-- Non-scoped styles for the teleported tooltip (rendered at <body> level) -->
<style>
.more-effects-tooltip {
  position: fixed;
  transform: translateX(-50%) translateY(-100%) translateY(-8px);
  z-index: 9999;
  min-width: 180px;
  max-width: 260px;
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card-hover);
  pointer-events: auto;
}

.more-effects-tooltip .tooltip-title {
  display: block;
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
}

.more-effects-tooltip .tooltip-effect-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.more-effects-tooltip .tooltip-effect-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.more-effects-tooltip .tooltip-effect-label {
  flex: 1;
}

.more-effects-tooltip .tooltip-effect-delta {
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
}

.more-effects-tooltip .tooltip-effect-delta.positive {
  color: var(--effect-positive);
}

.more-effects-tooltip .tooltip-effect-delta.negative {
  color: var(--effect-negative);
}

.more-effects-tooltip .metric-icon {
  display: inline-flex;
}

/* Tooltip enter/leave transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-100%) translateY(-4px);
}

.tooltip-enter-to,
.tooltip-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(-100%) translateY(-8px);
}

/* On small screens, hide the hover tooltip — tap goes straight to inspect */
@media (hover: none) {
  .more-effects-tooltip {
    display: none;
  }
}
</style>
