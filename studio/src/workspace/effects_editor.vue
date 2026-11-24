<template>
  <!--
    What a card or event changes (§4.1): score and council changes as rows of
    picker + amount. Pickers offer only the scenario's own scores and council,
    so a change can't point at something that isn't there. Up and down show as
    +/− and in words, not by colour alone (§10).
  -->
  <div class="effects">
    <fieldset class="effect-group">
      <legend class="effect-legend">Scores</legend>
      <p v-if="scoreChanges.length === 0" class="effect-empty">No score changes yet.</p>
      <div v-for="(change, index) in scoreChanges" :key="`s${index}`" class="effect-row" :class="tone(change.delta)">
        <label class="effect-field">
          <span class="visually-hidden">Score</span>
          <select :value="change.score_id" @change="updateScore(index, { score_id: selectValue($event) })">
            <option v-for="option in scoreOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
          </select>
        </label>
        <label class="effect-field effect-amount">
          <span class="visually-hidden">Change to {{ nameOf(scoreOptions, change.score_id) }}</span>
          <input type="number" :min="delta.min" :max="delta.max" step="1" :value="change.delta" @change="updateScore(index, { delta: numberValue($event, change.delta) })" />
        </label>
        <span class="effect-word" aria-hidden="true">{{ word(change.delta) }}</span>
        <button type="button" class="effect-remove" :aria-label="`Remove the change to ${nameOf(scoreOptions, change.score_id)}`" @click="removeScore(index)">Remove</button>
      </div>
      <button v-if="unusedScores.length > 0" type="button" class="button button-quiet effect-add" @click="addScore">+ Add a score change</button>
    </fieldset>

    <fieldset class="effect-group">
      <legend class="effect-legend">Council</legend>
      <p v-if="stakeholderChanges.length === 0" class="effect-empty">Nobody at the table reacts yet.</p>
      <div v-for="(change, index) in stakeholderChanges" :key="`p${index}`" class="effect-row" :class="tone(change.delta)">
        <label class="effect-field">
          <span class="visually-hidden">Council member</span>
          <select :value="change.stakeholder_id" @change="updateStakeholder(index, { stakeholder_id: selectValue($event) })">
            <option v-for="option in stakeholderOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
            <option v-if="!seated(change.stakeholder_id)" :value="change.stakeholder_id">{{ unseatedName(change.stakeholder_id) }} (not seated)</option>
          </select>
        </label>
        <label class="effect-field effect-amount">
          <span class="visually-hidden">Change to {{ nameOf(stakeholderOptions, change.stakeholder_id) }}'s satisfaction</span>
          <input type="number" :min="delta.min" :max="delta.max" step="1" :value="change.delta" @change="updateStakeholder(index, { delta: numberValue($event, change.delta) })" />
        </label>
        <span class="effect-word" aria-hidden="true">{{ !seated(change.stakeholder_id) ? 'does nothing: not seated' : change.delta > 0 ? 'happier' : change.delta < 0 ? 'unhappier' : 'no change' }}</span>
        <button type="button" class="effect-remove" :aria-label="`Remove the change to ${nameOf(stakeholderOptions, change.stakeholder_id)}`" @click="removeStakeholder(index)">Remove</button>
      </div>
      <button v-if="unusedStakeholders.length > 0" type="button" class="button button-quiet effect-add" @click="addStakeholder">+ Add a council reaction</button>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { ScoreChange, StakeholderChange } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { studio } from '@studio/state/studio_state'

interface Option { id: string; name: string }

const props = defineProps<{
  scoreChanges: ScoreChange[]
  stakeholderChanges: StakeholderChange[]
  scoreOptions: Option[]
  stakeholderOptions: Option[]
}>()
const emit = defineEmits<{ change: [effects: { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }] }>()

const delta = CONTENT_LIMITS.numbers.delta
const unusedScores = computed(() => props.scoreOptions.filter((option) => !props.scoreChanges.some((change) => change.score_id === option.id)))
const unusedStakeholders = computed(() => props.stakeholderOptions.filter((option) => !props.stakeholderChanges.some((change) => change.stakeholder_id === option.id)))

function seated(id: string): boolean {
  return props.stakeholderOptions.some((option) => option.id === id)
}

/** Someone not at the table keeps their name, from the council notes (M4.5a). */
function unseatedName(id: string): string {
  return studio.notes.find((note) => note.stakeholder_id === id)?.name ?? id
}

function nameOf(options: Option[], id: string): string {
  return options.find((option) => option.id === id)?.name ?? unseatedName(id)
}

function tone(value: number): string {
  return value > 0 ? 'tone-up' : value < 0 ? 'tone-down' : 'tone-none'
}

function word(value: number): string {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'no change'
}

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function numberValue(event: Event, fallback: number): number {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  return Number.isFinite(parsed) ? Math.min(delta.max, Math.max(delta.min, parsed)) : fallback
}

function emitWith(scores: ScoreChange[], people: StakeholderChange[]) {
  emit('change', { score_changes: scores, stakeholder_changes: people })
}

function updateScore(index: number, patch: Partial<ScoreChange>) {
  emitWith(props.scoreChanges.map((change, i) => (i === index ? { ...change, ...patch } : change)), props.stakeholderChanges)
}

function removeScore(index: number) {
  emitWith(props.scoreChanges.filter((_, i) => i !== index), props.stakeholderChanges)
}

function addScore() {
  emitWith([...props.scoreChanges, { score_id: unusedScores.value[0].id, delta: 1 }], props.stakeholderChanges)
}

function updateStakeholder(index: number, patch: Partial<StakeholderChange>) {
  emitWith(props.scoreChanges, props.stakeholderChanges.map((change, i) => (i === index ? { ...change, ...patch } : change)))
}

function removeStakeholder(index: number) {
  emitWith(props.scoreChanges, props.stakeholderChanges.filter((_, i) => i !== index))
}

function addStakeholder() {
  emitWith(props.scoreChanges, [...props.stakeholderChanges, { stakeholder_id: unusedStakeholders.value[0].id, delta: 1 }])
}
</script>

<style scoped>
.effects {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.effect-group {
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.effect-legend {
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.effect-empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.effect-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--forge-hairline);
}

.tone-up { border-color: rgba(143, 209, 143, 0.5); }
.tone-down { border-color: rgba(239, 138, 106, 0.55); }

.effect-field select,
.effect-field input {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-ground);
  color: var(--forge-text-bright);
  font-family: var(--forge-font-body);
  font-size: 1rem;
}

.effect-field select {
  min-width: 13rem;
}

.effect-amount input {
  width: 5.5rem;
}

.effect-word {
  min-width: 4.5rem;
  font-size: 0.875rem;
}

.tone-up .effect-word { color: var(--forge-up); }
.tone-down .effect-word { color: var(--forge-down); }
.tone-none .effect-word { color: var(--forge-text-secondary); }

.effect-remove {
  margin-left: auto;
  min-height: 2.25rem;
  padding: 0 0.625rem;
  border: none;
  background: none;
  color: var(--forge-text-secondary);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}

.effect-add {
  align-self: flex-start;
}
</style>
