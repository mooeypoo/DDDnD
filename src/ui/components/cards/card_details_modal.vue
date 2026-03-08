<template>
  <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ card.name }}</h2>
        <button class="close-button" @click="emit('close')" aria-label="Close modal">×</button>
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
              <span class="effect-text">
                {{ effect.delta > 0 ? '+' : '' }}{{ effect.delta }} {{ getMetricLabel(effect.score_id) }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="card.delayed_effect_refs && card.delayed_effect_refs.length > 0" class="detail-section">
          <h3 class="section-title">⚡ Delayed Effects</h3>
          <p class="section-description">
            This card triggers {{ card.delayed_effect_refs.length }} aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }} that will activate in future turns.
          </p>
        </div>

        <div v-if="card.stakeholder_changes && card.stakeholder_changes.length > 0" class="detail-section">
          <h3 class="section-title">Stakeholder Reactions</h3>
          <ul class="stakeholder-list">
            <li v-for="(change, index) in card.stakeholder_changes" :key="index" class="stakeholder-item">
              <span class="stakeholder-mood">{{ change.delta > 0 ? '😊' : '😞' }}</span>
              <span class="stakeholder-text">
                {{ formatStakeholderName(change.stakeholder_id) }}: {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-button modal-button-secondary" @click="emit('close')">
          Close
        </button>
        <button 
          class="modal-button modal-button-primary" 
          :disabled="isDisabled"
          @click="handlePlay"
        >
          Play This Card
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '@/domains/content/model/content_types';
import { getMetricPresentation } from '@/ui/composables/metric_presentation';

interface Props {
  isOpen: boolean;
  card: Card;
  isDisabled?: boolean;
  stakeholderNames?: Record<string, string>;
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

function getMetricIcon(scoreId: string): string {
  return getMetricPresentation(scoreId).icon;
}

function getMetricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label;
}

function formatStakeholderName(stakeholderId: string): string {
  if (props.stakeholderNames[stakeholderId]) {
    return props.stakeholderNames[stakeholderId];
  }
  return stakeholderId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function handlePlay(): void {
  emit('play', props.card.id);
  emit('close');
}
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
  backdrop-filter: blur(4px);
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
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
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
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-bright);
  letter-spacing: var(--tracking-tight);
}

.section-description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-style: italic;
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
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-inset);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.effect-icon {
  font-size: var(--text-xl);
  line-height: 1;
}

.effect-text {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.delayed-effect-name {
  font-weight: var(--font-semibold);
  color: var(--effect-warning);
  font-size: var(--text-sm);
}

.delayed-effect-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-left: var(--space-xs);
}

.stakeholder-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-inset);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.stakeholder-mood {
  font-size: var(--text-lg);
  line-height: 1;
}

.stakeholder-text {
  color: var(--text-primary);
  font-size: var(--text-sm);
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
</style>
