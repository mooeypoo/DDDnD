<template>
  <!--
    What a card, event, aftershock or reaction changes (§4.1, slice 3b): one
    list of scores and council members, each with its amount. A new change
    starts in one picker that can also bring someone to the table, so the
    author never leaves this editor to connect a member. Up and down show as
    +/− and in words, not by colour alone (§10).
  -->
  <div ref="root" class="effects">
    <p v-if="rows.length === 0" class="effect-empty">It changes nothing yet.</p>
    <ul v-else class="effect-list" aria-label="What it changes">
      <li v-for="row in rows" :key="row.key" class="effect-row" :class="tone(row.delta)">
        <span class="effect-target">
          <span class="effect-name">{{ row.name }}</span>
          <span class="effect-kind">{{ row.kind === 'score' ? 'score' : row.seated ? 'council' : 'council · not seated' }}</span>
        </span>
        <label class="effect-field effect-amount">
          <span class="visually-hidden">{{ row.kind === 'score' ? `Change to ${row.name}` : `Change to ${row.name}'s satisfaction` }}</span>
          <input type="number" :min="delta.min" :max="delta.max" step="1" :value="row.delta" @change="setDelta(row, numberValue($event, row.delta))" />
        </label>
        <span class="effect-word" aria-hidden="true">{{ row.kind === 'score' ? word(row.delta) : row.seated ? SATISFACTION_WORD : 'does nothing: not seated' }}</span>
        <button type="button" class="effect-remove" :aria-label="`Remove the change to ${row.name}`" @click="remove(row)">Remove</button>
      </li>
    </ul>

    <ChangeTargetPicker
      v-if="picking"
      :scores="unusedScores"
      :members="unusedMembers"
      :gameMembers="gameMembers"
      :knownNames="knownNames"
      :canSeat="seatsLeft > 0"
      :seatsLeft="seatsLeft"
      @score="addScore"
      @member="addMember"
      @create="(name) => { picking = false; emit('createMember', name) }"
      @seat="(memberRef) => { picking = false; emit('seatMember', memberRef) }"
      @cancel="closePicker"
    />
    <button v-else ref="addButton" type="button" class="button button-quiet effect-add" @click="picking = true">+ Add a change</button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import { SATISFACTION_WORD } from '@/domains/authoring'
import type { ScoreChange, StakeholderChange, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { studio } from '@studio/state/studio_state'
import ChangeTargetPicker from '@studio/workspace/change_target_picker.vue'

interface Option { id: string; name: string }
type Row = { key: string; kind: 'score' | 'member'; id: string; name: string; delta: number; seated: boolean }

const props = withDefaults(defineProps<{
  scoreChanges: ScoreChange[]
  stakeholderChanges: StakeholderChange[]
  scoreOptions: Option[]
  stakeholderOptions: Option[]
  /** The game's members who aren't seated, offered "seat them and add". */
  gameMembers?: Array<{ ref: VersionRef; name: string }>
  /** Free seats at the table: a new or game member needs one. */
  seatsLeft?: number
}>(), { gameMembers: () => [], seatsLeft: 0 })
const emit = defineEmits<{
  change: [effects: { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }]
  /** "+ “name” as a new council member": the parent makes, seats and connects them (connectNewMember). */
  createMember: [name: string]
  /** One of the game's members: the parent seats and connects them (connectGameMember). */
  seatMember: [ref: VersionRef]
}>()

const delta = CONTENT_LIMITS.numbers.delta
const picking = ref(false)
const addButton = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLElement | null>(null)

function seated(id: string): boolean {
  return props.stakeholderOptions.some((option) => option.id === id)
}

/** Someone not at the table keeps their name, from the council notes (M4.5a). */
function unseatedName(id: string): string {
  return studio.notes.find((note) => note.stakeholder_id === id)?.name ?? props.gameMembers.find((member) => member.ref.id === id)?.name ?? id
}

const rows = computed<Row[]>(() => [
  ...props.scoreChanges.map((change) => ({ key: `s/${change.score_id}`, kind: 'score' as const, id: change.score_id, name: props.scoreOptions.find((option) => option.id === change.score_id)?.name ?? change.score_id, delta: change.delta, seated: true })),
  ...props.stakeholderChanges.map((change) => ({ key: `m/${change.stakeholder_id}`, kind: 'member' as const, id: change.stakeholder_id, name: props.stakeholderOptions.find((option) => option.id === change.stakeholder_id)?.name ?? unseatedName(change.stakeholder_id), delta: change.delta, seated: seated(change.stakeholder_id) })),
])

const unusedScores = computed(() => props.scoreOptions.filter((option) => !props.scoreChanges.some((change) => change.score_id === option.id)))
const unusedMembers = computed(() => props.stakeholderOptions.filter((option) => !props.stakeholderChanges.some((change) => change.stakeholder_id === option.id)))
const knownNames = computed(() => [...props.stakeholderOptions.map((option) => option.name), ...props.gameMembers.map((member) => member.name)])

function tone(value: number): string {
  return value > 0 ? 'tone-up' : value < 0 ? 'tone-down' : 'tone-none'
}

function word(value: number): string {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'no change'
}

function numberValue(event: Event, fallback: number): number {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  return Number.isFinite(parsed) ? Math.min(delta.max, Math.max(delta.min, parsed)) : fallback
}

function emitWith(scores: ScoreChange[], people: StakeholderChange[]) {
  emit('change', { score_changes: scores, stakeholder_changes: people })
}

function setDelta(row: Row, value: number) {
  if (row.kind === 'score') emitWith(props.scoreChanges.map((change) => (change.score_id === row.id ? { ...change, delta: value } : change)), props.stakeholderChanges)
  else emitWith(props.scoreChanges, props.stakeholderChanges.map((change) => (change.stakeholder_id === row.id ? { ...change, delta: value } : change)))
}

function remove(row: Row) {
  if (row.kind === 'score') emitWith(props.scoreChanges.filter((change) => change.score_id !== row.id), props.stakeholderChanges)
  else emitWith(props.scoreChanges, props.stakeholderChanges.filter((change) => change.stakeholder_id !== row.id))
}

/** A new row starts at +1; its amount is focused, ready to type. */
async function focusNewAmount(key: string) {
  picking.value = false
  await nextTick()
  const index = rows.value.findIndex((row) => row.key === key)
  root.value?.querySelectorAll<HTMLInputElement>('.effect-amount input')[index]?.focus()
}

function addScore(id: string) {
  emitWith([...props.scoreChanges, { score_id: id, delta: 1 }], props.stakeholderChanges)
  void focusNewAmount(`s/${id}`)
}

function addMember(id: string) {
  emitWith(props.scoreChanges, [...props.stakeholderChanges, { stakeholder_id: id, delta: 1 }])
  void focusNewAmount(`m/${id}`)
}

async function closePicker() {
  picking.value = false
  await nextTick()
  addButton.value?.focus()
}
</script>

<style scoped>
.effects {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.effect-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.effect-target {
  flex: 1 1 13rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-left: 0.25rem;
}

.effect-name {
  color: var(--forge-text-bright);
  overflow-wrap: anywhere;
}

.effect-kind {
  font-size: 0.75rem;
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
