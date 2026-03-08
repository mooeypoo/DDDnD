<template>
  <div class="turn-resolution-panel">
    <h3 class="panel-title">Turn {{ turnResolution.turn_number }} Results</h3>
    
    <!-- Architectural Aftershocks -->
    <div v-if="turnResolution.resolved_aftershocks.length > 0" class="resolution-section">
      <h4 class="section-title">⚡ Architectural Aftershocks</h4>
      <div class="aftershocks-list">
        <div 
          v-for="aftershock in turnResolution.resolved_aftershocks" 
          :key="aftershock.effect_instance_id"
          class="event-card"
        >
          <div class="event-title">{{ aftershock.presentation.title }}</div>
          <p class="event-summary">{{ aftershock.presentation.summary }}</p>
          <div v-if="aftershock.score_changes.length > 0" class="changes-list">
            <span 
              v-for="(change, idx) in aftershock.score_changes" 
              :key="idx"
              class="change-badge"
              :class="change.delta > 0 ? 'positive' : 'negative'"
            >
              {{ formatScoreName(change.score_id) }} {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Player Action -->
    <div class="resolution-section">
      <h4 class="section-title">🎯 Your Action</h4>
      <div class="event-card primary">
        <div class="event-title">{{ turnResolution.action_resolution.presentation.title }}</div>
        <p class="event-summary">{{ turnResolution.action_resolution.presentation.summary }}</p>
        <div v-if="turnResolution.action_resolution.score_changes.length > 0" class="changes-list">
          <span 
            v-for="(change, idx) in turnResolution.action_resolution.score_changes" 
            :key="idx"
            class="change-badge"
            :class="change.delta > 0 ? 'positive' : 'negative'"
          >
            {{ formatScoreName(change.score_id) }} {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- System Event -->
    <div v-if="turnResolution.event_resolution" class="resolution-section">
      <h4 class="section-title">📢 System Event</h4>
      <div class="event-card warning">
        <div class="event-title">{{ turnResolution.event_resolution.presentation.title }}</div>
        <p class="event-summary">{{ turnResolution.event_resolution.presentation.summary }}</p>
        <div v-if="turnResolution.event_resolution.score_changes.length > 0" class="changes-list">
          <span 
            v-for="(change, idx) in turnResolution.event_resolution.score_changes" 
            :key="idx"
            class="change-badge"
            :class="change.delta > 0 ? 'positive' : 'negative'"
          >
            {{ formatScoreName(change.score_id) }} {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Stakeholder Reactions -->
    <div v-if="turnResolution.stakeholder_resolution.reactions.length > 0" class="resolution-section">
      <h4 class="section-title">👥 Stakeholder Reactions</h4>
      <div class="stakeholder-reactions">
        <div 
          v-for="(reaction, idx) in turnResolution.stakeholder_resolution.reactions" 
          :key="idx"
          class="reaction-item"
        >
          <div class="reaction-stakeholder">{{ formatStakeholderName(reaction.stakeholder_id) }}</div>
          <p class="reaction-text">{{ reaction.presentation.summary }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TurnResolutionContext } from '@/domains/simulation/model'

defineProps<{
  turnResolution: TurnResolutionContext
}>()

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatStakeholderName(stakeholderId: string): string {
  return stakeholderId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.turn-resolution-panel {
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.panel-title {
  color: #e94560;
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.resolution-section {
  margin: 1.5rem 0;
}

.resolution-section:first-of-type {
  margin-top: 0;
}

.section-title {
  color: #e0e0e0;
  font-size: 1.125rem;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.event-card {
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid rgba(139, 146, 168, 0.5);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.event-card.primary {
  border-left-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.event-card.warning {
  border-left-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
}

.event-title {
  color: #e0e0e0;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.event-summary {
  color: #c0c0c0;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.changes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.change-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.change-badge.positive {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.change-badge.negative {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

.aftershocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stakeholder-reactions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reaction-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.875rem;
  border-radius: 6px;
}

.reaction-stakeholder {
  color: #e94560;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.375rem;
}

.reaction-text {
  color: #c0c0c0;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .turn-resolution-panel {
    padding: 1rem;
  }
  
  .panel-title {
    font-size: 1.25rem;
  }
}
</style>
