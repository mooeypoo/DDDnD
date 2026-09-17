<template>
  <section
    v-if="beat"
    class="turn-beat"
    :class="[`kind-${beat.kind}`, beat.kind === 'aftershock' && `tone-${tone}`]"
    role="status"
    aria-live="polite"
  >
    <p class="beat-kicker">{{ kicker }}</p>
    <p v-if="beatCount > 1" class="beat-progress">{{ beatIndex }} of {{ beatCount }}</p>
    <h3 class="beat-title">{{ beat.title }}</h3>
    <svg
      v-if="beat.kind === 'aftershock'"
      class="impact-rule"
      viewBox="0 0 200 12"
      aria-hidden="true"
    >
      <polyline points="8,6 38,4 62,8 96,3 128,9 162,5 192,7" />
    </svg>
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
      <button class="beat-continue" type="button" @click="$emit('continue')">
        {{ isLastBeat ? 'Done' : 'Continue' }}
      </button>
      <button v-if="!isLastBeat" class="beat-skip" type="button" @click="$emit('skip')">
        Skip remaining
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { impactTone } from '@/ui/play/table_moment'
import { beatKicker, type TurnBeat } from '@/ui/play/turn_theater'

const props = defineProps<{
  beat: TurnBeat | null
  beatIndex?: number
  beatCount?: number
}>()

defineEmits<{
  continue: []
  skip: []
}>()

const beatIndex = computed(() => props.beatIndex ?? 1)
const beatCount = computed(() => props.beatCount ?? 1)
const isLastBeat = computed(() => beatIndex.value >= beatCount.value)
const kicker = computed(() => beatKicker(props.beat?.kind))
const tone = computed(() => impactTone(props.beat?.score_changes ?? []))

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
  width: min(420px, 92%);
  padding: 0.95rem 1.15rem 0.9rem;
  border-radius: 3px 34px 3px 34px;
  background:
    linear-gradient(165deg, rgba(42, 24, 12, 0.96) 0%, rgba(12, 8, 5, 0.96) 100%);
  border: 1px solid rgba(232, 168, 96, 0.58);
  box-shadow:
    0 0 0 1px rgba(8, 4, 2, 0.75),
    0 0 28px rgba(232, 140, 64, 0.42),
    0 16px 36px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
}

.kind-aftershock.tone-blow {
  border-color: rgba(240, 140, 88, 0.7);
  box-shadow:
    0 0 0 1px rgba(8, 4, 2, 0.75),
    0 0 30px rgba(232, 88, 48, 0.5),
    0 16px 36px rgba(0, 0, 0, 0.55);
}

.kind-aftershock.tone-boon {
  border-color: rgba(150, 210, 140, 0.6);
  box-shadow:
    0 0 0 1px rgba(8, 4, 2, 0.75),
    0 0 30px rgba(96, 176, 112, 0.45),
    0 16px 36px rgba(0, 0, 0, 0.55);
}

.kind-aftershock .beat-kicker {
  margin-bottom: 0.28rem;
  font-family: var(--font-heading);
  font-size: 1.28rem;
  font-weight: 700;
  letter-spacing: 0.36em;
  line-height: 1.05;
  text-shadow:
    0 0 18px rgba(255, 210, 96, 0.55),
    0 2px 14px rgba(0, 0, 0, 0.8);
}

.kind-aftershock .beat-title {
  font-size: 1.42rem;
  line-height: 1.15;
  letter-spacing: 0.04em;
}

.kind-aftershock .beat-summary,
.kind-aftershock .beat-flavor {
  font-size: 0.92rem;
}

.kind-aftershock .beat-summary,
.kind-aftershock .beat-flavor,
.kind-aftershock .beat-progress {
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.7);
}

.kind-aftershock .beat-deltas li {
  background: rgba(0, 0, 0, 0.38);
  padding: 0.15rem 0.4rem;
}

.kind-aftershock .beat-continue {
  background: rgba(42, 30, 12, 0.9);
  border-color: rgba(232, 196, 96, 0.62);
}

.impact-rule {
  display: block;
  width: min(14rem, 70%);
  height: 12px;
  margin: 0.1rem auto 0.45rem;
}

.impact-rule polyline {
  fill: none;
  stroke: rgba(240, 208, 128, 0.85);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tone-blow .beat-kicker,
.tone-blow .beat-title {
  color: #f6c8b4;
  text-shadow:
    0 0 14px rgba(232, 88, 48, 0.55),
    0 2px 16px rgba(0, 0, 0, 0.75);
}

.tone-blow .impact-rule polyline {
  stroke: rgba(255, 168, 112, 0.9);
  filter: drop-shadow(0 0 4px rgba(232, 88, 48, 0.55));
}

.tone-boon .beat-kicker,
.tone-boon .beat-title {
  color: #d4f0c8;
  text-shadow:
    0 0 14px rgba(96, 176, 112, 0.5),
    0 2px 16px rgba(0, 0, 0, 0.75);
}

.tone-boon .impact-rule polyline {
  stroke: rgba(186, 232, 176, 0.9);
  filter: drop-shadow(0 0 4px rgba(96, 176, 112, 0.5));
}

.tone-mixed .beat-kicker,
.tone-mixed .beat-title {
  color: #f8e4a8;
  text-shadow:
    0 0 14px rgba(232, 176, 64, 0.5),
    0 2px 16px rgba(0, 0, 0, 0.75);
}

.kind-stakeholder {
  border-color: rgba(169, 137, 250, 0.35);
}

.beat-kicker {
  margin: 0 0 0.15rem;
  font-size: 0.64rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.beat-progress {
  margin: 0 0 0.35rem;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-secondary);
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

.beat-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.beat-continue {
  appearance: none;
  min-width: 8.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(232, 196, 96, 0.55);
  background: rgba(42, 30, 12, 0.92);
  color: var(--dng-title-gold);
  font-family: var(--font-heading);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.beat-continue:hover {
  color: var(--text-bright);
}

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

@media (prefers-reduced-motion: reduce) {
  .turn-beat {
    backdrop-filter: none;
  }
}

@media (max-width: 720px) {
  .kind-aftershock .beat-kicker {
    font-size: 1.08rem;
    letter-spacing: 0.26em;
  }

  .kind-aftershock .beat-title {
    font-size: 1.18rem;
  }

  .kind-aftershock .beat-continue {
    min-width: 9rem;
    padding: 0.5rem 1rem;
  }
}
</style>
