<template>
  <div class="stakeholder-panel">
    <h3 class="panel-title">
      <span class="title-icon">👥</span>
      Stakeholders
    </h3>
    <div class="stakeholders-list">
      <div 
        v-for="(data, stakeholderId) in stakeholders" 
        :key="stakeholderId"
        class="stakeholder-item"
      >
        <div class="stakeholder-header">
          <div class="stakeholder-info">
            <div class="stakeholder-name">{{ formatStakeholderName(stakeholderId) }}</div>
            <div class="satisfaction-label" :class="getSatisfactionClass(data.satisfaction)">
              {{ getSatisfactionLabel(data.satisfaction) }}
            </div>
          </div>
          <div class="satisfaction-value" :class="getSatisfactionClass(data.satisfaction)">
            {{ Math.round(data.satisfaction) }}
          </div>
        </div>
        <div class="satisfaction-bar-container">
          <div 
            class="satisfaction-bar" 
            :class="getSatisfactionClass(data.satisfaction)" 
            :style="{ width: data.satisfaction + '%' }"
          >
            <div class="bar-glow"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StakeholderSnapshot } from '@/domains/simulation/model'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'

const props = defineProps<{
  stakeholders: StakeholderSnapshot
  stakeholderNames?: Record<string, string>
}>()

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, props.stakeholderNames)
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
  background: var(--surface-panel);
  border: 1px solid var(--border-panel);
  border-radius: var(--radius-xl);
  padding: var(--panel-padding);
  box-shadow: var(--shadow-panel);
}

.panel-title {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  margin: 0 0 var(--space-lg) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.title-icon {
  font-size: var(--text-2xl);
}

.stakeholders-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.stakeholder-item {
  padding: var(--space-md);
  background: var(--bg-inset);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  transition: all var(--transition-fast);
}

.stakeholder-item:hover {
  background: var(--bg-overlay);
  border-color: var(--border-card);
}

.stakeholder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stakeholder-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stakeholder-name {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.satisfaction-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.satisfaction-label.critical  { color: var(--satisfaction-critical);   }
.satisfaction-label.concerned  { color: var(--satisfaction-concerned);   }
.satisfaction-label.neutral    { color: var(--satisfaction-neutral);    }
.satisfaction-label.supportive { color: var(--satisfaction-supportive); }

.satisfaction-value {
  font-size: var(--text-xl);
  font-weight: var(--font-black);
  font-family: var(--font-mono);
  min-width: 2.5rem;
  text-align: right;
}

.satisfaction-value.critical  { color: var(--satisfaction-critical);   }
.satisfaction-value.concerned  { color: var(--satisfaction-concerned);   }
.satisfaction-value.neutral    { color: var(--satisfaction-neutral);    }
.satisfaction-value.supportive { color: var(--satisfaction-supportive); }

.satisfaction-bar-container {
  height: 6px;
  background: var(--bg-overlay-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.satisfaction-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.satisfaction-bar.critical  { background: var(--satisfaction-critical);   }
.satisfaction-bar.concerned  { background: var(--satisfaction-concerned);   }
.satisfaction-bar.neutral    { background: var(--satisfaction-neutral);    }
.satisfaction-bar.supportive { background: var(--satisfaction-supportive); }

.bar-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 100%);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .stakeholder-panel {
    padding: var(--space-lg);
  }
}
</style>
