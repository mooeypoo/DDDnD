<template>
  <div class="stakeholder-hud" ref="rootEl">
    <!-- Compact row: always visible -->
    <button
      class="hud-stakeholders"
      role="group"
      aria-label="Stakeholder satisfaction — click to expand"
      @click="toggleExpand"
    >
      <span
        v-for="(data, stakeholderId) in stakeholders"
        :key="stakeholderId"
        class="hud-stakeholder"
        :class="getSatisfactionClass(data.satisfaction)"
        :title="`${formatName(stakeholderId)}: ${Math.round(data.satisfaction)} — ${getSatisfactionLabel(data.satisfaction)}`"
      >
        <span class="hud-sh-icon">{{ getStakeholderIcon(stakeholderId) }}</span>
        <span class="hud-sh-name">{{ formatName(stakeholderId) }}</span>
        <span class="hud-sh-value">{{ Math.round(data.satisfaction) }}</span>
      </span>
      <span class="hud-expand-hint" :class="{ active: isExpanded }" aria-hidden="true">▾</span>
    </button>

    <!-- Expanded detail panel -->
    <Transition name="hud-expand">
      <div v-if="isExpanded" class="hud-detail-panel">
        <div class="hud-detail-header">
          <h3 class="hud-detail-title">
            <span class="title-icon"><IconGroup :size="16" /></span>
            Stakeholder Pulse
          </h3>
          <button class="hud-close" @click="isExpanded = false" aria-label="Close stakeholder details">&times;</button>
        </div>
        <div class="hud-detail-list">
          <div
            v-for="(data, stakeholderId) in stakeholders"
            :key="stakeholderId"
            class="hud-detail-item"
          >
            <div class="detail-header">
              <span class="detail-icon">{{ getStakeholderIcon(stakeholderId) }}</span>
              <span class="detail-name">{{ formatName(stakeholderId) }}</span>
              <span class="detail-label" :class="getSatisfactionClass(data.satisfaction)">
                {{ getSatisfactionLabel(data.satisfaction) }}
              </span>
              <span class="detail-value" :class="getSatisfactionClass(data.satisfaction)">
                {{ Math.round(data.satisfaction) }}
              </span>
            </div>
            <div class="detail-bar-track">
              <div class="detail-bar-fill" :class="getSatisfactionClass(data.satisfaction)" :style="{ width: data.satisfaction + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { StakeholderSnapshot } from '@/domains/simulation/model'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'
import IconGroup from '@/ui/components/icons/IconGroup.vue'

/**
 * Compact stakeholder HUD with an expandable detail panel for current
 * satisfaction levels.
 */
const props = defineProps<{
  stakeholders: StakeholderSnapshot
  stakeholderNames?: Record<string, string>
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

function formatName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, props.stakeholderNames)
}

/**
 * Emoji shorthand used in the compact stakeholder HUD.
 */
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
.stakeholder-hud {
  position: relative;
}

.hud-stakeholders {
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

.hud-stakeholders:hover {
  border-color: var(--dng-divider);
  background: rgba(11, 28, 36, 0.3);
}

.hud-stakeholder {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(11, 28, 36, 0.5);
  border: 1px solid var(--dng-divider);
  border-radius: var(--radius-md);
  padding: 2px 5px;
  flex-shrink: 0;
  line-height: 1;
}

.hud-sh-name {
  font-size: var(--text-2xs);
  color: var(--dng-footer-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
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

/* Desktop: scale up stakeholder items */
@media (min-width: 769px) {
  .hud-stakeholder {
    padding: 4px 7px;
    gap: 3px;
  }

  .hud-sh-icon {
    font-size: var(--text-sm);
  }

  .hud-sh-value {
    font-size: var(--text-xs);
  }

  .hud-sh-name {
    font-size: var(--text-xs);
  }

  .hud-expand-hint {
    font-size: var(--text-xs);
  }
}

/* Hide text labels on mobile */
@media (max-width: 768px) {
  .hud-sh-name {
    display: none;
  }
}

.hud-sh-icon {
  font-size: var(--text-xs);
  line-height: 1;
}

.hud-sh-value {
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  min-width: 1.4em;
  text-align: right;
}

.hud-stakeholder.critical .hud-sh-value  { color: var(--satisfaction-critical); }
.hud-stakeholder.concerned .hud-sh-value { color: var(--satisfaction-concerned); }
.hud-stakeholder.neutral .hud-sh-value   { color: var(--satisfaction-neutral); }
.hud-stakeholder.supportive .hud-sh-value { color: var(--satisfaction-supportive); }

/* Expanded detail panel */
.hud-detail-panel {
  position: absolute;
  top: calc(100% + var(--space-sm));
  right: 0;
  left: auto;
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

.hud-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hud-detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-sm);
  background: rgba(13, 9, 4, 0.4);
  border-radius: var(--radius-md);
  border: 1px solid var(--dng-divider);
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

.detail-name {
  color: var(--dng-title-gold);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  flex: 1;
}

.detail-label {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.detail-label.critical   { color: var(--satisfaction-critical); }
.detail-label.concerned  { color: var(--satisfaction-concerned); }
.detail-label.neutral    { color: var(--satisfaction-neutral); }
.detail-label.supportive { color: var(--satisfaction-supportive); }

.detail-value {
  font-size: var(--text-base);
  font-weight: var(--font-black);
  font-family: var(--font-mono);
  min-width: 2rem;
  text-align: right;
}

.detail-value.critical   { color: var(--satisfaction-critical); }
.detail-value.concerned  { color: var(--satisfaction-concerned); }
.detail-value.neutral    { color: var(--satisfaction-neutral); }
.detail-value.supportive { color: var(--satisfaction-supportive); }

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

.detail-bar-fill.critical   { background: var(--satisfaction-critical); }
.detail-bar-fill.concerned  { background: var(--satisfaction-concerned); }
.detail-bar-fill.neutral    { background: var(--satisfaction-neutral); }
.detail-bar-fill.supportive { background: var(--satisfaction-supportive); }

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
