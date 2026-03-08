<template>
  <div class="stakeholder-panel">
    <h3 class="panel-title">Stakeholders</h3>
    <div class="stakeholders-list">
      <div 
        v-for="(data, stakeholderId) in stakeholders" 
        :key="stakeholderId"
        class="stakeholder-item"
        :class="getSatisfactionClass(data.satisfaction)"
      >
        <div class="stakeholder-info">
          <div class="stakeholder-name">{{ formatStakeholderName(stakeholderId) }}</div>
          <div class="satisfaction-label">{{ getSatisfactionLabel(data.satisfaction) }}</div>
        </div>
        <div class="satisfaction-meter">
          <div class="meter-fill" :style="{ width: data.satisfaction + '%' }"></div>
        </div>
        <div class="satisfaction-value">{{ Math.round(data.satisfaction) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StakeholderSnapshot } from '@/domains/simulation/model'

defineProps<{
  stakeholders: StakeholderSnapshot
}>()

function formatStakeholderName(stakeholderId: string): string {
  return stakeholderId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getSatisfactionLabel(value: number): string {
  if (value >= 70) return 'Supportive'
  if (value >= 50) return 'Neutral'
  if (value >= 30) return 'Concerned'
  return 'Critical'
}

function getSatisfactionClass(value: number): string {
  if (value >= 70) return 'supportive'
  if (value >= 50) return 'neutral'
  if (value >= 30) return 'concerned'
  return 'critical'
}
</script>

<style scoped>
.stakeholder-panel {
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(139, 146, 168, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
}

.panel-title {
  color: #e94560;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
}

.stakeholders-list {
  display: grid;
  gap: 1rem;
}

.stakeholder-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stakeholder-info {
  grid-column: 1;
  grid-row: 1;
}

.stakeholder-name {
  color: #e0e0e0;
  font-weight: 600;
  font-size: 0.95rem;
}

.satisfaction-label {
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.stakeholder-item.critical .satisfaction-label {
  color: #e94560;
}

.stakeholder-item.concerned .satisfaction-label {
  color: #f39c12;
}

.stakeholder-item.neutral .satisfaction-label {
  color: #3498db;
}

.stakeholder-item.supportive .satisfaction-label {
  color: #2ecc71;
}

.satisfaction-meter {
  grid-column: 1;
  grid-row: 2;
  height: 6px;
  background: rgba(139, 146, 168, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  transition: width 0.5s, background 0.3s;
  border-radius: 3px;
}

.stakeholder-item.critical .meter-fill {
  background: #e94560;
}

.stakeholder-item.concerned .meter-fill {
  background: #f39c12;
}

.stakeholder-item.neutral .meter-fill {
  background: #3498db;
}

.stakeholder-item.supportive .meter-fill {
  background: #2ecc71;
}

.satisfaction-value {
  grid-column: 2;
  grid-row: 1 / 3;
  color: #e0e0e0;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  min-width: 2.5rem;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .stakeholder-panel {
    padding: 1rem;
  }
}
</style>
