<template>
  <!--
    A look at one of the game's scenarios before anything is copied (the
    first-screen audit, M4.28): its scores and where each starts, its
    council and its deck, by name. A native modal dialog: focus stays inside,
    Escape closes it, and nothing is made until "Start from this scenario".
  -->
  <dialog ref="dialog" class="preview" :aria-labelledby="titleId" @close="$emit('close')" @cancel="$emit('close')">
    <div class="preview-head">
      <span class="kind-pill pill-retelling">One of the game's scenarios</span>
      <h2 :id="titleId" class="preview-title">{{ choice.name }}</h2>
    </div>

    <p v-if="failed" class="field-problem" role="alert">This scenario couldn't be loaded: {{ failed }}</p>
    <p v-else-if="!preview" class="loading" role="status">Loading the scenario…</p>
    <template v-else>
      <p class="preview-text">{{ preview.description }}</p>
      <div class="preview-grid">
        <section aria-labelledby="preview-scores">
          <h3 id="preview-scores" class="preview-label">Where it starts · {{ preview.turns }} turns</h3>
          <ul class="scores">
            <li v-for="score in preview.scores" :key="score.name" class="score">
              <span>{{ score.name }}</span>
              <span class="bar" aria-hidden="true"><span class="bar-fill" :class="{ low: score.start < LOW }" :style="{ width: `${score.start}%` }"></span></span>
              <span class="score-value">{{ score.start }}</span>
            </li>
          </ul>
        </section>
        <section aria-labelledby="preview-council">
          <h3 id="preview-council" class="preview-label">The council</h3>
          <ul class="people">
            <li v-for="name in preview.council" :key="name">{{ name }}</li>
          </ul>
          <h3 class="preview-label deck-label">The deck</h3>
          <p>{{ preview.cards }} cards and {{ preview.events }} events from the game. Yours to keep, take out, or replace with your own.</p>
        </section>
      </div>
      <p class="preview-text">Your copy plays exactly like this. Then you make it yours; the original stays as it is.</p>
    </template>

    <div class="preview-actions">
      <button type="button" class="button button-primary" :disabled="!preview || starting" @click="$emit('start')">
        <span :class="{ working: starting }">{{ starting ? 'Copying…' : guided ? 'Start the round from this one' : 'Start from this scenario' }}</span>
      </button>
      <button type="button" class="button button-quiet" @click="close">Keep looking</button>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { ScenarioPreview } from '@/domains/authoring'
import { previewScenario, type BaseScenarioChoice } from '@studio/content/first_party'

const props = defineProps<{ choice: Pick<BaseScenarioChoice, 'ref' | 'name'>; guided: boolean; starting: boolean }>()
defineEmits<{ start: []; close: [] }>()

/** Below this a starting score shows warmer: where it hurts, which the round teaches (§5). */
const LOW = 40
const titleId = `preview-${props.choice.ref.id}`

const dialog = ref<HTMLDialogElement | null>(null)
const preview = ref<ScenarioPreview | null>(null)
const failed = ref<string | null>(null)

onMounted(async () => {
  dialog.value?.showModal?.()
  try {
    preview.value = await previewScenario(props.choice.ref)
  } catch (error) {
    failed.value = (error as Error).message
  }
})

function close() {
  // The dialog's own close event tells the page (and the browser returns focus to what opened it)
  if (dialog.value?.open) dialog.value.close()
  else dialog.value?.dispatchEvent(new Event('close'))
}
</script>

<style scoped>
.preview {
  width: min(42rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 1.5rem 1.75rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
  color: var(--forge-text);
  box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.6);
}

.preview[open] {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview::backdrop {
  background: rgba(0, 0, 0, 0.6);
}

.preview-head {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-title {
  margin: 0;
  font-size: 1.5rem;
}

.preview-text {
  margin: 0;
  line-height: 1.55;
}

.preview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1rem 1.75rem;
  font-size: 0.9375rem;
}

.preview-grid p {
  margin: 0;
}

.preview-label {
  margin: 0 0 0.5rem;
  font-family: var(--forge-font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.deck-label {
  margin-top: 1rem;
}

.scores,
.people {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.people {
  color: var(--forge-text-bright);
}

.score {
  display: grid;
  grid-template-columns: 9.5rem 1fr 2rem;
  gap: 0.625rem;
  align-items: center;
  font-variant-numeric: tabular-nums;
}

.bar {
  height: 0.375rem;
  border-radius: 999px;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  background: var(--forge-gold);
}

.bar-fill.low {
  background: var(--forge-down);
}

.score-value {
  text-align: right;
  color: var(--forge-text-bright);
}

.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--forge-hairline);
}

@media (max-width: 40rem) {
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .score {
    grid-template-columns: 8rem 1fr 2rem;
  }
}
</style>
