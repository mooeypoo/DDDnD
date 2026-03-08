<template>
  <button
    class="action-card"
    :class="{ selected: isSelected, disabled: isDisabled }"
    :disabled="isDisabled"
    @click="$emit('select')"
  >
    <div class="card-header">
      <h3 class="card-title">{{ card.name }}</h3>
    </div>
    
    <div class="card-body">
      <p class="card-description">{{ card.description }}</p>
      
      <p v-if="card.flavor_text" class="card-flavor">
        {{ card.flavor_text }}
      </p>
      
      <div v-if="card.score_changes.length > 0" class="card-effects">
        <div class="effect-label">Immediate Effects:</div>
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
        <div class="aftershock-indicator">
          ⚡ {{ card.delayed_effect_refs.length }} Architectural Aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}
        </div>
      </div>
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
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(139, 146, 168, 0.3);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-card:hover:not(:disabled) {
  border-color: rgba(233, 69, 96, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.2);
}

.action-card.selected {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.15);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.3);
}

.action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-header {
  border-bottom: 1px solid rgba(139, 146, 168, 0.2);
  padding-bottom: 0.75rem;
}

.card-title {
  color: #e94560;
  font-size: 1.125rem;
  margin: 0;
  font-weight: 700;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-description {
  color: #e0e0e0;
  line-height: 1.5;
  margin: 0;
  font-size: 0.95rem;
}

.card-flavor {
  color: #8b92a8;
  font-style: italic;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.card-effects,
.card-aftershocks {
  padding-top: 0.5rem;
  border-top: 1px solid rgba(139, 146, 168, 0.2);
}

.effect-label {
  color: #8b92a8;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.effects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.effect-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.effect-badge.positive {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.effect-badge.negative {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

.aftershock-indicator {
  color: #f39c12;
  font-size: 0.875rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .action-card {
    padding: 1rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
}
</style>
