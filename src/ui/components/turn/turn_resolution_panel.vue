<template>
  <AppFrame :title="`Turn ${turnResolution.turn_number} Resolution`" class="turn-resolution-panel">
    <template #icon><IconSwords :size="14" /></template>
    
    <!-- Architectural Aftershocks -->
    <div v-if="turnResolution.resolved_aftershocks.length > 0" class="resolution-section">
      <h4 class="section-title">
        <span class="section-icon"><IconLightning :size="16" /></span>
        Architectural Aftershocks
      </h4>
      <div class="aftershocks-list">
        <AppCard
          v-for="aftershock in turnResolution.resolved_aftershocks"
          :key="aftershock.effect_instance_id"
          variant="warning"
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
        </AppCard>
      </div>
    </div>
    
    <!-- Player Action -->
    <div class="resolution-section">
      <h4 class="section-title">
        <span class="section-icon"><IconTarget :size="16" /></span>
        Your Action
      </h4>
      <AppCard variant="positive">
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
      </AppCard>
    </div>
    
    <!-- System Event -->
    <div v-if="turnResolution.event_resolution" class="resolution-section">
      <h4 class="section-title">
        <span class="section-icon"><IconMegaphone :size="16" /></span>
        System Event
      </h4>
      <AppCard variant="neutral">
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
      </AppCard>
    </div>
    
    <!-- Stakeholder Reactions -->
    <div v-if="turnResolution.stakeholder_resolution.reactions.length > 0" class="resolution-section">
      <h4 class="section-title">
        <span class="section-icon"><IconGroup :size="16" /></span>
        Stakeholder Reactions
      </h4>
      <div class="stakeholder-reactions">
        <AppCard
          v-for="(reaction, idx) in turnResolution.stakeholder_resolution.reactions"
          :key="idx"
          :title="formatStakeholderName(reaction.stakeholder_id)"
          variant="neutral"
        >
          <p class="reaction-text">{{ reaction.presentation.summary }}</p>
        </AppCard>
      </div>
    </div>
  </AppFrame>
</template>

<script setup lang="ts">
import type { TurnResolutionContext } from '@/domains/simulation/model'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'
import AppCard from '@/ui/components/cards/AppCard.vue'
import AppFrame from '@/ui/components/surfaces/AppFrame.vue'
import IconSwords from '@/ui/components/icons/IconSwords.vue'
import IconLightning from '@/ui/components/icons/IconLightning.vue'
import IconTarget from '@/ui/components/icons/IconTarget.vue'
import IconMegaphone from '@/ui/components/icons/IconMegaphone.vue'
import IconGroup from '@/ui/components/icons/IconGroup.vue'

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
.turn-resolution-panel :deep(.dungeon-frame__body) {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-lg);
}

.resolution-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-title {
  color: var(--dng-title-gold);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-size: var(--text-xs);
}

.section-icon {
  display: inline-flex;
  align-items: center;
  color: var(--dng-subtitle-warm);
}

.event-title {
  color: var(--dng-title-gold);
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  margin-bottom: var(--space-sm);
}

.event-summary {
  color: var(--dng-subtitle-warm);
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
  background: var(--effect-positive-bg);
  color: var(--effect-positive);
  border-color: var(--effect-positive-border);
}

.change-badge.negative {
  background: var(--effect-negative-bg);
  color: var(--effect-negative);
  border-color: var(--effect-negative-border);
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

.reaction-text {
  color: var(--text-primary);
  font-size: var(--text-sm);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .turn-resolution-panel :deep(.dungeon-frame__body) {
    padding: var(--space-md);
  }
}
</style>
