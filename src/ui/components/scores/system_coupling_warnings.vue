<template>
  <div v-if="warnings.length > 0" class="coupling-warnings" role="alert" aria-label="System coupling warnings">
    <div
      v-for="warning in warnings"
      :key="warning.triggerScoreId"
      class="coupling-warning"
      :title="couplingTooltip"
    >
      <span class="warning-icon" aria-hidden="true">⚠️</span>
      <div class="warning-content">
        <span class="warning-title">{{ warning.title }}</span>
        <span class="warning-description">{{ warning.description }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCollapseWarnings } from '@/ui/composables/system_coupling'

const props = defineProps<{
  scores: Record<string, number>
}>()

const warnings = computed(() => getCollapseWarnings(props.scores))

const couplingTooltip = `When parts of the system collapse below critical thresholds, positive improvements to coupled scores are diminished.`
</script>

<style scoped>
.coupling-warnings {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.coupling-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 100, 50, 0.08);
  border: 1px solid rgba(255, 100, 50, 0.25);
  border-radius: var(--radius-md);
  cursor: help;
}

.warning-icon {
  font-size: var(--text-base);
  flex-shrink: 0;
  line-height: 1.3;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.warning-title {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--score-critical);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.warning-description {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
