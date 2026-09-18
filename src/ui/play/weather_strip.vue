<template>
  <div class="weather-stack">
    <div
      class="weather-strip"
      data-play-highlight="weather"
      :class="{
        'is-highlighted': highlight === 'scores',
        'aftershock-highlighted': highlight === 'aftershocks',
        'is-bound': collapseWarnings.length > 0,
      }"
      role="group"
      aria-label="Turns remaining and the system's state"
    >
      <p class="turn-clock" :class="{ 'is-late': isLate }" aria-live="polite">
        <span class="turn-clock-count">{{ turnsLeft }}</span>
        <span class="turn-clock-copy">
          <span class="turn-clock-kicker">{{ turnsLeft === 1 ? 'turn left' : 'turns left' }}</span>
          <span class="turn-clock-range">{{ currentTurn }} of {{ maxTurns }}</span>
        </span>
      </p>

      <ol class="weather-vials">
        <li
          v-for="meter in meters"
          :key="meter.id"
          class="weather-vial"
          :class="[
            `weather-${meter.weather}`,
            {
              'is-collapsing': collapsingIds.has(meter.id),
              'is-withering': witheringIds.has(meter.id) && !collapsingIds.has(meter.id),
            },
          ]"
          :title="meter.title"
        >
          <span class="weather-vial-icon" aria-hidden="true">{{ meter.icon }}</span>
          <span class="weather-vial-label" aria-hidden="true">{{ meter.shortLabel }}</span>
          <span class="weather-vial-readout" aria-hidden="true">
            <span class="weather-vial-value">{{ meter.value }}</span>
            <span
              v-if="meter.delta !== null"
              class="weather-vial-delta"
              :class="meter.delta > 0 ? 'is-gain' : 'is-loss'"
            >{{ meter.deltaLabel }}</span>
          </span>
          <span class="visually-hidden">
            {{ meter.label }} {{ meter.value }}, {{ meter.weatherLabel }}{{ meter.deltaSpoken }}
          </span>
        </li>
      </ol>

      <p v-if="aftershockCount > 0" class="weather-aftershock" data-play-highlight="aftershocks" role="status">
        {{ aftershockCount }} aftershock{{ aftershockCount === 1 ? '' : 's' }} waiting
      </p>
    </div>

    <aside
      v-if="collapseWarnings.length > 0"
      class="collapse-front"
      data-play-highlight="coupling"
      :class="{ 'is-compound': collapseWarnings.length > 1 }"
      role="alert"
      aria-label="System collapse"
    >
      <span class="collapse-embers" aria-hidden="true" />
      <article
        v-for="warning in collapseWarnings"
        :key="warning.triggerScoreId"
        class="collapse-banner"
      >
        <p class="collapse-kicker">System bound</p>
        <h2 class="collapse-title">{{ warning.title }}</h2>
        <p class="collapse-copy">{{ urgencyCopy(warning) }}</p>
      </article>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { getCollapseWarnings, type CollapseWarning } from '@/ui/composables/system_coupling'
import {
  collapseUrgencyCopy,
  describeScoreWeather,
  isLateTurnClock,
  remainingTurns,
  shortMetricLabel,
} from '@/ui/play/weather_band'

const props = defineProps<{
  scores: Record<string, number>
  currentTurn: number
  maxTurns: number
  /** Last resolved turn's score movement, from engine history. */
  scoreDeltas?: Record<string, number>
  aftershockCount?: number
  highlight?: string | null
  isTutorial?: boolean
}>()

const aftershockCount = computed(() => props.aftershockCount ?? 0)

const collapseWarnings = computed(() => getCollapseWarnings(props.scores))
const collapsingIds = computed(() => new Set(collapseWarnings.value.map((warning) => warning.triggerScoreId)))
const witheringIds = computed(() => {
  const ids = new Set<string>()
  for (const warning of collapseWarnings.value) {
    for (const scoreId of warning.affectedScoreIds) ids.add(scoreId)
  }
  return ids
})
const turnsLeft = computed(() => remainingTurns(props.currentTurn, props.maxTurns))
const isLate = computed(() => {
  return isLateTurnClock(props.currentTurn, props.maxTurns, {
    isTutorial: props.isTutorial,
  })
})

function urgencyCopy(warning: CollapseWarning): string {
  return collapseUrgencyCopy(warning.triggerScoreId, warning.affectedScoreIds, warning.description)
}

const meters = computed(() => {
  return Object.entries(props.scores).map(([id, value]) => {
    const presentation = getMetricPresentation(id)
    const weather = describeScoreWeather(value)
    const rawDelta = props.scoreDeltas?.[id]
    const delta = typeof rawDelta === 'number' && Math.round(rawDelta) !== 0
      ? Math.round(rawDelta)
      : null
    return {
      id,
      value: Math.round(value),
      delta,
      deltaLabel: delta === null ? '' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`,
      deltaSpoken: delta === null
        ? ''
        : `, ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} last turn`,
      icon: presentation.icon,
      label: presentation.label,
      shortLabel: shortMetricLabel(id, presentation.label),
      weather: weather.weather,
      weatherLabel: weather.label,
      title: collapsingIds.value.has(id)
        ? `${presentation.label}: ${Math.round(value)} — collapsing`
        : `${presentation.label}: ${Math.round(value)} — ${weather.label}`,
    }
  })
})
</script>

<style scoped>
.weather-stack {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}

.weather-strip {
  display: flex;
  align-items: center;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.7rem;
  background:
    linear-gradient(180deg, rgba(28, 20, 8, 0.92) 0%, rgba(14, 10, 4, 0.88) 100%);
  border: 1px solid rgba(176, 132, 42, 0.38);
  border-radius: 22px;
  box-shadow:
    inset 0 1px 0 rgba(232, 196, 96, 0.18),
    0 10px 28px rgba(0, 0, 0, 0.45);
}

.weather-strip.is-highlighted {
  box-shadow:
    inset 0 1px 0 rgba(232, 196, 96, 0.18),
    0 0 0 2px rgba(240, 208, 96, 0.55),
    0 10px 28px rgba(0, 0, 0, 0.45);
}

.weather-strip.is-bound {
  border-color: rgba(220, 72, 36, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 160, 80, 0.18),
    0 0 22px rgba(196, 48, 24, 0.28),
    0 10px 28px rgba(0, 0, 0, 0.45);
}

.weather-strip.aftershock-highlighted .weather-aftershock {
  color: #fff3c0;
  text-shadow: 0 0 12px rgba(240, 192, 80, 0.7);
}

.turn-clock {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.2rem 0.75rem 0.2rem 0.35rem;
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(78, 52, 16, 0.96) 0%, rgba(32, 20, 8, 0.96) 100%);
  border: 1px solid rgba(232, 196, 96, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 140, 0.28),
    0 0 18px rgba(232, 196, 96, 0.2);
  font-family: var(--font-heading);
  white-space: nowrap;
}

.turn-clock-count {
  min-width: 1.55rem;
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  color: #f8e6a8;
  text-shadow: 0 0 14px rgba(240, 200, 80, 0.5);
}

.turn-clock-copy {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
}

.turn-clock-kicker {
  font-size: var(--text-sm);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f0c060;
}

.turn-clock-range {
  font-size: var(--text-kicker);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-bright);
}

.turn-clock.is-late {
  border-color: rgba(240, 140, 120, 0.78);
  box-shadow:
    inset 0 1px 0 rgba(255, 196, 168, 0.22),
    0 0 18px rgba(196, 72, 64, 0.28);
}

.turn-clock.is-late .turn-clock-count {
  color: #f8c0b4;
  text-shadow: 0 0 14px rgba(240, 120, 96, 0.45);
}

.turn-clock.is-late .turn-clock-kicker {
  color: #f0a098;
}

.weather-vials {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  flex: 1;
}

.weather-vial {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    'icon label'
    'icon readout';
  align-items: center;
  column-gap: 0.4rem;
  min-width: 6.4rem;
  padding: 0.3rem 0.6rem 0.34rem 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 6, 2, 0.45);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.weather-vial-icon {
  grid-area: icon;
  font-size: var(--text-xl);
  line-height: 1;
}

.weather-vial-label {
  grid-area: label;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  color: var(--text-secondary);
}

.weather-vial-readout {
  grid-area: readout;
  display: flex;
  align-items: baseline;
  gap: 0.28rem;
}

.weather-vial-value {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.05;
  color: var(--text-bright);
}

.weather-vial-delta {
  font-size: var(--text-2xs);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.weather-vial-delta.is-gain {
  color: #8fd6a4;
}

.weather-vial-delta.is-loss {
  color: #f0a098;
}

.weather-fair {
  box-shadow: inset 0 0 0 1px rgba(90, 168, 112, 0.35);
}

.weather-fair .weather-vial-value {
  color: #b7e0c0;
}

.weather-overcast {
  box-shadow: inset 0 0 0 1px rgba(196, 168, 72, 0.32);
}

.weather-overcast .weather-vial-value {
  color: #ead58a;
}

.weather-squall {
  box-shadow: inset 0 0 0 1px rgba(214, 126, 58, 0.4);
}

.weather-squall .weather-vial-value {
  color: #f0b07a;
}

.weather-tempest {
  box-shadow: inset 0 0 0 1px rgba(196, 72, 64, 0.5);
  animation: tempest-pulse 1.8s ease-in-out infinite;
}

.weather-tempest .weather-vial-value {
  color: #f0a098;
}

.weather-aftershock {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f0c060;
}

.weather-vial.is-collapsing {
  position: relative;
  border-color: rgba(255, 140, 64, 0.78);
  background: rgba(92, 18, 8, 0.72);
  box-shadow:
    0 0 14px rgba(255, 88, 24, 0.55),
    inset 0 0 10px rgba(255, 120, 40, 0.28);
  animation: collapse-flame 1.35s ease-in-out infinite;
}

.weather-vial.is-collapsing .weather-vial-value,
.weather-vial.is-collapsing .weather-vial-label {
  color: #ffd0b0;
}

.weather-vial.is-withering {
  border-color: rgba(160, 72, 40, 0.55);
  background: rgba(42, 14, 8, 0.58);
  box-shadow: inset 0 0 0 1px rgba(180, 72, 36, 0.28);
}

.weather-vial.is-withering .weather-vial-value {
  color: #e8a078;
}

.collapse-front {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.82rem 4.2rem 0.88rem 1.05rem;
  background:
    radial-gradient(ellipse at 12% 0%, rgba(255, 92, 28, 0.32), transparent 46%),
    linear-gradient(165deg, rgba(78, 16, 8, 0.97) 0%, rgba(18, 6, 4, 0.98) 100%);
  border: 1px solid rgba(255, 132, 56, 0.72);
  clip-path: polygon(
    0 8px,
    14px 0,
    38px 7px,
    72% 0,
    86% 8px,
    calc(100% - 10px) 2px,
    100% 10px,
    100% calc(100% - 8px),
    calc(100% - 16px) 100%,
    64% calc(100% - 6px),
    22% 100%,
    0 calc(100% - 7px)
  );
  box-shadow:
    0 0 0 1px rgba(8, 2, 0, 0.7),
    0 0 32px rgba(220, 48, 16, 0.42),
    0 14px 28px rgba(0, 0, 0, 0.45);
}

.collapse-front::after {
  content: '';
  position: absolute;
  right: 1.05rem;
  top: 50%;
  width: 2.55rem;
  height: 2.55rem;
  transform: translateY(-50%);
  border-radius: 50%;
  background:
    radial-gradient(circle at 38% 32%, #ffe7a8 0%, #ff7a28 42%, #8a1808 78%, #2a0804 100%);
  box-shadow:
    0 0 16px rgba(255, 88, 24, 0.8),
    inset 0 0 8px rgba(255, 220, 140, 0.35);
  pointer-events: none;
}

.collapse-front.is-compound {
  box-shadow:
    0 0 0 1px rgba(8, 2, 0, 0.7),
    0 0 36px rgba(255, 48, 16, 0.48),
    0 14px 28px rgba(0, 0, 0, 0.45);
}

.collapse-embers {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 18% 82%, rgba(255, 180, 64, 0.55) 0 1.4px, transparent 1.8px),
    radial-gradient(circle at 72% 70%, rgba(255, 96, 32, 0.5) 0 1.2px, transparent 1.6px),
    radial-gradient(circle at 46% 90%, rgba(255, 220, 120, 0.45) 0 1px, transparent 1.4px);
  animation: ember-rise 2.4s linear infinite;
  opacity: 0.85;
}

.collapse-banner {
  position: relative;
  z-index: 1;
}

.collapse-kicker {
  margin: 0 0 0.12rem;
  font-family: var(--font-heading);
  font-size: var(--text-kicker);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #ffb078;
}

.collapse-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.48rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.05;
  text-transform: uppercase;
  color: #ffe0c0;
  text-shadow:
    0 0 16px rgba(255, 96, 32, 0.55),
    0 2px 12px rgba(0, 0, 0, 0.7);
}

.collapse-copy {
  margin: 0.22rem 0 0;
  max-width: 42rem;
  font-size: var(--text-base);
  line-height: 1.4;
  color: #f4d0b8;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes tempest-pulse {
  0%, 100% { background: rgba(8, 6, 2, 0.45); }
  50% { background: rgba(90, 18, 12, 0.55); }
}

@keyframes collapse-flame {
  0%, 100% {
    box-shadow:
      0 0 10px rgba(255, 88, 24, 0.42),
      inset 0 0 8px rgba(255, 120, 40, 0.18);
  }
  50% {
    box-shadow:
      0 0 18px rgba(255, 120, 40, 0.72),
      inset 0 0 14px rgba(255, 160, 64, 0.38);
  }
}

@keyframes ember-rise {
  0% { transform: translateY(8px); opacity: 0.35; }
  50% { opacity: 0.9; }
  100% { transform: translateY(-10px); opacity: 0.2; }
}

@media (prefers-reduced-motion: reduce) {
  .weather-tempest,
  .weather-vial.is-collapsing,
  .collapse-embers {
    animation: none;
  }
}

/* Tablet: the clock takes its own line so the vials stay a readable grid. */
@media (max-width: 1024px) {
  .weather-strip {
    border-radius: 18px;
  }

  .turn-clock {
    flex: 0 0 100%;
    justify-content: center;
  }

  /* Content height only: flex-grow would stretch the grid rows to fill. */
  .weather-vials {
    display: grid;
    flex: 0 0 auto;
    width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  }
}

@media (max-width: 720px) {
  .weather-strip {
    padding: 0.5rem 0.6rem;
  }

  .turn-clock {
    padding: 0.35rem 0.7rem;
  }

  .turn-clock-count {
    font-size: 1.7rem;
  }

  /* Labels stay: an icon and a number alone do not name the score. */
  .weather-vials {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.3rem;
  }

  /* The label takes the full cell so score names are not truncated. */
  .weather-vial {
    min-width: 0;
    grid-template-areas:
      'label label'
      'icon readout';
    column-gap: 0.32rem;
    padding: 0.26rem 0.4rem 0.3rem 0.4rem;
  }

  .weather-vial-label {
    letter-spacing: 0.06em;
  }

  .weather-vial-icon {
    font-size: var(--text-base);
  }

  .weather-vial-value {
    font-size: var(--text-lg);
  }

  .collapse-front {
    padding: 0.7rem 0.8rem 0.75rem;
    clip-path: none;
    border-radius: 4px 18px 4px 18px;
  }

  .collapse-front::after {
    display: none;
  }

  .collapse-title {
    font-size: 1.22rem;
  }

  .collapse-copy {
    font-size: var(--text-base);
  }
}
</style>
