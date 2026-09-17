<template>
  <div
    class="weather-strip"
    :class="{
      'is-highlighted': highlight === 'scores',
      'aftershock-highlighted': highlight === 'aftershocks',
      'is-bound': Boolean(couplingLabel),
    }"
    role="group"
    aria-label="System weather"
  >
    <p class="weather-clock" :class="{ 'is-late': isLate }">
      <span class="weather-clock-kicker">Turn</span>
      <span class="weather-clock-value">{{ currentTurn }}</span>
      <span class="weather-clock-of">of {{ maxTurns }}</span>
    </p>

    <ol class="weather-vials">
      <li
        v-for="meter in meters"
        :key="meter.id"
        class="weather-vial"
        :class="`weather-${meter.weather}`"
        :title="`${meter.label}: ${meter.value} — ${meter.weatherLabel}`"
      >
        <span class="weather-vial-icon" aria-hidden="true">{{ meter.icon }}</span>
        <span class="weather-vial-label">{{ meter.shortLabel }}</span>
        <span class="weather-vial-value">{{ meter.value }}</span>
        <span class="visually-hidden">{{ meter.label }} {{ meter.value }}, {{ meter.weatherLabel }}</span>
      </li>
    </ol>

    <p v-if="aftershockCount > 0" class="weather-aftershock" role="status">
      {{ aftershockCount }} aftershock{{ aftershockCount === 1 ? '' : 's' }} waiting
    </p>

    <p
      v-if="couplingLabel"
      class="weather-bound"
      role="status"
      :title="couplingDetail"
    >
      {{ couplingLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { getCollapseWarnings } from '@/ui/composables/system_coupling'
import {
  compactCouplingLabel,
  describeScoreWeather,
  isLateTurnClock,
  shortMetricLabel,
} from '@/ui/play/weather_band'

const props = defineProps<{
  scores: Record<string, number>
  currentTurn: number
  maxTurns: number
  aftershockCount?: number
  highlight?: string | null
  isTutorial?: boolean
}>()

const aftershockCount = computed(() => props.aftershockCount ?? 0)

const collapseWarnings = computed(() => getCollapseWarnings(props.scores))
const couplingLabel = computed(() => {
  return compactCouplingLabel(collapseWarnings.value.map((warning) => warning.title))
})
const couplingDetail = computed(() => {
  return collapseWarnings.value
    .map((warning) => `${warning.title}: ${warning.description}`)
    .join(' ')
})
const isLate = computed(() => {
  return isLateTurnClock(props.currentTurn, props.maxTurns, {
    isTutorial: props.isTutorial,
  })
})

const meters = computed(() => {
  return Object.entries(props.scores).map(([id, value]) => {
    const presentation = getMetricPresentation(id)
    const weather = describeScoreWeather(value)
    return {
      id,
      value: Math.round(value),
      icon: presentation.icon,
      label: presentation.label,
      shortLabel: shortMetricLabel(id, presentation.label),
      weather: weather.weather,
      weatherLabel: weather.label,
    }
  })
})
</script>

<style scoped>
.weather-strip {
  display: flex;
  align-items: center;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.7rem;
  background:
    linear-gradient(180deg, rgba(28, 20, 8, 0.92) 0%, rgba(14, 10, 4, 0.88) 100%);
  border: 1px solid rgba(176, 132, 42, 0.38);
  border-radius: 999px;
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
  border-color: rgba(196, 72, 64, 0.42);
}

.weather-strip.aftershock-highlighted .weather-aftershock {
  color: #fff3c0;
  text-shadow: 0 0 12px rgba(240, 192, 80, 0.7);
}

.weather-clock {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  font-family: var(--font-heading);
  color: var(--dng-title-gold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.weather-clock-kicker {
  font-size: 0.62rem;
  opacity: 0.72;
}

.weather-clock-value {
  font-size: 1.15rem;
  font-weight: 600;
}

.weather-clock-of {
  font-size: 0.68rem;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

.weather-clock.is-late {
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
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: 0.22rem;
  min-width: 4.6rem;
  padding: 0.18rem 0.5rem 0.18rem 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 6, 2, 0.45);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.weather-vial-icon {
  font-size: 0.78rem;
}

.weather-vial-label {
  color: var(--text-secondary);
}

.weather-vial-value {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--text-bright);
  justify-self: end;
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
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f0c060;
}

.weather-bound {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f0a098;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(196, 72, 64, 0.45);
  background: rgba(72, 18, 12, 0.45);
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

@media (prefers-reduced-motion: reduce) {
  .weather-tempest {
    animation: none;
  }
}

@media (max-width: 720px) {
  .weather-strip {
    border-radius: 18px;
    padding: 0.5rem 0.6rem;
  }

  .weather-vial-label {
    display: none;
  }

  .weather-vial {
    min-width: 0;
    grid-template-columns: auto auto;
  }

  .weather-bound {
    width: 100%;
    text-align: center;
  }
}
</style>
