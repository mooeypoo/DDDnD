<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
      <div class="modal-content" @click.stop role="dialog" aria-modal="true" :aria-labelledby="'modal-title-' + card.id">
        <div class="modal-header">
          <div class="modal-header-copy">
            <p class="modal-eyebrow">Architecture Card</p>
            <h2 class="modal-title" :id="'modal-title-' + card.id">{{ card.name }}</h2>
          </div>
          <button class="close-button" @click="emit('close')" aria-label="Close modal">×</button>
        </div>

        <!-- Artwork frame — renders illustration when artwork prop is supplied; stable when absent -->
        <div class="modal-artwork-frame" aria-hidden="true">
          <img
            v-if="artwork?.illustration_url"
            :src="artwork.illustration_url"
            :alt="artwork.alt ?? ''"
          />
        </div>

        <div class="modal-body">
          <p class="card-description">{{ card.description }}</p>

          <div v-if="card.score_changes.length > 0" class="detail-section">
            <h3 class="section-title">Immediate Effects</h3>
            <ul class="effect-list">
              <li v-for="(effect, index) in card.score_changes" :key="index" class="effect-item">
                <span class="effect-icon" :class="`metric-${effect.score_id.replace(/_/g, '-')}`">
                  {{ getMetricIcon(effect.score_id) }}
                </span>
                <span class="effect-label">{{ getMetricLabel(effect.score_id) }}</span>
                <span class="delta-value" :class="effect.delta > 0 ? 'positive' : 'negative'">
                  {{ effect.delta > 0 ? '+' : '' }}{{ effect.delta }}
                </span>
              </li>
            </ul>
          </div>

          <!-- Adjusted effects under system coupling -->
          <div v-if="hasAnyModifiedEffect" class="detail-section coupling-adjusted-section">
            <h3 class="section-title"><span class="section-icon">⚠️</span> Adjusted Effects</h3>
            <p class="coupling-note">System coupling is reducing some gains.</p>
            <ul class="effect-list">
              <li
                v-for="(adj, index) in adjustedEffects"
                :key="'adj-' + index"
                class="effect-item"
                :class="{ 'effect-modified': adj.is_modified }"
              >
                <span class="effect-icon" :class="`metric-${adj.score_id.replace(/_/g, '-')}`">
                  {{ getMetricIcon(adj.score_id) }}
                </span>
                <span class="effect-label">{{ getMetricLabel(adj.score_id) }}</span>
                <span class="delta-value" :class="adj.adjusted_delta > 0 ? 'positive' : 'negative'">
                  {{ adj.adjusted_delta > 0 ? '+' : '' }}{{ adj.adjusted_delta }}
                </span>
                <span v-if="adj.is_modified" class="modifier-badge">
                  was {{ adj.base_delta > 0 ? '+' : '' }}{{ adj.base_delta }}
                </span>
              </li>
            </ul>
            <p class="coupling-reason">{{ couplingReasonText }}</p>
          </div>

          <div v-if="card.delayed_effect_refs && card.delayed_effect_refs.length > 0" class="detail-section">
            <h3 class="section-title"><span class="section-icon">⚡</span> Architectural Aftershocks</h3>
            <div class="aftershock-notice">
              <p class="aftershock-text">
                This card triggers
                <strong>{{ card.delayed_effect_refs.length }} aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}</strong>
                that will activate in future turns.
              </p>
            </div>
          </div>

          <div v-if="card.stakeholder_changes && card.stakeholder_changes.length > 0" class="detail-section">
            <h3 class="section-title">Stakeholder Reactions</h3>
            <ul class="stakeholder-list">
              <li v-for="(change, index) in card.stakeholder_changes" :key="index" class="stakeholder-item">
                <span class="stakeholder-name">{{ formatStakeholderName(change.stakeholder_id) }}</span>
                <span class="delta-value" :class="change.delta > 0 ? 'positive' : 'negative'">
                  {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
                </span>
              </li>
            </ul>
          </div>

          <div v-if="availabilityDetails.length > 0 || availabilityStatusText" class="detail-section">
            <h3 class="section-title">Availability</h3>
            <ul v-if="availabilityDetails.length > 0" class="availability-list">
              <li v-for="detail in availabilityDetails" :key="detail" class="availability-item">{{ detail }}</li>
            </ul>
            <p v-if="availabilityStatusText" class="availability-status-text">{{ availabilityStatusText }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-button modal-button-secondary" @click="emit('close')">
            Close
          </button>
          <button
            class="modal-button modal-button-primary"
            :disabled="isPlayDisabled"
            @click="handlePlay"
          >
            {{ primaryButtonText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/domains/content/model/content_types';
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import { getMetricPresentation } from '@/ui/composables/metric_presentation';
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation';
import { getAdjustedScoreChanges, getCollapseWarnings } from '@/ui/composables/system_coupling'
import type { ArtworkMeta } from '@/ui/types/artwork'

interface Props {
  isOpen: boolean;
  card: Card;
  isDisabled?: boolean;
  availability?: TurnBriefingActionSummary;
  stakeholderNames?: Record<string, string>;
  /** Current game scores — used to compute adjusted card effects under coupling rules. */
  scores?: Record<string, number>;
  /** Optional artwork for the modal illustration frame. Renders an image when illustration_url is present. */
  artwork?: ArtworkMeta
}

interface Emits {
  (e: 'close'): void;
  (e: 'play', cardId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false,
  stakeholderNames: () => ({}),
});

const emit = defineEmits<Emits>();

const isPlayDisabled = computed(() => props.isDisabled || (props.availability ? !props.availability.is_playable : false))
const primaryButtonText = computed(() => {
  if (props.isDisabled) {
    return 'Resolving…'
  }

  if (!props.availability || props.availability.is_playable) {
    return 'Play This Card'
  }

  if (props.availability.unavailable_reason === 'usage_limit_reached') {
    return 'Used Up'
  }

  if (props.availability.unavailable_reason === 'cooldown_active') {
    return 'On Cooldown'
  }

  return 'Unavailable'
})

const availabilityDetails = computed(() => {
  const details: string[] = []

  if (props.card.usage_limit === 1) {
    details.push('One-time intervention (usable once per run).')
  } else if (props.card.usage_limit !== undefined && props.card.usage_limit !== null) {
    details.push(`Usage limit: ${props.card.usage_limit}.`)
  }

  if ((props.card.cooldown_turns ?? 0) > 0) {
    const turns = props.card.cooldown_turns ?? 0
    details.push(`Cooldown: ${turns} turn${turns === 1 ? '' : 's'} after each use.`)
  }

  if (props.availability?.usage_limit !== null && props.availability?.usage_limit !== undefined) {
    details.push(
      `Uses remaining: ${props.availability.uses_remaining ?? 0}/${props.availability.usage_limit}.`
    )
  }

  return details
})

const availabilityStatusText = computed(() => {
  if (!props.availability || props.availability.is_playable) {
    return ''
  }

  if (props.availability.unavailable_reason === 'usage_limit_reached') {
    return 'Unavailable: this card has already been fully used this run.'
  }

  if (props.availability.unavailable_reason === 'cooldown_active') {
    const turns = props.availability.turns_until_available
    return `Unavailable: on cooldown for ${turns} more turn${turns === 1 ? '' : 's'}.`
  }

  return 'Unavailable: requirements are not currently met.'
})

function getMetricIcon(scoreId: string): string {
  return getMetricPresentation(scoreId).icon;
}

function getMetricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label;
}

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, props.stakeholderNames);
}

function handlePlay(): void {
  emit('play', props.card.id);
  emit('close');
}

// -- Coupling adjustment display --

const adjustedEffects = computed(() => {
  if (!props.scores) return []
  return getAdjustedScoreChanges(props.card.score_changes, props.scores)
})

const hasAnyModifiedEffect = computed(() =>
  adjustedEffects.value.some(e => e.is_modified)
)

const activeWarnings = computed(() => {
  if (!props.scores) return []
  return getCollapseWarnings(props.scores)
})

const couplingReasonText = computed(() =>
  activeWarnings.value.map(w => w.description).join(' ')
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-md);
  backdrop-filter: blur(6px);
}

/* Modal entry/exit transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-modal);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-content {
  transition: transform var(--transition-modal), opacity var(--transition-modal);
}
.modal-enter-from .modal-content {
  transform: scale(0.96) translateY(12px);
  opacity: 0;
}
.modal-leave-active .modal-content {
  transition: transform var(--transition-modal), opacity var(--transition-modal);
}
.modal-leave-to .modal-content {
  transform: scale(0.96) translateY(12px);
  opacity: 0;
}

.modal-content {
  background: var(--surface-modal);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-accent);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

/* Artwork frame — ambient gradient region between header and body.
 * Receives future AI-generated card illustrations.
 * Layout is stable when empty: no placeholder text, fixed height. */
.modal-artwork-frame {
  width: 100%;
  min-height: var(--artwork-min-height-sm);
  background:
    linear-gradient(180deg,
      rgba(169, 137, 250, 0.07) 0%,
      rgba(169, 137, 250, 0.02) 60%,
      transparent 100%),
    var(--bg-overlay);
  border-bottom: 1px solid var(--artwork-border);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.modal-artwork-frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.modal-header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.modal-eyebrow {
  margin: 0;
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--text-accent);
}

.modal-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-bright);
  letter-spacing: var(--tracking-tight);
}

.close-button {
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-3xl);
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.close-button:hover {
  background: var(--bg-overlay);
  border-color: var(--border-focus);
  color: var(--text-bright);
}

.modal-body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.card-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.section-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.section-icon {
  font-size: var(--text-base);
}

.effect-list,
.stakeholder-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.effect-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-inset);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.effect-icon {
  font-size: var(--text-lg);
  line-height: 1;
  flex-shrink: 0;
}

.effect-label {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.delta-value {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.delta-value.positive {
  color: var(--effect-positive);
}

.delta-value.negative {
  color: var(--effect-negative);
}

.aftershock-notice {
  padding: var(--space-sm) var(--space-md);
  background: var(--effect-warning-bg);
  border: 1px solid var(--effect-warning-border);
  border-radius: var(--radius-md);
}

.aftershock-text {
  margin: 0;
  color: var(--effect-warning);
  font-size: var(--text-sm);
}

.aftershock-text strong {
  font-weight: var(--font-bold);
}

.stakeholder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-inset);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.stakeholder-name {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.availability-list {
  margin: 0;
  padding-left: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.availability-item {
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.availability-status-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border-subtle);
}

.modal-button {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-hover);
  border: 1px solid var(--border-card);
}

.modal-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-button-secondary {
  background: var(--bg-inset);
  color: var(--text-primary);
}

.modal-button-secondary:hover:not(:disabled) {
  background: var(--bg-overlay);
  border-color: var(--border-focus);
  color: var(--text-bright);
}

.modal-button-primary {
  background: var(--text-accent);
  color: var(--text-inverse);
  border-color: var(--text-accent);
  font-weight: var(--font-bold);
}

.modal-button-primary:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

/* Metric color classes */
.metric-domain-clarity      { color: var(--metric-domain-clarity);      }
.metric-maintainability     { color: var(--metric-maintainability);     }
.metric-delivery-confidence { color: var(--metric-delivery-confidence); }
.metric-developer-morale    { color: var(--metric-developer-morale);    }
.metric-user-trust          { color: var(--metric-user-trust);          }
.metric-budget              { color: var(--metric-budget);              }
.metric-generic             { color: var(--text-secondary);             }

/* -- System coupling adjusted effects -- */

.coupling-adjusted-section {
  border: 1px solid rgba(255, 100, 50, 0.25);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  background: rgba(255, 100, 50, 0.04);
}

.coupling-note {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--score-critical);
  font-weight: var(--font-semibold);
}

.effect-modified {
  border-color: rgba(255, 100, 50, 0.3);
  background: rgba(255, 100, 50, 0.06);
}

.modifier-badge {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.coupling-reason {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.4;
}
</style>
