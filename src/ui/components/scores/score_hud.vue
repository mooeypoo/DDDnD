<template>
  <div class="score-hud" ref="rootEl">
    <!-- Compact inline view: always visible -->
    <button
      class="hud-scores"
      role="group"
      aria-label="System scores — click to expand"
      @click="toggleExpand"
    >
      <span
        v-for="(value, scoreId) in scores"
        :key="scoreId"
        class="hud-metric"
        :class="getScoreClass(value)"
        :title="`${getMetricLabel(scoreId as string)}: ${Math.round(value)}`"
      >
        <span class="hud-metric-icon">{{ getMetricIcon(scoreId as string) }}</span>
        <span class="hud-metric-label">{{ getMetricLabel(scoreId as string) }}</span>
        <span class="hud-metric-value">{{ Math.round(value) }}</span>
        <span class="hud-metric-bar">
          <span class="hud-metric-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></span>
        </span>
      </span>
      <span class="hud-expand-hint" :class="{ active: isExpanded }" aria-hidden="true">▾</span>
    </button>

    <!-- Expanded detail panel -->
    <Transition name="hud-expand">
      <div v-if="isExpanded" class="hud-detail-panel">
        <div class="hud-detail-header">
          <h3 class="hud-detail-title">
            <span class="title-icon"><IconBarChart :size="16" /></span>
            System Ledger
          </h3>
          <div class="overall-health" :class="overallHealth.cssClass">
            <span class="health-dot"></span>
            <span class="health-label">{{ overallHealth.label }}</span>
          </div>
          <button class="hud-close" @click="isExpanded = false" aria-label="Close score details">&times;</button>
        </div>
        <div class="hud-detail-scores">
          <div
            v-for="(value, scoreId) in scores"
            :key="scoreId"
            class="hud-detail-item"
          >
            <div class="detail-header">
              <span class="detail-icon" :class="getColorClass(scoreId as string)">{{ getMetricIcon(scoreId as string) }}</span>
              <span class="detail-name">{{ getMetricLabel(scoreId as string) }}</span>
              <span class="detail-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
            </div>
            <div class="detail-bar-track">
              <div class="detail-bar-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import IconBarChart from '@/ui/components/icons/IconBarChart.vue'

const props = defineProps<{
  scores: Record<string, number>
}>()

const isExpanded = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function onDocumentClick(e: MouseEvent) {
  if (isExpanded.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    isExpanded.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

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
  const values = Object.values(props.scores)
  if (!values.length) return { label: 'Unknown', cssClass: '' }
  const min = Math.min(...values)
  if (min < 20) return { label: 'Critical', cssClass: 'status-critical' }
  if (min < 40) return { label: 'Warning',  cssClass: 'status-warning'  }
  if (min < 60) return { label: 'Caution',  cssClass: 'status-caution'  }
  return { label: 'Stable', cssClass: 'status-stable' }
})
</script>

<style scoped>
.score-hud {
  position: relative;
}

.hud-scores {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: nowrap;
  appearance: none;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: 2px 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.hud-scores:hover {
  border-color: var(--dng-divider);
  background: rgba(11, 28, 36, 0.3);
}

.hud-metric {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(11, 28, 36, 0.5);
  border: 1px solid var(--dng-divider);
  border-radius: var(--radius-md);
  padding: 2px 6px;
  flex-shrink: 0;
  min-width: 0;
  line-height: 1;
}

.hud-metric-label {
  font-size: var(--text-2xs);
  color: var(--dng-footer-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.hud-expand-hint {
  font-size: var(--text-2xs);
  color: var(--dng-footer-muted);
  transition: transform var(--duration-fast) var(--ease-standard);
  flex-shrink: 0;
  line-height: 1;
}

.hud-expand-hint.active {
  transform: rotate(180deg);
}

.hud-metric-icon {
  font-size: var(--text-xs);
  line-height: 1;
  flex-shrink: 0;
}

.hud-metric-value {
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  min-width: 1.4em;
  text-align: right;
}

.hud-metric.critical .hud-metric-value { color: var(--score-critical); }
.hud-metric.low .hud-metric-value      { color: var(--score-low); }
.hud-metric.medium .hud-metric-value   { color: var(--score-medium); }
.hud-metric.high .hud-metric-value     { color: var(--score-high); }

.hud-metric-bar {
  width: var(--hud-metric-bar-width-sm);
  height: 3px;
  background: var(--dng-shell-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
  display: none;
}

@media (min-width: 480px) {
  .hud-metric-bar {
    display: block;
  }
}

/* Desktop: scale up metric items */
@media (min-width: 769px) {
  .hud-metric {
    padding: 4px 8px;
    gap: 4px;
  }

  .hud-metric-icon {
    font-size: var(--text-sm);
  }

  .hud-metric-value {
    font-size: var(--text-xs);
  }

  .hud-metric-label {
    font-size: var(--text-xs);
  }

  .hud-metric-bar {
    width: var(--hud-metric-bar-width-md);
    height: 4px;
  }

  .hud-expand-hint {
    font-size: var(--text-xs);
  }
}

/* Compact labels on mobile: wrap to two lines */
@media (max-width: 768px) {
  .hud-scores {
    flex-wrap: wrap;
    row-gap: 3px;
  }
  .hud-metric {
    padding: 2px 4px;
  }
  .hud-metric-label {
    max-width: 52px;
  }
}

.hud-metric-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

.hud-metric-fill.critical { background: var(--score-critical); }
.hud-metric-fill.low      { background: var(--score-low); }
.hud-metric-fill.medium   { background: var(--score-medium); }
.hud-metric-fill.high     { background: var(--score-high); }

/* Expanded detail panel */
.hud-detail-panel {
  position: absolute;
  top: calc(100% + var(--space-sm));
  left: 0;
  right: auto;
  min-width: 320px;
  max-width: 400px;
  background: var(--dng-panel-surface);
  border: 1px solid var(--dng-bronze-mid);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: var(--z-overlay);
  backdrop-filter: blur(16px);
}

@media (max-width: 768px) {
  .hud-detail-panel {
    position: fixed;
    top: var(--hud-height);
    left: var(--space-sm);
    right: var(--space-sm);
    min-width: 0;
    max-width: none;
  }
}

.hud-detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--dng-divider);
}

.hud-detail-title {
  margin: 0;
  color: var(--dng-title-gold);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex: 1;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  color: var(--dng-subtitle-warm);
}

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

.hud-close {
  appearance: none;
  background: none;
  border: none;
  color: var(--dng-footer-muted);
  font-size: var(--text-xl);
  cursor: pointer;
  padding: 0 var(--space-xs);
  line-height: 1;
  transition: color var(--transition-fast);
}

.hud-close:hover {
  color: var(--dng-title-gold);
}

.hud-detail-scores {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hud-detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.detail-icon {
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.metric-maintainability      { color: var(--metric-maintainability); }
.metric-domain-clarity       { color: var(--metric-domain-clarity); }
.metric-delivery-confidence  { color: var(--metric-delivery-confidence); }
.metric-developer-morale     { color: var(--metric-developer-morale); }
.metric-user-trust           { color: var(--metric-user-trust); }
.metric-budget               { color: var(--metric-budget); }

.detail-name {
  color: var(--dng-title-gold);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  flex: 1;
}

.detail-value {
  font-size: var(--text-base);
  font-weight: var(--font-black);
  font-family: var(--font-mono);
  min-width: 2rem;
  text-align: right;
}

.detail-value.critical { color: var(--score-critical); }
.detail-value.low      { color: var(--score-low); }
.detail-value.medium   { color: var(--score-medium); }
.detail-value.high     { color: var(--score-high); }

.detail-bar-track {
  height: 4px;
  background: var(--dng-shell-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.detail-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-bar-fill.critical { background: var(--score-critical); }
.detail-bar-fill.low      { background: var(--score-low); }
.detail-bar-fill.medium   { background: var(--score-medium); }
.detail-bar-fill.high     { background: var(--score-high); }

/* Transition */
.hud-expand-enter-active {
  transition: opacity var(--duration-fast) var(--ease-decelerate),
              transform var(--duration-fast) var(--ease-decelerate);
}
.hud-expand-leave-active {
  transition: opacity var(--duration-instant) var(--ease-accelerate),
              transform var(--duration-instant) var(--ease-accelerate);
}
.hud-expand-enter-from,
.hud-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
