<template>
  <section class="outcome-panel" :class="[`mood-${mood}`, `archetype-${archetype}`]">
    <!-- Artwork frame — reserved for future archetype portrait illustrations -->
    <div class="artwork-frame" aria-hidden="true">
      <!-- Portrait image replaces the icon emoji when a URL is supplied -->
      <img v-if="portraitUrl" class="archetype-portrait" :src="portraitUrl" alt="" />
      <div v-else class="artwork-icon">{{ archetypeIcon }}</div>
    </div>

    <div class="outcome-body">
      <p class="outcome-eyebrow">Outcome Archetype</p>

      <h3 class="outcome-title">{{ title }}</h3>

      <div v-if="tier" class="tier-badge" :class="`tier-${tier}`">
        {{ tierDisplay }}
      </div>

      <p class="outcome-summary">{{ summary }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OutcomeArchetypeId } from '@/domains/simulation/rules/classify_outcome_archetype'

const props = withDefaults(
  defineProps<{
    archetype: OutcomeArchetypeId
    title: string
    summary: string
    mood?: 'calm' | 'tense' | 'victorious'
    tier?: 'triumph' | 'success' | 'survival' | 'struggle' | 'collapse'
    /** Optional archetype portrait URL. Replaces the icon emoji when provided. */
    portraitUrl?: string
  }>(),
  {
    mood: 'calm'
  }
)

const archetypeIcon = computed(() => {
  const icons: Record<OutcomeArchetypeId, string> = {
    boundary_builder:     '🏗️',
    firefighter:          '🧯',
    runaway_refactorer:   '♻️',
    stakeholder_whisperer: '🗣️',
    system_stabilizer:    '⚖️'
  }
  return icons[props.archetype]
})

const tierDisplay = computed(() => {
  const labels: Record<string, string> = {
    triumph:  '🏆 Triumph',
    success:  '✓ Success',
    survival: '🛡️ Survival',
    struggle: '⚠️ Struggle',
    collapse: '💀 Collapse'
  }
  return props.tier ? (labels[props.tier] ?? props.tier) : ''
})
</script>

<style scoped>
.outcome-panel {
  background: var(--surface-elevated);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-inset-ridge), var(--shadow-card);
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
}

.outcome-panel.mood-calm {
  border-color: var(--border-neutral, rgba(96, 165, 250, 0.35));
}

.outcome-panel.mood-tense {
  border-color: var(--border-warning, rgba(251, 191, 36, 0.40));
}

.outcome-panel.mood-victorious {
  border-color: var(--border-positive, rgba(52, 211, 153, 0.40));
  box-shadow: var(--shadow-card), var(--shadow-glow-positive);
}

/* Artwork frame — reserved region for future archetype portraits */
.artwork-frame {
  width: 100%;
  min-height: 160px;
  background:
    linear-gradient(160deg,
      rgba(169, 137, 250, 0.06) 0%,
      transparent 60%),
    var(--bg-overlay-strong);
  border-bottom: 1px dashed var(--border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  position: relative;
}

.mood-victorious .artwork-frame {
  background:
    linear-gradient(160deg,
      rgba(52, 211, 153, 0.10) 0%,
      transparent 70%),
    var(--bg-overlay-strong);
}

.mood-tense .artwork-frame {
  background:
    linear-gradient(160deg,
      rgba(251, 191, 36, 0.08) 0%,
      transparent 70%),
    var(--bg-overlay-strong);
}

/* Portrait image — fills artwork frame when portraitUrl is provided */
.archetype-portrait {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.92;
}

.artwork-icon {
  font-size: var(--text-6xl);
  line-height: 1;
  filter: drop-shadow(0 4px 16px rgba(169, 137, 250, 0.35));
}

.mood-victorious .artwork-icon {
  filter: drop-shadow(0 4px 24px rgba(52, 211, 153, 0.45));
}

.mood-tense .artwork-icon {
  filter: drop-shadow(0 4px 16px rgba(251, 191, 36, 0.35));
}

.artwork-placeholder-label {
  display: none;
}

/* Body content */
.outcome-body {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-md);
}

.outcome-eyebrow {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  font-weight: var(--font-semibold);
}

.outcome-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

.tier-badge {
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-wide);
  border: 1px solid transparent;
}

.tier-triumph {
  background: var(--effect-positive-bg);
  border-color: var(--effect-positive-border);
  color: var(--effect-positive);
}

.tier-success {
  background: var(--effect-positive-bg);
  border-color: var(--effect-positive-border);
  color: var(--effect-positive);
  opacity: 0.8;
}

.tier-survival {
  background: var(--effect-neutral-bg);
  border-color: var(--effect-neutral-border);
  color: var(--effect-neutral);
}

.tier-struggle {
  background: var(--effect-warning-bg);
  border-color: var(--effect-warning-border);
  color: var(--effect-warning);
}

.tier-collapse {
  background: var(--effect-negative-bg);
  border-color: var(--effect-negative-border);
  color: var(--effect-negative);
}

.outcome-summary {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  max-width: 44ch;
}
</style>
