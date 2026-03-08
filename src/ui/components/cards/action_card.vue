<template>
  <button
    class="action-card"
    :class="{ selected: isSelected, disabled: isDisabled }"
    :disabled="isDisabled"
    @click="$emit('select')"
  >
    <!-- Future: Card art slot -->
    <div class="card-art-slot">
      <div class="card-type-badge">Action</div>
    </div>
    
    <div class="card-content">
      <div class="card-header">
        <h3 class="card-title">{{ card.name }}</h3>
      </div>
      
      <div class="card-body">
        <p class="card-description">{{ card.description }}</p>
        
        <p v-if="card.flavor_text" class="card-flavor">
          <span class="flavor-quote">"</span>{{ card.flavor_text }}<span class="flavor-quote">"</span>
        </p>
        
        <div v-if="card.score_changes.length > 0" class="card-effects">
          <div class="effects-label">Immediate Effects</div>
          <div class="effects-list">
            <span 
              v-for="(change, idx) in card.score_changes" 
              :key="idx"
              class="effect-badge"
              :class="change.delta > 0 ? 'positive' : 'negative'"
            >
              {{ formatScoreName(change.score_id) }} {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
            </span>
          </div>
        </div>
        
        <div v-if="card.delayed_effect_refs.length > 0" class="card-aftershocks">
          <div class="aftershock-badge">
            <span class="aftershock-icon">⚡</span>
            <span class="aftershock-count">{{ card.delayed_effect_refs.length }}</span>
            <span class="aftershock-label">Aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isSelected" class="selected-overlay">
      <span class="selected-indicator">✓ Selected</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Card } from '@/domains/content/model'

defineProps<{
  card: Card
  isSelected?: boolean
  isDisabled?: boolean
}>()

defineEmits<{
  select: []
}>()

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.action-card {
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-slow);
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
}

.action-card:hover:not(:disabled) {
  border-color: var(--card-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.action-card.selected {
  border-color: var(--color-primary);
  background: var(--color-danger-bg);
  box-shadow: 0 6px 24px var(--color-primary-glow);
  transform: translateY(-4px);
}

.action-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-card:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Card Art Slot */
.card-art-slot {
  height: 100px;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: var(--space-md);
  position: relative;
  overflow: hidden;
}

.card-art-slot::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.2) 100%);
}

.card-type-badge {
  background: rgba(0, 0, 0, 0.4);
  color: var(--color-text-bright);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(4px);
}

/* Card Content */
.card-content {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  flex: 1;
}

.card-header {
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border-default);
}

.card-title {
  color: var(--color-primary);
  font-size: var(--text-lg);
  margin: 0;
  font-weight: var(--font-bold);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  flex: 1;
}

.card-description {
  color: var(--color-text-primary);
  line-height: var(--leading-relaxed);
  margin: 0;
  font-size: var(--text-sm);
}

.card-flavor {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: var(--text-xs);
  margin: 0;
  line-height: var(--leading-snug);
  padding: var(--space-md);
  background: var(--color-bg-overlay);
  border-radius: var(--radius-md);
  border-left: 2px solid var(--color-border-default);
}

.flavor-quote {
  color: var(--color-primary);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
}

.card-effects {
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-default);
}

.effects-label {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
  font-weight: var(--font-semibold);
}

.effects-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.effect-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border: 1px solid;
}

.effect-badge.positive {
  background: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success);
}

.effect-badge.negative {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.card-aftershocks {
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-default);
}

.aftershock-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--color-warning-bg);
  color: var(--color-warning);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border: 1px solid var(--color-warning);
}

.aftershock-icon {
  font-size: var(--text-base);
}

.aftershock-count {
  font-size: var(--text-base);
}

.aftershock-label {
  font-weight: var(--font-semibold);
}

/* Selected Overlay */
.selected-overlay {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-primary);
  color: var(--color-text-bright);
  padding: var(--space-sm) var(--space-lg);
  border-bottom-left-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.selected-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* Responsive */
@media (max-width: 768px) {
  .card-content {
    padding: var(--space-lg);
  }
  
  .card-art-slot {
    height: 80px;
  }
}
</style>
