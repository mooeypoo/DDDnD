<template>
  <!--
    One of a topic's own scores (M4.17): what players read, where it starts,
    and what changes it. Built on the editor frame (§9.1). Higher is better
    in DDDnD, so a score is named for the good thing ("Rest", not "Fatigue").
  -->
  <div v-if="score" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Score · yours</span>
        <h1 class="editor-title">{{ score.name || 'Unnamed score' }}</h1>
      </div>
      <div class="head-actions">
        <button v-if="!confirming" type="button" class="button button-danger" @click="confirming = true">Delete</button>
      </div>
      <div v-if="confirming" class="head-confirm confirm" role="group" aria-label="Confirm">
        <p class="confirm-text">
          Delete “{{ score.name || 'this score' }}”? No scenario tracks it any more.
          <template v-if="changes.length"> {{ changes.length === 1 ? 'One of your own items stops' : `${changes.length} of your own items stop` }} changing it: {{ changes.map((change) => change.name).join(', ') }}.</template>
          Classes stop favouring it, challenges stop changing it and coupling rules stop cutting it.
          <template v-if="lost.length"> {{ lost.length === 1 ? 'This coupling rule only works with it, so it goes too' : 'These coupling rules only work with it, so they go too' }}: {{ lost.map((rule) => rule.name || 'Unnamed coupling rule').join(', ') }}.</template>
          Anything that still checks it (a condition, an ending) will show under the checks.
        </p>
        <button type="button" class="button button-quiet" @click="confirming = false">Keep it</button>
        <button type="button" class="button button-danger" @click="remove">Delete</button>
      </div>
    </div>

    <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>

    <section class="editor-section" aria-labelledby="score-words">
      <h2 id="score-words" class="editor-section-title">What players read</h2>
      <label class="field">Name
        <input data-field="name" :value="score.name" :maxlength="limits.text.name" @input="rename(text($event))" />
        <span class="field-hint">Named so that more is better: "Rest", not "Fatigue". The game reads every score that way.</span>
      </label>
      <label class="field field-short">Short name
        <input data-field="short_name" :value="score.short_name" :maxlength="limits.text.short_name" @input="set({ short_name: text($event) })" />
        <span class="field-hint">Shown where space is tight, on the play screen and share cards.</span>
      </label>
      <label class="field">What it measures, in a sentence
        <textarea data-field="description" :value="score.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
      </label>
    </section>

    <section class="editor-section" aria-labelledby="score-start">
      <h2 id="score-start" class="editor-section-title">Where it starts</h2>
      <label v-for="scenario in scenarios" :key="scenario.id" class="field field-short">{{ scenarios.length > 1 ? scenario.name : 'Starting value, 0 to 100' }}
        <input type="number" min="0" max="100" step="1" :value="scenario.starting_scores[score.id] ?? score.default_value" @change="setStart(scenario.id, $event)" />
      </label>
      <p class="field-hint">Low starts are where the pressure is: the game's scenarios start their weakest scores around 30.</p>
    </section>

    <section class="editor-section" aria-labelledby="score-changed-by">
      <h2 id="score-changed-by" class="editor-section-title">What changes it</h2>
      <p v-if="changes.length === 0" class="field-hint">Nothing yet. On a card or event, "+ Add a change" and pick “{{ score.name }}”.</p>
      <ul v-else class="change-list">
        <li v-for="change in changes" :key="`${change.section}/${change.id}`">
          <button v-if="change.section === 'cards' || change.section === 'events'" type="button" class="link-button" @click="emit('open', { kind: 'item', section: change.section, ref: refOf(change.section, change.id) })">{{ change.name }}</button>
          <span v-else>{{ change.name }}</span>
        </li>
      </ul>
    </section>
  </div>
  <p v-else class="loading" role="status">That score isn't in this pack.</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { couplingLostWith, ownChangesToScore, putContent, removeOwnScore, toFillIn, withScoreName, type DraftPack } from '@/domains/authoring'
import type { Score, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import type { Selection } from '@studio/workspace/selection'

const props = defineProps<{ draft: DraftPack; scoreId: string }>()
const emit = defineEmits<{ change: [draft: DraftPack]; open: [selection: Selection]; removed: [] }>()

const limits = CONTENT_LIMITS
const confirming = ref(false)
watch(() => props.scoreId, () => {
  confirming.value = false
})

const score = computed(() => props.draft.content.scores[props.scoreId] as Score | undefined)
const scenarios = computed(() => Object.values(props.draft.content.scenarios))
/** The author's own items that change it (the domain's ownChangesToScore). */
const changes = computed(() => ownChangesToScore(props.draft, props.scoreId))
/** Coupling rules that go with it (the domain's couplingLostWith). */
const lost = computed(() => couplingLostWith(props.draft, props.scoreId))

/** What the domain says it still needs, in words (toFillIn). */
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((item) => item.section === 'scores' && item.ref.id === props.scoreId)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of its own' : 'what it measures, in a sentence'))
})

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

/** The short name follows the name until the author writes their own (the domain's withScoreName). */
function rename(name: string) {
  if (!score.value) return
  emit('change', putContent(props.draft, 'scores', withScoreName(score.value, name)))
}

function set(patch: Partial<Score>) {
  if (!score.value) return
  emit('change', putContent(props.draft, 'scores', { ...score.value, ...patch }))
}

/** A scenario's starting value, clamped to the game's 0–100 as the author types; the score's default follows the first scenario. */
function setStart(scenarioId: string, event: Event) {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  if (!Number.isFinite(parsed) || !score.value) return
  const value = Math.min(100, Math.max(0, parsed))
  const scenario = props.draft.content.scenarios[scenarioId]
  let next = putContent(props.draft, 'scenarios', { ...scenario, starting_scores: { ...scenario.starting_scores, [props.scoreId]: value } })
  if (scenarios.value[0]?.id === scenarioId) next = putContent(next, 'scores', { ...score.value, default_value: value })
  emit('change', next)
}

function refOf(section: 'cards' | 'events', id: string): VersionRef {
  return { id, version: props.draft.content[section][id].version }
}

function remove() {
  emit('change', removeOwnScore(props.draft, props.scoreId))
  emit('removed')
}
</script>

<style scoped>
.change-list {
  margin: 0;
  padding-left: 1.125rem;
}

.link-button {
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-gold);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.field-short {
  max-width: 16rem;
}

.loading {
  margin: 0;
}
</style>
