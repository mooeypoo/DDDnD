<template>
  <aside class="hud-sidebar" role="complementary" aria-label="Game status sidebar">
    <!-- Turn tracker -->
    <div class="sidebar-section sidebar-turn">
      <div class="section-header">
        <span class="section-icon">⚔️</span>
        <h3 class="section-title">Turn</h3>
      </div>
      <div class="turn-display">
        <span class="turn-current">{{ currentTurn }}</span>
        <span class="turn-sep">/</span>
        <span class="turn-max">{{ maxTurns }}</span>
      </div>
      <div class="turn-progress-track">
        <div class="turn-progress-fill" :style="{ width: turnProgress + '%' }"></div>
      </div>
    </div>

    <!-- Scores panel — always expanded -->
    <div class="sidebar-section" v-if="scores">
      <div class="section-header">
        <span class="section-icon">📊</span>
        <h3 class="section-title">System Ledger</h3>
      </div>
      <div class="overall-health" :class="overallHealth.cssClass">
        <span class="health-dot"></span>
        <span class="health-label">{{ overallHealth.label }}</span>
      </div>
      <div class="sidebar-scores">
        <div
          v-for="(value, scoreId) in scores"
          :key="scoreId"
          class="sidebar-metric"
        >
          <div class="metric-header">
            <span class="metric-icon" :class="getColorClass(scoreId as string)">{{ getMetricIcon(scoreId as string) }}</span>
            <span class="metric-name">{{ getMetricLabel(scoreId as string) }}</span>
            <span class="metric-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
          </div>
          <div class="metric-bar-track">
            <div class="metric-bar-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- System coupling warnings -->
      <SystemCouplingWarnings v-if="scores" :scores="scores" />
    </div>

    <!-- Stakeholders panel — always expanded -->
    <div class="sidebar-section" v-if="stakeholders">
      <div class="section-header">
        <span class="section-icon">👥</span>
        <h3 class="section-title">Stakeholder Pulse</h3>
      </div>
      <div class="sidebar-stakeholders">
        <div
          v-for="(data, stakeholderId) in stakeholders"
          :key="stakeholderId"
          class="sidebar-stakeholder"
        >
          <div class="stakeholder-header">
            <span class="stakeholder-icon">{{ getStakeholderIcon(stakeholderId as string) }}</span>
            <span class="stakeholder-name">{{ formatName(stakeholderId as string) }}</span>
            <span class="stakeholder-label" :class="getSatisfactionClass(data.satisfaction)">
              {{ getSatisfactionLabel(data.satisfaction) }}
            </span>
            <span class="stakeholder-value" :class="getSatisfactionClass(data.satisfaction)">
              {{ Math.round(data.satisfaction) }}
            </span>
          </div>
          <div class="stakeholder-bar-track">
            <div
              class="stakeholder-bar-fill"
              :class="getSatisfactionClass(data.satisfaction)"
              :style="{ width: data.satisfaction + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StakeholderSnapshot } from '@/domains/simulation/model'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'
import SystemCouplingWarnings from '@/ui/components/scores/system_coupling_warnings.vue'

const props = defineProps<{
  currentTurn: number
  maxTurns: number
  scores?: Record<string, number>
  stakeholders?: StakeholderSnapshot
  stakeholderNames?: Record<string, string>
}>()

const turnProgress = computed(() => {
  if (!props.maxTurns) return 0
  return Math.round((props.currentTurn / props.maxTurns) * 100)
})

function getMetricIcon(scoreId: string): string {
  return getMetricPresentation(scoreId).icon
}

function getMetricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label
}

function getColorClass(scoreId: string): string {
  return getMetricPresentation(scoreId).colorClass
}

function getScoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}

const overallHealth = computed(() => {
  if (!props.scores) return { label: 'Unknown', cssClass: '' }
  const values = Object.values(props.scores)
  if (!values.length) return { label: 'Unknown', cssClass: '' }
  const min = Math.min(...values)
  if (min < 20) return { label: 'Critical', cssClass: 'status-critical' }
  if (min < 40) return { label: 'Warning',  cssClass: 'status-warning'  }
  if (min < 60) return { label: 'Caution',  cssClass: 'status-caution'  }
  return { label: 'Stable', cssClass: 'status-stable' }
})

const STAKEHOLDER_ICONS: Record<string, string> = {
  cto: '🏛️',
  vp_product: '📋',
  lead_developer: '💻',
  lead_engineer: '💻',
  operations_manager: '⚙️',
  operations_team: '⚙️',
  engineering_team: '🔧',
  product_team: '📦',
  finance_team: '💵',
  users: '👤',
  support_team: '🎧',
  leadership_team: '👔',
}

function getStakeholderIcon(stakeholderId: string): string {
  return STAKEHOLDER_ICONS[stakeholderId] ?? '👤'
}

function formatName(stakeholderId: string): string {
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
.hud-sidebar {
  width: var(--layout-sidebar-width);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  background: var(--hud-bg);
  border-right: 1px solid var(--hud-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 0;
  z-index: var(--z-hud);
  flex-shrink: 0;

  /* Thin scrollbar for the sidebar */
  scrollbar-width: thin;
  scrollbar-color: var(--border-subtle) transparent;
}

.hud-sidebar::-webkit-scrollbar {
  width: 4px;
}

.hud-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.hud-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: var(--radius-full);
}

/* ─── Section ─── */
.sidebar-section {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.sidebar-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  font-size: var(--text-base);
  line-height: 1;
}

.section-title {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
}

/* ─── Turn display ─── */
.sidebar-turn {
  align-items: center;
  text-align: center;
}

.turn-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  line-height: 1;
}

.turn-current {
  color: var(--text-accent);
  font-size: var(--text-2xl);
}

.turn-sep {
  color: var(--text-muted);
  font-size: var(--text-base);
}

.turn-max {
  color: var(--text-muted);
  font-size: var(--text-base);
}

.turn-progress-track {
  width: 100%;
  height: 4px;
  background: var(--bg-overlay-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.turn-progress-fill {
  height: 100%;
  background: var(--text-accent);
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

/* ─── Overall health ─── */
.overall-health {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.health-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.status-critical { color: var(--score-critical); }
.status-warning  { color: var(--score-low); }
.status-caution  { color: var(--score-medium); }
.status-stable   { color: var(--score-high); }

/* ─── Scores ─── */
.sidebar-scores {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.sidebar-metric {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.metric-icon {
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.metric-maintainability      { color: var(--metric-maintainability); }
.metric-domain-clarity       { color: var(--metric-domain-clarity); }
.metric-delivery-confidence  { color: var(--metric-delivery-confidence); }
.metric-developer-morale     { color: var(--metric-developer-morale); }
.metric-user-trust           { color: var(--metric-user-trust); }
.metric-budget               { color: var(--metric-budget); }

.metric-name {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-value {
  font-size: var(--text-base);
  font-weight: var(--font-black);
  font-family: var(--font-mono);
  min-width: 2rem;
  text-align: right;
}

.metric-value.critical { color: var(--score-critical); }
.metric-value.low      { color: var(--score-low); }
.metric-value.medium   { color: var(--score-medium); }
.metric-value.high     { color: var(--score-high); }

.metric-bar-track {
  height: 4px;
  background: var(--bg-overlay-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-bar-fill.critical { background: var(--score-critical); }
.metric-bar-fill.low      { background: var(--score-low); }
.metric-bar-fill.medium   { background: var(--score-medium); }
.metric-bar-fill.high     { background: var(--score-high); }

/* ─── Stakeholders ─── */
.sidebar-stakeholders {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.sidebar-stakeholder {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-inset);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.stakeholder-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.stakeholder-icon {
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.stakeholder-name {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stakeholder-label {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.stakeholder-label.critical   { color: var(--satisfaction-critical); background: var(--effect-negative-bg); }
.stakeholder-label.concerned  { color: var(--satisfaction-concerned); background: var(--effect-warning-bg); }
.stakeholder-label.neutral    { color: var(--satisfaction-neutral); background: var(--effect-neutral-bg); }
.stakeholder-label.supportive { color: var(--satisfaction-supportive); background: var(--effect-positive-bg); }

.stakeholder-value {
  font-size: var(--text-base);
  font-weight: var(--font-black);
  font-family: var(--font-mono);
  min-width: 2rem;
  text-align: right;
}

.stakeholder-value.critical   { color: var(--satisfaction-critical); }
.stakeholder-value.concerned  { color: var(--satisfaction-concerned); }
.stakeholder-value.neutral    { color: var(--satisfaction-neutral); }
.stakeholder-value.supportive { color: var(--satisfaction-supportive); }

.stakeholder-bar-track {
  height: 4px;
  background: var(--bg-overlay-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stakeholder-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

.stakeholder-bar-fill.critical   { background: var(--satisfaction-critical); }
.stakeholder-bar-fill.concerned  { background: var(--satisfaction-concerned); }
.stakeholder-bar-fill.neutral    { background: var(--satisfaction-neutral); }
.stakeholder-bar-fill.supportive { background: var(--satisfaction-supportive); }
</style>
