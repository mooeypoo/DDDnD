<template>
  <div class="stakeholder-drivers-panel">
    <div v-if="drivers.length === 0" class="drivers-empty">
      No stakeholder reactions this turn.
    </div>
    <div v-else class="drivers-list">
      <div
        v-for="row in drivers"
        :key="row.stakeholder_id"
        class="driver-row"
        :data-tone="row.tone"
      >
        <div class="driver-header">
          <span class="tone-dot" :class="`tone-dot--${row.tone}`" aria-hidden="true" />
          <span class="driver-name">{{ row.stakeholder_name }}</span>
          <span
            v-if="row.net_satisfaction_delta !== 0"
            class="delta-badge"
            :class="row.net_satisfaction_delta > 0 ? 'positive' : 'negative'"
          >
            {{ row.net_satisfaction_delta > 0 ? '+' : '' }}{{ row.net_satisfaction_delta }}
          </span>
        </div>
        <div class="driver-title">{{ row.reaction_title }}</div>
        <p class="driver-summary">{{ row.reaction_summary }}</p>
        <div v-if="row.score_changes.length > 0" class="changes-list">
          <span
            v-for="(change, idx) in row.score_changes"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StakeholderReactionRecord } from '@/domains/simulation'
import { mapStakeholderDrivers } from '@/ui/composables/stakeholder_drivers'

const props = defineProps<{
  reactions: StakeholderReactionRecord[]
  stakeholderNames?: Record<string, string>
}>()

const drivers = computed(() => mapStakeholderDrivers(props.reactions, props.stakeholderNames))

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.stakeholder-drivers-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.drivers-empty {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-sm);
  font-style: italic;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.driver-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--dng-surface-subtle, rgba(255, 255, 255, 0.04));
  border-left: 3px solid var(--dng-border-muted);
}

.driver-row[data-tone='positive'] {
  border-left-color: var(--dng-positive, #4caf50);
}

.driver-row[data-tone='mixed'] {
  border-left-color: var(--dng-warning, #ff9800);
}

.driver-row[data-tone='concern'] {
  border-left-color: var(--dng-caution, #ff9800);
}

.driver-row[data-tone='critical'] {
  border-left-color: var(--dng-danger, #f44336);
}

.driver-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.tone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--dng-border-muted);
}

.tone-dot--positive { background: var(--dng-positive, #4caf50); }
.tone-dot--mixed    { background: var(--dng-warning, #ff9800); }
.tone-dot--concern  { background: var(--dng-caution, #ff9800); }
.tone-dot--critical { background: var(--dng-danger, #f44336); }
.tone-dot--fallback { background: var(--dng-border-muted, #888); }

.driver-name {
  color: var(--dng-title-gold);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.delta-badge {
  margin-left: auto;
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.delta-badge.positive {
  background: rgba(76, 175, 80, 0.15);
  color: var(--dng-positive, #4caf50);
}

.delta-badge.negative {
  background: rgba(244, 67, 54, 0.15);
  color: var(--dng-danger, #f44336);
}

.driver-title {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.driver-summary {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin: 0;
  opacity: 0.85;
}

.changes-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.change-badge {
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border: 1px solid transparent;
}

.change-badge.positive {
  background: rgba(76, 175, 80, 0.1);
  color: var(--dng-positive, #4caf50);
  border-color: rgba(76, 175, 80, 0.25);
}

.change-badge.negative {
  background: rgba(244, 67, 54, 0.1);
  color: var(--dng-danger, #f44336);
  border-color: rgba(244, 67, 54, 0.25);
}
</style>
