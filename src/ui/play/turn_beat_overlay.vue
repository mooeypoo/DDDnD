<template>
  <section v-if="beat" class="turn-beat" :class="`kind-${beat.kind}`" role="status" aria-live="polite">
    <p class="beat-kicker">{{ kicker }}</p>
    <h3 class="beat-title">{{ beat.title }}</h3>
    <p class="beat-summary">{{ beat.summary }}</p>
    <p v-if="beat.flavor_text" class="beat-flavor">{{ beat.flavor_text }}</p>
    <ul v-if="beat.score_changes.length" class="beat-deltas">
      <li
        v-for="(change, index) in beat.score_changes"
        :key="`${change.score_id}-${index}`"
        :class="change.delta >= 0 ? 'gain' : 'loss'"
      >
        {{ formatScoreName(change.score_id) }}
        {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
      </li>
    </ul>
    <div class="beat-actions">
      <button class="beat-skip" type="button" @click="$emit('skip')">Skip beats</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import type { TurnBeat } from '@/ui/play/turn_theater'

const props = defineProps<{
  beat: TurnBeat | null
}>()

defineEmits<{
  skip: []
}>()

const kicker = computed(() => {
  switch (props.beat?.kind) {
    case 'aftershock':
      return 'Aftershock'
    case 'action':
      return 'You play'
    case 'consult':
      return 'You search'
    case 'event':
      return 'The system moves'
    case 'stakeholder':
      return 'A voice at the table'
    default:
      return 'The table'
  }
})

function formatScoreName(scoreId: string): string {
  return getMetricPresentation(scoreId).label
}
</script>

<style scoped>
.turn-beat {
  width: min(420px, 92%);
  padding: 0.85rem 1rem 0.75rem;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(18, 28, 32, 0.88) 0%, rgba(8, 10, 12, 0.86) 100%);
  border: 1px solid rgba(140, 196, 210, 0.28);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  text-align: center;
}

.kind-consult,
.kind-action {
  border-color: rgba(232, 196, 96, 0.4);
}

.kind-aftershock {
  border-color: rgba(240, 160, 72, 0.45);
}

.kind-stakeholder {
  border-color: rgba(169, 137, 250, 0.35);
}

.beat-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.64rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.beat-title {
  margin: 0 0 0.35rem;
  font-family: var(--font-heading);
  font-size: 1.15rem;
  color: var(--text-bright);
}

.beat-summary,
.beat-flavor {
  margin: 0 0 0.45rem;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--text-primary);
}

.beat-flavor {
  font-style: italic;
  color: var(--text-secondary);
}

.beat-deltas {
  list-style: none;
  margin: 0 0 0.55rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.3rem;
}

.beat-deltas li {
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
}

.gain { color: #b7e0c0; }
.loss { color: #f0a098; }

.beat-skip {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-heading);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}

.beat-skip:hover {
  color: var(--text-bright);
}
</style>
