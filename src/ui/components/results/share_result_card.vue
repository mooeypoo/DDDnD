<template>
  <section class="share-result-card" ref="cardRef">
    <!-- Branding Header -->
    <div class="card-header">
      <div class="brand-row">
        <span class="brand-icon">🐉</span>
        <span class="brand-title">DDDnD</span>
      </div>
      <p class="brand-subtitle">Domain-Driven Design n' Dragons</p>
    </div>

    <!-- Outcome Tier -->
    <div class="tier-section" :class="tierClass">
      <div class="tier-badge">
        <span class="tier-icon">{{ tierIcon }}</span>
        <span class="tier-label">{{ tierDisplayName }}</span>
      </div>
    </div>

    <!-- Archetype Display -->
    <div class="archetype-section">
      <span class="archetype-icon">{{ archetypeIcon }}</span>
      <h2 class="archetype-name">{{ archetypeDisplayName }}</h2>
    </div>

    <!-- Player Info -->
    <div class="player-info">
      <ClassPortrait
        :classId="payload.cls"
        :className="classDisplayName"
        size="sm"
      />
      <div class="player-info-text">
        <div v-if="payload.name" class="player-name">{{ payload.name }}</div>
        <div class="player-class">{{ classDisplayName }}</div>
      </div>
    </div>

    <!-- Quest Info -->
    <div class="quest-info">
      <span class="quest-label">Quest</span>
      <span class="quest-name">{{ scenarioDisplayName }}</span>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat">
        <span class="stat-value">{{ payload.tc }}</span>
        <span class="stat-label">Turns</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{{ payload.avg }}</span>
        <span class="stat-label">Avg Score</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{{ completionLabel }}</span>
        <span class="stat-label">Result</span>
      </div>
    </div>

    <!-- Score Bars -->
    <div class="scores-section">
      <div
        v-for="(value, scoreId) in payload.scores"
        :key="scoreId"
        class="score-row"
      >
        <span class="score-name">{{ formatScoreName(String(scoreId)) }}</span>
        <div class="score-bar-track">
          <div
            class="score-bar-fill"
            :class="scoreClass(value)"
            :style="{ width: Math.min(value, 100) + '%' }"
          ></div>
        </div>
        <span class="score-value" :class="scoreClass(value)">{{ value }}</span>
      </div>
    </div>

    <!-- Footer: site domain (only shown when VITE_SITE_URL is configured at build time) -->
    <div v-if="siteDomain" class="card-footer">
      <span class="footer-text">{{ siteDomain }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SharePayload } from '@/domains/reporting/services/share_payload'
import type { OutcomeArchetypeId } from '@/domains/simulation/rules/classify_outcome_archetype'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'

const props = defineProps<{
  payload: SharePayload
}>()

const cardRef = ref<HTMLElement | null>(null)

// Expose the card element for external image export
defineExpose({ cardRef })

// Derive display domain from build-time env variable (hostname only, no scheme)
const siteDomain = computed(() => {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined
  if (!raw) return ''
  try {
    return new URL(raw).hostname
  } catch {
    return ''
  }
})

// ─── Display helpers ─────────────────────────────────────────

const tierDisplayName = computed(() => {
  const tier = props.payload.tid ?? props.payload.tier
  const labels: Record<string, string> = {
    triumph: 'Triumph',
    success: 'Success',
    survival: 'Survival',
    struggle: 'Struggle',
    collapse: 'Collapse',
    partial_success: 'Partial Success',
    failure: 'Failure'
  }
  return labels[tier] ?? tier.charAt(0).toUpperCase() + tier.slice(1)
})

const tierIcon = computed(() => {
  const tier = props.payload.tid ?? props.payload.tier
  const icons: Record<string, string> = {
    triumph: '🏆',
    success: '✓',
    survival: '🛡️',
    struggle: '⚠️',
    collapse: '💀',
    partial_success: '✓',
    failure: '💀'
  }
  return icons[tier] ?? '🎯'
})

const tierClass = computed(() => {
  const tier = props.payload.tid ?? props.payload.tier
  return `tier-${tier.replace('_', '-')}`
})

const archetypeIcon = computed(() => {
  const icons: Record<OutcomeArchetypeId, string> = {
    boundary_builder: '🏗️',
    firefighter: '🧯',
    runaway_refactorer: '♻️',
    stakeholder_whisperer: '🗣️',
    system_stabilizer: '⚖️'
  }
  return icons[props.payload.arch] ?? '🎯'
})

const archetypeDisplayName = computed(() => {
  return props.payload.arch
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
})

const classDisplayName = computed(() => {
  return props.payload.cls
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
})

const scenarioDisplayName = computed(() => {
  return props.payload.sid
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
})

const completionLabel = computed(() => {
  const labels: Record<string, string> = {
    max_turns_reached: 'Time Up',
    failure_condition_met: 'Collapse'
  }
  return labels[props.payload.cr] ?? props.payload.cr
})

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function scoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}
</script>

<style scoped>
.share-result-card {
  background: var(--surface-card, #192031);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.11));
  border-radius: var(--radius-2xl, 16px);
  overflow: hidden;
  max-width: 420px;
  width: 100%;
  font-family: 'Inter', sans-serif;
  color: var(--text-primary, #c8d0e0);
}

/* ─── Header ─────────────────────────────────────── */

.card-header {
  padding: var(--space-xl, 20px) var(--space-xl, 20px) var(--space-md, 12px);
  text-align: center;
  background: linear-gradient(
    160deg,
    rgba(169, 137, 250, 0.10) 0%,
    transparent 60%
  );
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm, 8px);
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-title {
  font-family: 'Cinzel', serif;
  font-size: var(--text-2xl, 1.5rem);
  font-weight: 700;
  color: var(--text-bright, #edf0f7);
  letter-spacing: 0.04em;
}

.brand-subtitle {
  margin: var(--space-xs, 4px) 0 0;
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #4d5b72);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ─── Tier ────────────────────────────────────────── */

.tier-section {
  padding: var(--space-lg, 16px) var(--space-xl, 20px);
  text-align: center;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  padding: var(--space-sm, 8px) var(--space-xl, 20px);
  border-radius: var(--radius-lg, 12px);
  font-weight: 700;
  font-size: var(--text-lg, 1.125rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.tier-triumph .tier-badge    { background: rgba(52, 211, 153, 0.18); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35); }
.tier-success .tier-badge    { background: rgba(52, 211, 153, 0.12); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.25); }
.tier-survival .tier-badge   { background: rgba(96, 165, 250, 0.12); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.25); }
.tier-struggle .tier-badge   { background: rgba(251, 191, 36, 0.12); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.25); }
.tier-collapse .tier-badge   { background: rgba(248, 113, 113, 0.12); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.25); }
.tier-partial-success .tier-badge { background: rgba(96, 165, 250, 0.12); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.25); }
.tier-failure .tier-badge    { background: rgba(248, 113, 113, 0.12); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.25); }

.tier-icon {
  font-size: 1.2rem;
}

/* ─── Archetype ───────────────────────────────────── */

.archetype-section {
  text-align: center;
  padding: 0 var(--space-xl, 20px) var(--space-md, 12px);
}

.archetype-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--space-sm, 8px);
}

.archetype-name {
  font-family: 'Cinzel', serif;
  font-size: var(--text-xl, 1.25rem);
  font-weight: 600;
  color: var(--text-bright, #edf0f7);
  margin: 0;
}

/* ─── Player Info ─────────────────────────────────── */

.player-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm, 8px);
  padding: var(--space-sm, 8px) var(--space-xl, 20px);
}

.player-info-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.player-name {
  font-size: var(--text-base, 1rem);
  font-weight: 600;
  color: var(--text-bright, #edf0f7);
}

.player-class {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-accent, #a989fa);
  font-weight: 500;
}

/* ─── Quest Info ──────────────────────────────────── */

.quest-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm, 8px);
  padding: var(--space-sm, 8px) var(--space-xl, 20px);
  font-size: var(--text-sm, 0.875rem);
}

.quest-label {
  color: var(--text-muted, #4d5b72);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.quest-name {
  color: var(--text-secondary, #7a8aa4);
}

/* ─── Stats Row ───────────────────────────────────── */

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg, 16px);
  padding: var(--space-lg, 16px) var(--space-xl, 20px);
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.stat-value {
  font-size: var(--text-xl, 1.25rem);
  font-weight: 700;
  color: var(--text-bright, #edf0f7);
}

.stat-label {
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #4d5b72);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border-subtle, rgba(255, 255, 255, 0.06));
}

/* ─── Score Bars ──────────────────────────────────── */

.scores-section {
  padding: var(--space-lg, 16px) var(--space-xl, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
}

.score-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
}

.score-name {
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-secondary, #7a8aa4);
  min-width: 100px;
  text-align: right;
}

.score-bar-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease-out;
}

.score-bar-fill.high     { background: var(--effect-positive, #34d399); }
.score-bar-fill.medium   { background: var(--metric-delivery-confidence, #60a5fa); }
.score-bar-fill.low      { background: var(--metric-developer-morale, #fbbf24); }
.score-bar-fill.critical { background: var(--effect-negative, #f87171); }

.score-value {
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  min-width: 28px;
  text-align: right;
}

.score-value.high     { color: var(--effect-positive, #34d399); }
.score-value.medium   { color: var(--metric-delivery-confidence, #60a5fa); }
.score-value.low      { color: var(--metric-developer-morale, #fbbf24); }
.score-value.critical { color: var(--effect-negative, #f87171); }

/* ─── Footer ──────────────────────────────────────── */

.card-footer {
  padding: var(--space-md, 12px) var(--space-xl, 20px);
  text-align: center;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.footer-text {
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #4d5b72);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
