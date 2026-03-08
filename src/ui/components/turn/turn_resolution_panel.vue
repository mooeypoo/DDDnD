<template>
  <div class="turn-resolution-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="turn-badge">Turn {{ turnResolution.turn_number }}</span>
        Resolution
      </h3>
    </div>
    
    <!-- Architectural Aftershocks -->
    <div v-if="turnResolution.resolved_aftershocks.length > 0" class="resolution-section">
      <h4 class="section-title">
        <span class="section-icon">⚡</span>
        Architectural Aftershocks
      </h4>
      <div class="aftershocks-list">
        <div 
          v-for="aftershock in turnResolution.resolved_aftershocks" 
          :key="aftershock.effect_instance_id"
          class="event-card aftershock-card"
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
      <h4 class="section-title">
        <span class="section-icon">🎯</span>
        Your Action
      </h4>
      <div class="event-card primary-card">
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
      <h4 class="section-title">
        <span class="section-icon">📢</span>
        System Event
      </h4>
      <div class="event-card event-card">
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
      <h4 class="section-title">
        <span class="section-icon">👥</span>
        Stakeholder Reactions
      </h4>
      <div class="stakeholder-reactions">
        <div 
          v-for="(reaction, idx) in turnResolution.stakeholder_resolution.reactions" 
          :key="idx"
          class="reaction-item"
        >
          <div class="reaction-header">
            <div class="reaction-stakeholder">{{ formatStakeholderName(reaction.stakeholder_id) }}</div>
          </div>
          <p class="reaction-text">{{ reaction.presentation.summary }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TurnResolutionContext } from '@/domains/simulation/model'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'

const props = defineProps<{
  turnResolution: TurnResolutionContext
  stakeholderNames?: Record<string, string>
}>()

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, props.stakeholderNames)
}
</script>

<style scoped>
.turn-resolution-panel {
  background: var(--panel-bg);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--panel-padding);
  margin: var(--space-xl) 0;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  border-bottom: 2px solid var(--color-border-default);
  padding-bottom: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.panel-title {
  color: var(--color-text-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
  margin: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.turn-badge {
  background: var(--color-primary);
  color: white;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
}

.resolution-section {
  margin: var(--space-xl) 0;
}

.resolution-section:first-of-type {
  margin-top: 0;
}

.section-title {
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-md) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  font-size: var(--text-xl);
}

.event-card {
  background: var(--color-bg-overlay);
  border-left: 4px solid var(--color-border-default);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
  transition: all var(--transition-base);
}

.event-card:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateX(4px);
}

.primary-card {
  border-left-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.15) 0%, var(--color-bg-overlay) 100%);
}

.aftershock-card {
  border-left-color: var(--color-warning);
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.1) 0%, var(--color-bg-overlay) 100%);
}

.event-title {
  color: var(--color-text-primary);
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  margin-bottom: var(--space-sm);
}

.event-summary {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-sm);
}

.changes-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.change-badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border: 1px solid transparent;
}

.change-badge.positive {
  background: rgba(46, 204, 113, 0.2);
  color: var(--color-success);
  border-color: var(--color-success);
}

.change-badge.negative {
  background: rgba(233, 69, 96, 0.2);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.aftershocks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.stakeholder-reactions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.reaction-item {
  background: var(--color-bg-overlay);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-default);
  transition: all var(--transition-base);
}

.reaction-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: var(--color-border-focus);
}

.reaction-header {
  margin-bottom: var(--space-sm);
}

.reaction-stakeholder {
  color: var(--color-primary);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}

.reaction-text {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .turn-resolution-panel {
    padding: var(--space-lg);
  }
  
  .panel-title {
    font-size: var(--text-xl);
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .event-card {
    padding: var(--space-md);
  }
}
</style>
